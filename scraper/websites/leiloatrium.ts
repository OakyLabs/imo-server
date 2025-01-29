import { get_on_methods } from "../config/local-storage";
import { EnqueueHandler, scrape_main } from "../config/wrapper";
import {
  common_parsing_errors,
  ParsingErrorV1,
} from "../events/errors/parsing-error";
import { parse_style } from "../lib/parse-style";

const url = "https://leiloatrium.pt/?_sft_tipo_de_bem=imovel";

export const scrape_leiloatrium = scrape_main(
  async ({ enqueue_links, logger, page, service }) => {
    logger.info(`About to start scraping leiloatrium:imoveis`);

    await page.goto(url);

    await page.waitForLoadState("networkidle");

    const listings = page.locator("article.type-product");

    const listings_count = await listings.count();
    const on = get_on_methods();

    for (let i = 0; i < listings_count; ++i) {
      const item = listings.nth(i);

      const anchor = await item.locator("a[href]").first().getAttribute("href");

      if (!anchor) {
        on.error({
          error: common_parsing_errors.no_href({
            html: await page.content(),
            url,
            where: service.id,
          }),
          service,
        });

        return;
      }

      enqueue_links({
        link: anchor,
        service,
        handler: enqueue_leiloatrium,
      });
    }
  }
);

const enqueue_leiloatrium: EnqueueHandler = async ({ link, page, service }) => {
  const on = get_on_methods();

  const title_el = page.locator("h1");

  const title = await title_el.textContent();

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

  const price_el = page.locator(".amount").first();

  let price: string | null = null;
  if (await price_el.count()) {
    price = (await price_el.textContent()) ?? null;
  }

  const style = parse_style(title);

  on.property(
    { title, url: link, price, style_lookup_id: style, concelho_id: null },
    service
  );
};
