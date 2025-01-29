import type { Page } from "playwright";
import { EnqueueHandler, scrape_many } from "../config/wrapper";
import { get_concelhos, get_on_methods } from "../config/local-storage";
import { common_parsing_errors } from "../events/errors/parsing-error";
import { resolve_url } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";

const URLS = {
  leilao_presencial_imovel:
    "https://www.leilovalor.com/index.php?page=bem_list&order=&modalidade_venda=leilao_presencial&natureza=IMOVEL&tipo_bem_id=&distritoId=&concelhoId=&freguesiaId=&greaterThan=&lowerThan=&freeSearch=",
  leilao_presencial_direito:
    "https://www.leilovalor.com/index.php?page=bem_list&order=&modalidade_venda=leilao_presencial&natureza=DIREITO&tipo_bem_id=&distritoId=&concelhoId=&freguesiaId=&greaterThan=&lowerThan=&freeSearch=",
  leilao_online_imovel:
    "https://www.leilovalor.com/index.php?page=bem_list&order=&modalidade_venda=leilao_online&natureza=IMOVEL&tipo_bem_id=&distritoId=&concelhoId=&freguesiaId=&greaterThan=&lowerThan=&freeSearch=",
  leilao_online_direito:
    "https://www.leilovalor.com/index.php?page=bem_list&order=&modalidade_venda=leilao_online&natureza=DIREITO&tipo_bem_id=&distritoId=&concelhoId=&freguesiaId=&greaterThan=&lowerThan=&freeSearch=",
  negociacao_particular_imovel:
    "https://www.leilovalor.com/index.php?page=bem_list&order=&modalidade_venda=negociacao_particular&natureza=IMOVEL&tipo_bem_id=&distritoId=&concelhoId=&freguesiaId=&greaterThan=&lowerThan=&freeSearch=",
  negociacao_particular_direito:
    "https://www.leilovalor.com/index.php?page=bem_list&order=&modalidade_venda=negociacao_particular&natureza=DIREITO&tipo_bem_id=&distritoId=&concelhoId=&freguesiaId=&greaterThan=&lowerThan=&freeSearch=",
  carta_fechada_imovel:
    "https://www.leilovalor.com/index.php?page=bem_list&order=&modalidade_venda=carta_fechada&natureza=IMOVEL&tipo_bem_id=&distritoId=&concelhoId=&freguesiaId=&greaterThan=&lowerThan=&freeSearch=",
  carta_fechada_direito:
    "https://www.leilovalor.com/index.php?page=bem_list&order=&modalidade_venda=carta_fechada&natureza=DIREITO&tipo_bem_id=&distritoId=&concelhoId=&freguesiaId=&greaterThan=&lowerThan=&freeSearch=",
} as const;

export const scrape_leilo_valor = scrape_many(URLS, async (props) => {
  const { enqueue_links, logger, page, service, single } = props;
  const on = get_on_methods();
  const [key, url] = single;

  logger.info(`About to start scraping leilovalor:${key}`);

  await page.goto(url);

  const is_empty = await check_is_empty(page);

  if (is_empty) {
    logger.info(`Skipping leilovalor:${key} because it seems to be empty`);

    return;
  }

  const listings = page.locator(".topStyle .row:has(a[href]:has(div[style]))");
  const count = await listings.count();

  for (let i = 0; i < count; i++) {
    const item = listings.nth(i);

    const first_anchor = item.locator(":scope > *").last().locator("a").first();

    const href = await first_anchor.getAttribute("href");

    if (!href) {
      on.error({
        service,
        error: common_parsing_errors.no_href({
          html: await page.content(),
          url,
          where: service.id,
        }),
      });

      return;
    }

    const link = resolve_url("https://www.leilovalor.com/", href);

    enqueue_links({
      link,
      service,
      handler: enqueue_leilovalor,
    });
  }
});

const enqueue_leilovalor: EnqueueHandler = async ({ link, page, service }) => {
  const on = get_on_methods();
  const title = await page.locator("h2").innerText();

  const concelho_text = await page
    .locator("div.information")
    .last()
    .locator(".c_row")
    .nth(1)
    .locator(".value")
    .innerText();

  const concelhos = get_concelhos();
  const concelho = concelhos[concelho_text];

  const style = parse_style(title);

  on.property(
    {
      title,
      url: link,
      concelho_id: concelho,
      style_lookup_id: style,
      price: null,
    },
    service
  );
};

async function check_is_empty(page: Page) {
  const gavel_els = page.locator("div .fa-gavel");

  const count = await gavel_els.count();

  for (let i = 0; i < count; ++i) {
    const parent = await gavel_els.nth(i).locator("..").innerText();

    if (/sem resultados/gi.test(parent)) {
      return true;
    }
  }

  return false;
}
