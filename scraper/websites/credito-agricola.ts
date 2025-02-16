import { get_concelhos, get_on_methods } from "../config/local-storage";
import { scrape_main } from "../config/wrapper";
import {
  common_parsing_errors,
  ParsingErrorV1,
} from "../events/errors/parsing-error";
import { get_text, resolve_url } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";
import { to_pascal_case } from "../lib/pascal";

const url_func = (page = 1) => `https://www.caimoveis.pt/Comprar/?pn=${page}`;

const BASE_URL = "https://www.caimoveis.pt/";

export const scrape_credito_agricola = scrape_main(
  async ({ on_pagination, page, service }) => {
    //
    const base_url = url_func();
    const on = get_on_methods();

    await page.goto(base_url);
    await page.waitForLoadState("networkidle");

    const pagination = page.locator("div.pagination #MC_Paginator_LinkLast");

    const last_page_text = await pagination.textContent();

    if (!last_page_text) {
      on.error({
        error: new ParsingErrorV1({
          html: await page.content(),
          message: "No last page. Time to check the page",
          url: base_url,
          where: service.id,
        }),
        service,
      });

      return;
    }

    const last_page_number_match = last_page_text.match(/\d+/);

    if (!last_page_number_match) {
      on.error({
        error: new ParsingErrorV1({
          html: await page.content(),
          message: "No last page. Time to check the page",
          url: base_url,
          where: service.id,
        }),
        service,
      });

      return;
    }

    const [last_page_str] = last_page_number_match;

    if (Number.isNaN(+last_page_str) || !+last_page_str) {
      on.error({
        error: new ParsingErrorV1({
          html: await page.content(),
          message: "No last page. Time to check the page",
          url: base_url,
          where: service.id,
        }),
        service,
      });

      return;
    }

    const last_page = +last_page_str;

    on_pagination(
      {
        pages: last_page,
        service,
        url_func,
        should_wait_network_idle: true,
      },
      async ({ current_page, logger, page, service, url }) => {
        const list = page.locator(".property-item");
        logger.info(`Scraping page ${current_page} of credito_agricola`);

        const count = await list.count();

        const concelhos = get_concelhos();
        for (let i = 0; i < count; ++i) {
          const item = list.nth(i);

          const href_el = item.locator(":scope > a[href]").first();

          const href_count = await href_el.count();

          if (!href_count) {
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

          const href = await href_el.getAttribute("href");

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

          const price_el = item.locator("span.price").first();

          const price_count = await price_el.count();

          if (!price_count) {
            on.error({
              service,
              error: new ParsingErrorV1({
                html: await page.content(),
                message: "no price in item",
                url,
                where: service.id,
              }),
            });

            continue;
          }

          const price = await price_el.textContent().then((r) => r?.trim());

          if (!price) {
            on.error({
              service,
              error: new ParsingErrorV1({
                html: await page.content(),
                message: "no price in item",
                url,
                where: service.id,
              }),
            });

            continue;
          }

          const title_el = item.locator("h2.title");

          const title_count = await title_el.count();

          if (!title_count) {
            continue;
          }

          const title = to_pascal_case(
            await title_el.textContent().then((r) => r?.trim() ?? ""),
          ).trim();

          if (!title) {
            continue;
          }

          const location_el = item.locator("h3.location").first();

          const location_count = await location_el.count();

          if (!location_count) {
            continue;
          }

          const location_str = await location_el
            .textContent()
            .then((r) => r?.trim());

          if (!location_str) {
            continue;
          }

          const concelho = location_str
            .split(">")
            .map((r) => r.trim())
            .at(0);

          if (!concelho) {
            continue;
          }

          const concelho_id = concelhos[concelho] ?? null;

          const style = parse_style(title);

          const location = await get_text(
            item.locator(".info h3.location").first(),
          );

          on.property(
            {
              title,
              url: resolve_url(BASE_URL, href),
              concelho_id,
              price,
              style_lookup_id: style,
              description: location,
            },
            service,
          );
        }
      },
    );
  },
);
