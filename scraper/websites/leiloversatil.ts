import type { Page } from "playwright";
import { EnqueueHandler, scrape_many } from "../config/wrapper";
import { get_on_methods } from "../config/local-storage";
import {
  common_parsing_errors,
  ParsingErrorV1,
} from "../events/errors/parsing-error";
import { get_text, resolve_url } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";

const URLS = {
  imoveis: "https://leiloversatil.pt/?chkimoveis=I&q=",
  direitos: "https://leiloversatil.pt/?chkdireitos=D&q=",
};

export const scrape_leilo_versatil = scrape_many(URLS, async (props) => {
  const on = get_on_methods();
  const [key, url] = props.single;
  props.logger.info(`About to start scraping ${key} of leiloverastil`);

  await props.page.goto(url);

  const is_empty = await check_is_empty(props.page);

  if (is_empty) {
    props.logger.info(`Skipping ${key} becasue it seems to be empty`);

    return;
  }

  const list = props.page.locator(".lista_vendas");

  const ad_count = await list.count();

  if (!ad_count) {
    on.error({
      service: props.service,
      error: new ParsingErrorV1({
        html: await props.page.content(),
        url,
        where: props.service.id,
        message: "No individual cards, even though it does not say it is empty",
      }),
    });

    return;
  }

  const list_base = list.locator(":scope > *");

  const children_count = await list_base.count();

  // Skipping 0 because in the children, the fisrt element is of an anchor tag and is not interesting
  for (let i = 1; i < children_count; i++) {
    const item = list_base.nth(i);

    const link_el = item.locator(".pesquisa_titulo a[href]");

    // TODO: THIS MIGHT FAIL?? HOW TO CLEAR THIS UP
    const href = await link_el.getAttribute("href");

    if (!href) {
      on.error({
        service: props.service,
        error: common_parsing_errors.no_href({
          html: await props.page.content(),
          url,
          where: props.service.id,
        }),
      });

      continue;
    }

    const description_section = item.locator(".texto_lote");
    const count = await description_section.count();

    let description: string = "";

    if (count) {
      for (let i = 0; i < count; ++i) {
        const str = "\n" + ((await get_text(description_section.nth(i))) ?? "");

        description += str;
      }
    }

    const link = resolve_url("https://leiloversatil.pt/", href);

    props.enqueue_links({
      link,
      service: props.service,
      handler: enqueue_versatil(description),
    });
  }
});

const enqueue_versatil =
  (description: string): EnqueueHandler =>
  async ({ link, page, service }) => {
    const on = get_on_methods();
    const price = page.locator("div.infobox_valorbase p");

    const price_amount = await price.count();

    const price_string = price_amount
      ? await price.first().innerText()
      : "Não listado";

    const title = await page.locator("h1.post_title").textContent();

    if (!title) {
      on.error({
        error: new ParsingErrorV1({
          message: "No title",
          url: link,
          where: service.id,
          html: await page.content(),
        }),
        service,
      });

      return;
    }

    const description = await page
      .locator(".descricao_venda_detalhe")
      .textContent()
      .then((r) => r?.trim());

    const style = parse_style(description ?? "");

    on.property(
      {
        title,
        url: link,
        price: price_string,
        style_lookup_id: style,
        concelho_id: null,
        description,
      },
      service,
    );
  };

async function check_is_empty(page: Page) {
  const base_filter = page.locator(".filtro_vazio");

  const count = await base_filter.count();

  return count !== 0;
}
