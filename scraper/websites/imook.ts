import { concelhosRelations } from "../../db/schema";
import { get_concelhos, get_on_methods } from "../config/local-storage";
import { EnqueueHandler, scrape_main } from "../config/wrapper";
import {
  common_parsing_errors,
  ParsingErrorV1,
} from "../events/errors/parsing-error";
import { get_text, resolve_url } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";
import { ScrapedAuction, ScrapedData } from "../scraper-types";

const url_func = (page = 1) =>
  `http://www.imook.pt/imoveis?srt=1&dsrt=1&pag=${page}`;

export const scrape_imook = scrape_main(
  async ({ page, on_pagination, service, enqueue_links }) => {
    const url = url_func();
    await page.goto(url);

    await page.waitForLoadState("networkidle");

    const pagination_section = page.locator("ul.paginationWrapper");

    const pagination_count = await pagination_section.count();

    let pages = 1;

    if (pagination_count) {
      const children_amount = await pagination_section
        .locator(":scope > *")
        .count();

      pages = children_amount;
    }

    const on = get_on_methods();
    on_pagination(
      { pages, service, url_func, should_wait_network_idle: true },
      async ({ current_page, logger, page, service, url }) => {
        logger.info(`Scraping page ${current_page} of imook`);

        const property_items = page.locator(".propertyItem");

        const property_items_amount = await property_items.count();

        for (let i = 0; i < property_items_amount; ++i) {
          const item = property_items.nth(i);

          const anchor = item.locator("a");

          const anchor_amount = await anchor.count();

          if (anchor_amount !== 1) {
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

          const href = await anchor.getAttribute("href");

          if (!href) {
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

          const link = resolve_url("http://www.imook.pt/", href);

          enqueue_links(
            {
              link,
              service,
              handler: enqueue_imook,
            },
            true,
          );
        }
      },
    );
  },
);

const enqueue_imook: EnqueueHandler = async ({
  link,
  logger,
  page,
  service,
}) => {
  logger.info(`Scraping individual property page of imook`);

  const title_el = page.locator("h1").first();

  const title_amount = await title_el.count();

  const on = get_on_methods();
  if (!title_amount) {
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

  const title = await title_el.textContent().then((r) => r?.trim());

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

  const location = page.locator(
    'li.detailItem:has(span.label:has-text("Concelho")) h4 span.value',
  );

  const location_amount = await location.count();

  if (!location_amount) {
    on.error({
      service,
      error: new ParsingErrorV1({
        html: await page.content(),
        message:
          "Location is no longer in the correct part on the table. Something to be seen",
        url: link,
        where: service.id,
      }),
    });

    return;
  }

  const concelho_text =
    (await location.textContent().then((e) => e?.trim())) ?? "";

  const concelhos = get_concelhos();
  const concelho = concelhos[concelho_text] ?? null;

  const style_section = page.locator(
    'li.detailItem:has(span.label:has-text("Natureza")) h4 span.value',
  );

  const style_amount = await location.count();

  if (!style_amount) {
    on.error({
      service,
      error: new ParsingErrorV1({
        html: await page.content(),
        message:
          "Style is no longer in the correct part on the table. Something to be seen",
        url: link,
        where: service.id,
      }),
    });

    return;
  }

  const style_text =
    (await style_section.textContent().then((e) => e?.trim())) ?? "";

  let style = parse_style(style_text);

  if (style == null) {
    style = parse_style(title);
  }

  const price_section = page.locator("div.priceWrapper span.value").first();

  const price_amount = await price_section.count();

  let price: string | null = null;
  if (price_amount === 1) {
    price = (await price_section.textContent().then((e) => e?.trim())) ?? null;
  }

  const property_data: ScrapedData = {
    concelho_id: concelho,
    title,
    url: link,
    price,
    style_lookup_id: style,
  };

  if (concelho == null) {
    const description = page.locator("p.specsText");

    const description_text = await get_text(description);

    property_data.description = description_text;
  }

  on.property(property_data, service);
};
