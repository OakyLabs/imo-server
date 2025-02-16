import { Locator } from "playwright";
import { get_on_methods } from "../config/local-storage";
import { scrape_main, EnqueueHandler } from "../config/wrapper";
import {
  ParsingErrorV1,
  common_parsing_errors,
} from "../events/errors/parsing-error";
import { get_text, resolve_url } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";

const url_func = (page = 1) =>
  `https://imoveis.santander.pt/imoveis/${page}/0/-1/-1/-1/-1/-1/-1/-1/-1/-1/-1/-/-1/-1/-`;

export const scrape_santander = scrape_main(
  async ({ enqueue_links, logger, page, service, on_pagination }) => {
    logger.info("Starting on santander");
    const base = url_func();
    await page.goto(base);

    await page.waitForLoadState("networkidle");

    const pages_el = page.locator("span.pager-counter");
    const on = get_on_methods();

    const pages_el_count = await pages_el.count();

    if (!pages_el_count) {
      on.error({
        service,
        error: new ParsingErrorV1({
          html: await page.content(),
          message: "Pagination is not working as expected",
          url: base,
          where: service.id,
        }),
      });

      return;
    }

    const text = await pages_el.textContent().then((r) => r?.trim());

    if (!text) {
      on.error({
        service,
        error: new ParsingErrorV1({
          html: await page.content(),
          message: "Pagination is not working as expected",
          url: base,
          where: service.id,
        }),
      });

      return;
    }

    const matched_els = text.match(/(\d+)/g);

    if (!matched_els) {
      on.error({
        service,
        error: new ParsingErrorV1({
          html: await page.content(),
          message: "Pagination is not working as expected",
          url: base,
          where: service.id,
        }),
      });

      return;
    }

    const [_, final] = matched_els.map((e) => Number(e));

    on_pagination(
      { pages: final, service, url_func },
      async ({ current_page, logger, page, service, url }) => {
        logger.info(`Scraping page ${current_page} of santander imoveis`);

        const listings = page.locator("ul.list-ul li");

        const listings_amount = await listings.count();

        for (let j = 0; j < listings_amount; j++) {
          const item = listings.nth(j);

          const href = await item.locator("a.info-link").getAttribute("href");

          if (!href) {
            on.error({
              service,
              error: common_parsing_errors.no_href({
                html: await page.content(),
                url,
                where: service.id,
              }),
            });

            continue;
          }

          const link = resolve_url("https://imoveis.santander.pt/", href);

          const location =
            (await get_text(item.locator("h2.prop-title"))) ?? "";

          enqueue_links({
            link,
            service,
            handler: enqueue_santander(location),
          });
        }
      },
    );
  },
);

const enqueue_santander =
  (location: string): EnqueueHandler =>
  async ({ link, page, service }) => {
    const title_el = page.locator(".propHeader-details h2");

    const title = await title_el.textContent().then((r) => r?.trim());
    const on = get_on_methods();

    if (!title) {
      on.error({
        service,
        error: common_parsing_errors.no_title({
          html: await page.content(),
          url: link,
          where: service.id,
        }),
      });
      return;
    }

    const price_el = page.locator(".propHeader-title span.propHeader-titleBig");

    let price: string | null = null;

    if (await price_el.count()) {
      price = (await price_el.textContent().then((r) => r?.trim())) ?? null;
    }

    const style = parse_style(title);

    on.property(
      {
        title,
        url: link,
        price,
        style_lookup_id: style,
        concelho_id: null,
        description: location,
      },
      service,
    );
  };
function get_item(arg0: Locator) {
  throw new Error("Function not implemented.");
}
