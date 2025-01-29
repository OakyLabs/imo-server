import type { Page } from "playwright";
import { EnqueueHandler, scrape_many } from "../config/wrapper";
import { get_concelhos, get_on_methods } from "../config/local-storage";
import {
  common_parsing_errors,
  ParsingErrorV1,
} from "../events/errors/parsing-error";
import { resolve_url } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";

const URLS = {
  leilao_presencial: (page = 1) =>
    `https://www.lismed.com/?page=bem_list&natureza=IMOVEL&modalidade_venda=leilao_presencial&process_type=&order=&tipo_bem_id=&distritoId=&concelhoId=&freguesiaId=&greaterThan=&lowerThan=&freeSearch=&pn=${page}`,
  leilao_online: (page = 1) =>
    `https://www.lismed.com/?page=bem_list&natureza=IMOVEL&modalidade_venda=leilao_online&process_type=&order=&tipo_bem_id=&distritoId=&concelhoId=&freguesiaId=&greaterThan=&lowerThan=&freeSearch=&pn=${page}`,
  negociacao_particular: (page = 1) =>
    `https://www.lismed.com/?page=bem_list&natureza=IMOVEL&modalidade_venda=negociacao_particular&process_type=&order=&tipo_bem_id=&distritoId=&concelhoId=&freguesiaId=&greaterThan=&lowerThan=&freeSearch=&pn=${page}`,
  carta_fechada: (page = 1) =>
    `https://www.lismed.com/?page=bem_list&natureza=IMOVEL&modalidade_venda=carta_fechada&process_type=&order=&tipo_bem_id=&distritoId=&concelhoId=&freguesiaId=&greaterThan=&lowerThan=&freeSearch=&pn=${page}`,
};

export const scrape_lismed = scrape_many(URLS, async (props) => {
  const { enqueue_links, logger, on_pagination, page, service, single } = props;
  const [key, url_func] = single;

  logger.info(`About to start scraping lismed:${key}`);
  const on = get_on_methods();

  const base = url_func();

  await page.goto(base);

  if (await check_is_empty(page)) {
    logger.info(`Skipping ${key} because it seems to be empty`);

    return;
  }

  const pages = page.locator("ul.pager > li");

  const pages_count = await pages.count();

  on_pagination(
    { pages: pages_count, service, url_func },
    async ({ logger, page, service, url }) => {
      logger.info(`Scraping lismed:${url}`);

      const list = page
        .locator(".topStyle.row > *")
        .first()
        .locator(":scope > *")
        .nth(1)
        .locator(":scope > div");

      const count = await list.count();

      for (let j = 0; j < count; ++j) {
        const item = list.nth(j);

        const href = await item.locator("a[href]").first().getAttribute("href");

        if (!href) {
          on.error({
            error: common_parsing_errors.no_href({
              html: await page.content(),
              url,
              where: service.id,
            }),
            service,
          });

          continue;
        }

        enqueue_links({
          link: resolve_url("https://www.lismed.com/", href),
          service,
          handler: enqueue_lismed,
        });
      }
    }
  );
});

const enqueue_lismed: EnqueueHandler = async ({ link, page, service }) => {
  const title = await page.locator("section#property h2").textContent();
  const on = get_on_methods();

  if (!title) {
    on.error({
      error: new ParsingErrorV1({
        html: await page.content(),
        message: "No title found",
        url: link,
        where: service.id,
      }),
      service,
    });

    return;
  }

  const concelho_tr = await page
    .locator('tr:has-text("Concelho") td')
    .last()
    .textContent();

  let concelho_text = concelho_tr?.trim();

  const concelhos = get_concelhos();
  const concelho: number | null = concelhos[concelho_text || ""] ?? null;

  const price = await page.locator('tr:has-text("€") td').last().textContent();

  const style = parse_style(title);

  on.property(
    {
      title,
      url: link,
      concelho_id: concelho,
      price,
      style_lookup_id: style,
    },
    service
  );
};

async function check_is_empty(page: Page) {
  const empty_locator = page.locator(
    'p:has-text("Não foram encontrados resultados para a pesquisa efetuada.")'
  );

  const count = await empty_locator.count();

  return count !== 0;
}
