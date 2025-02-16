import { get_on_methods, get_concelhos } from "../config/local-storage";
import { scrape_main } from "../config/wrapper";
import {
  ParsingErrorV1,
  common_parsing_errors,
} from "../events/errors/parsing-error";
import { get_text, resolve_url } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";

const URL = (page = 1) => `https://imoveismontepio.pt/Comprar/?pn=${page}`;

export const scrape_montepio = scrape_main(
  async ({ logger, on_pagination, page, service }) => {
    logger.info(`About to start scraping montepio imoveis`);

    const on = get_on_methods();
    const base_url = URL();

    await page.goto(base_url);
    await page.waitForLoadState("networkidle");

    await page.mouse.wheel(0, 100);

    await page.waitForSelector("div.searchPagination");

    // await page.waitForSelector(
    //   "div.searchPagination #MC_Paginator_LinkNextActive"
    // );

    // await new Promise(() => {});

    // await page.waitForSelector("#MC_Paginator_LinkLast");

    // return;

    const last_page_locator = page.locator("#MC_Paginator_LinkLast").first();

    const last_page_text = await last_page_locator
      .textContent()
      .then((r) => r?.trim());

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
    const concelhos = get_concelhos();

    on_pagination(
      {
        pages: last_page,
        service,
        url_func: URL,
        should_wait_network_idle: true,
      },
      async ({ logger, page, service, url }) => {
        logger.info(`Starting to scrape montepio:${url}`);

        const list = page.locator("div.property");

        const list_amount = await list.count();

        for (let i = 0; i < list_amount; ++i) {
          const item = list.nth(i);

          const link_el = item.locator("a[href]").first();

          const link_amount = await link_el.count();

          if (link_amount !== 1) {
            on.error({
              service,
              error: new ParsingErrorV1({
                html: await page.content(),
                message: "Links are no longer correct",
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
              error: new ParsingErrorV1({
                html: await page.content(),
                message: "Links are no longer correct",
                url,
                where: service.id,
              }),
            });

            return;
          }

          const link = resolve_url("https://imoveismontepio.pt/", href);

          const title_el = item.locator(".propertyType");

          const title_amount = await title_el.count();

          if (title_amount !== 1) {
            on.error({
              service,
              error: common_parsing_errors.no_title({
                html: await page.content(),
                url,
                where: service.id,
              }),
            });

            return;
          }

          const title = await title_el.textContent().then((r) => r?.trim());

          if (!title) {
            on.error({
              service,
              error: common_parsing_errors.no_title({
                html: await page.content(),
                url,
                where: service.id,
              }),
            });

            return;
          }

          const style = parse_style(title);

          const price_el = item.locator(".propertyPrice");

          const price = await price_el.evaluate((element) => {
            for (const child of Array.from(element.childNodes)) {
              if (child.nodeType === Node.TEXT_NODE) {
                if (child.textContent?.trim()) {
                  return child.textContent.trim();
                }
              }
            }
          });

          const location_el = item.locator(".propertyLocation");

          const location_amount = await location_el.count();

          let concelho: number | null = null;

          if (location_amount === 1) {
            const location = await location_el
              .textContent()
              .then((r) => r?.split(",").map((e) => e.trim()));

            if (location?.length === 2) {
              const concelho_text = location[1];

              concelho = concelhos[concelho_text];
            }
          }
          const location = await get_text(
            item.locator(".propertyLocation").first(),
          );

          on.property(
            {
              title,
              url: link,
              concelho_id: concelho,
              price: price ?? null,
              style_lookup_id: style,
              description: location,
            },
            service,
          );
        }
      },
    );

    // const all_properties = page.locator("div.property");
  },
);
