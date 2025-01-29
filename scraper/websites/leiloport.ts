import type { Page } from "playwright";
import { EnqueueHandler, scrape_many } from "../config/wrapper";
import { get_on_methods } from "../config/local-storage";
import {
  common_parsing_errors,
  ParsingErrorV1,
} from "../events/errors/parsing-error";
import { parse_style } from "../lib/parse-style";

const URLS = {
  carta_fechada_imoveis: (page = 1) =>
    `https://leiloport.pt/carteira/page/${page}?tipo=cartafechada&categoria=imoveis`,
  carta_fechada_terrenos: (page = 1) =>
    `https://leiloport.pt/carteira/page/${page}/?tipo=cartafechada&categoria=terrenos`,
  leilao_online_imoveis: (page = 1) =>
    `https://leiloport.pt/carteira/page/${page}?tipo=online&categoria=imoveis`,
  leilao_online_terrenos: (page = 1) =>
    `https://leiloport.pt/carteira/page/${page}?tipo=online&categoria=terrenos`,
  leilao_presencial_imoveis: (page = 1) =>
    `https://leiloport.pt/carteira/page/${page}?tipo=presencial&categoria=imoveis`,
  leilao_presencial_terrenos: (page = 1) =>
    `https://leiloport.pt/carteira/page/${page}?tipo=presencial&categoria=terrenos`,
  negociacao_particular_imoveis: (page = 1) =>
    `https://leiloport.pt/carteira/page/${page}?tipo=particular&categoria=imoveis&num=21`,
  negociacao_particular_terrenos: (page = 1) =>
    `https://leiloport.pt/carteira/page/${page}?tipo=particular&categoria=terrenos`,
} as const;

export const scrape_leiloport = scrape_many(URLS, async (props) => {
  const { enqueue_links, logger, on_pagination, page, service, single } = props;
  const [key, url_func] = single;
  logger.info(`Scraping leiloport:${key}`);
  const on = get_on_methods();
  const base = url_func();

  await page.goto(base);

  if (await is_empty(page)) {
    logger.info(`Skipping ${base} because it seems to be empty`);
    return;
  }

  await page.waitForSelector("#verve_main_wrapper");

  const pages = await get_pages(page);

  on_pagination(
    { pages, service, url_func },
    async ({ page, service, url }) => {
      const items = await page.$$(".card:not(:has(.lp_closed))");

      for (const item of items) {
        const link = await item
          .$(".back .lp_view_detail a")
          .then((r) => r?.getAttribute("href"));

        if (!link) {
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

        enqueue_links({
          link,
          service,
          handler: enqueue_leiloport,
        });
      }
    }
  );
});

const enqueue_leiloport: EnqueueHandler = async ({ link, page, service }) => {
  const on = get_on_methods();
  const title = await page.locator("h1.product_title").textContent();

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

  const price = await page
    .locator("#lp_product_prices_left .lp_margens input")
    .getAttribute("value");

  const style = parse_style(title);

  on.property(
    {
      title,
      url: link,
      price,
      style_lookup_id: style,
      concelho_id: null,
    },
    service
  );
};

async function get_pages(page: Page) {
  try {
    const pages = await page
      .locator("a.page-numbers:not(.next)")
      .last()
      .textContent({ timeout: 75 });

    const converted = Number(pages?.trim());

    return !converted ? 1 : converted;
  } catch (error) {
    return 1;
  }
}

async function is_empty(page: Page) {
  const card_count = await page.locator(".card").count();
  return card_count === 0;
}
