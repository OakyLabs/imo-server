import { get_on_methods } from "../config/local-storage";
import { EnqueueHandler, scrape_many } from "../config/wrapper";
import {
  common_parsing_errors,
  ParsingErrorV1,
} from "../events/errors/parsing-error";
import { parse_style } from "../lib/parse-style";

const URLS = {
  venda_judicial_imovel:
    "https://lexleiloes.com/vendas-em-curso/vendas-judiciais-de-imoveis/",
  vendas_direitos: "https://lexleiloes.com/vendas-em-curso/vendas-de-direitos/",
  venda_imovel: "https://lexleiloes.com/vendas-em-curso/vendas-de-imoveis-2/",
};

export const scrape_lex_leiloes = scrape_many(URLS, async (props) => {
  const { enqueue_links, logger, page, service, single } = props;
  const [key, url] = single;
  const on = get_on_methods();
  logger.info(`About start scraping lex_leiloes:${key}`);

  await page.goto(url);

  const properties_list = page.locator("#divProperties");

  const children = properties_list.locator(":scope > *");

  const count_children = await children.count();

  //   TODO: -1 because the last one is not really for the taking ( still because the last one is the div, but within the a href still has stuff to do)
  for (let i = 0; i < count_children - 1; ++i) {
    const item = children.nth(i);
    const tag_name = await item.evaluate((e) => e.tagName.toLowerCase());

    if (tag_name !== "a") {
      continue;
    }

    const href = await item.evaluate((el: HTMLAnchorElement) => el.href);

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

    const price = await item.locator(".content span.button").textContent();

    if (!price) {
      on.error({
        error: new ParsingErrorV1({
          html: await page.content(),
          message: "No more price button.",
          url: url,
          where: service.id,
        }),
        service,
      });

      continue;
    }

    const is_price = /\d/.test(price);

    if (is_price) {
      enqueue_links({
        link: href,
        service,
        handler: enqueue_lex_leiloes(price.trim()),
      });
    } else {
      logger.info(`Skipping enqueuing because price is not a number`);
    }

    //   if ()
  }
});

const enqueue_lex_leiloes =
  (price: string | null): EnqueueHandler =>
  async ({ link, page, service }) => {
    const on = get_on_methods();
    const title = await page.$("h1").then((r) => r?.textContent());

    if (!title) {
      on.error({
        error: new ParsingErrorV1({
          html: await page.content(),
          message: "No title",
          url: link,
          where: service.id,
        }),
        service,
      });

      return;
    }

    const style = parse_style(title);

    on.property(
      { title, url: link, price, style_lookup_id: style, concelho_id: null },
      service,
    );
  };
