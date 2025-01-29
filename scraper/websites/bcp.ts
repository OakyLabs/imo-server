import { get_concelhos, get_on_methods } from "../config/local-storage";
import { scrape_main } from "../config/wrapper";
import {
  common_parsing_errors,
  ParsingErrorV1,
} from "../events/errors/parsing-error";
import { resolve_url } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";

const url_func = (page = 1) =>
  `https://ind.millenniumbcp.pt/pt/Particulares/viver/Imoveis/Pages/imoveis.aspx#/Search.aspx?buf=&pn=${page}`;

export const scrape_millenium = scrape_main(
  async ({ logger, on_pagination, page, service }) => {
    const base = url_func();
    const on = get_on_methods();
    const concelhos = get_concelhos();

    logger.info(`Starting on millenium`);
    await page.goto(base);
    await page.waitForLoadState("networkidle");

    await page.waitForSelector("iframe#iframe");

    const frame = page.frameLocator("iframe#iframe");

    await frame.locator(".searchResultPaginator").waitFor({ state: "visible" });

    const locator = frame.locator(".searchResultPaginator > a");

    const count = await locator.count();

    const promise_arr = await Promise.all(
      Array.from({ length: count }, (_, i) => i).map(async (num) => {
        const item = locator.nth(num);

        const text_content = await item.textContent();

        if (!text_content) return null;

        if (!/\d/.test(text_content)) {
          return null;
        }

        return +text_content;
      })
    );

    const pages_length = promise_arr.filter((num): num is number =>
      Boolean(num)
    );

    on_pagination(
      {
        pages: pages_length.length,
        service,
        url_func: url_func,
        should_wait_network_idle: true,
      },
      async ({ page, service, url }) => {
        await page.waitForSelector("iframe#iframe");

        const frame = page.frameLocator("iframe#iframe");

        await frame
          .locator(".searchResultProperties")
          .waitFor({ state: "visible" });

        const listings = frame.locator(
          ".searchResultProperties > .searchResultProperty"
        );

        const listings_amount = await listings.count();

        for (let j = 0; j < listings_amount; ++j) {
          const item = listings.nth(j);

          const link_el = item.locator(":scope > a[href]");

          const link_amount = await link_el.count();

          if (!link_amount) {
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

          const href = await link_el.getAttribute("href");

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

          const link = resolve_url(
            "https://millenniumimoveis.janeladigital.com/",
            href
          );

          const title_style = item.locator(".propertyNature");

          const title = await title_style.textContent();

          if (!title) {
            on.error({
              service,
              error: common_parsing_errors.no_title({
                html: await page.content(),
                url,
                where: service.id,
              }),
            });

            continue;
          }

          const style = parse_style(title);

          const concelho_locator = await item
            .locator(".propertyData .propertyDataColumn span")
            .first()
            .textContent();

          if (!concelho_locator) {
            on.error({
              error: new ParsingErrorV1({
                html: await page.content(),
                message:
                  "No concelho found even though it is part of the scraping strategy",
                url,
                where: service.id,
              }),
              service,
            });

            continue;
          }

          const [_, concelho] = concelho_locator
            .split(":")
            .map((e) => e.trim());

          const price = await item
            .locator("span.propertyPrice")
            .textContent()
            .then((r) => r?.trim() ?? null);

          if (!price) {
            on.error({
              error: new ParsingErrorV1({
                html: await page.content(),
                message:
                  "No price found even though it is part of the scraping strategy",
                url,
                where: service.id,
              }),
              service,
            });
          }

          const concelho_id = concelhos[concelho] ?? null;

          on.property(
            {
              title,
              url: link,
              concelho_id,
              price,
              style_lookup_id: style,
            },
            service
          );
        }
      }
    );
  }
);
