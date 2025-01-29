import type { Locator } from "playwright";
import { EnqueueHandler, scrape_main } from "../config/wrapper";
import { get_concelhos, get_on_methods } from "../config/local-storage";
import {
  common_parsing_errors,
  ParsingErrorV1,
} from "../events/errors/parsing-error";
import { resolve_url } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";

const url = "https://www.exclusivagora.com/index.php";

export const scrape_exclusivo_agora = scrape_main(
  async ({ enqueue_links, logger, page, service }) => {
    logger.info(`Starting to scrape exclusivo_agora`);

    const on = get_on_methods();

    await page.goto(url);

    const listings_block = page.locator(".listings-block");

    const listings_count = await listings_block.count();

    if (!listings_count) {
      on.error({
        service,
        error: new ParsingErrorV1({
          html: await page.content(),
          url,
          message: "Could not find listing block",
          where: service.id,
        }),
      });

      return;
    }

    const listing_section = listings_block
      .locator(":scope > *")
      .first()
      .locator(":scope > *")
      .last()
      .locator(":scope > *")
      .last();

    const listing_section_count = await listing_section.count();

    if (!listing_section_count) {
      on.error({
        service,
        error: new ParsingErrorV1({
          html: await page.content(),
          url,
          message: "Could not find listing section",
          where: service.id,
        }),
      });

      return;
    }

    const listings = listing_section.locator(":scope > *");

    const listings_amount = await listings.count();

    if (!listings_amount) {
      logger.info(`Skipping parsing more, due to empty listing`);

      return;
    }

    for (let i = 0; i < listings_amount; ++i) {
      const item = listings.nth(i);
      const title_el = item.locator(".listings-info-block h2");

      const title_el_amount = await title_el.count();

      if (!title_el_amount || title_el_amount > 1) {
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

      const filtering_regex = /\b(m[aá]quinas|trator)\b/i;

      if (filtering_regex.test(title)) {
        continue;
      }

      const link = item.locator(".listings-info-block a[href]").last();
      const link_count = await link.count();

      if (!link_count) {
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

      const single_link = await link.getAttribute("href");

      if (!single_link) {
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

      const href = resolve_url("https://www.exclusivagora.com/", single_link);

      enqueue_links(
        {
          link: href,
          service,
          handler: enqueue_exclusivo_agora,
        },
        true
      );
    }
  }
);

const enqueue_exclusivo_agora: EnqueueHandler = async ({
  page,
  service,
  link,
}) => {
  const title = page.locator("h2").first();
  const on = get_on_methods();

  const title_amount = await title.count();

  if (title_amount !== 1) {
    on.error({
      error: common_parsing_errors.no_title({
        html: await page.content(),
        url: link,
        where: service.id,
      }),
      service,
    });

    return;
  }

  const title_text = await title.textContent().then((r) => r?.trim());

  if (!title_text) {
    on.error({
      error: common_parsing_errors.no_title({
        html: await page.content(),
        url: link,
        where: service.id,
      }),
      service,
    });

    return;
  }

  const location_el = page.locator("h5").first();

  const is_single = await only_one(location_el, 1);

  if (!is_single) {
    on.error({
      service,
      error: new ParsingErrorV1({
        where: service.id,
        html: await page.content(),
        message: "Location is no longer on the same spot",
        url: link,
      }),
    });

    return;
  }

  const location = await location_el.textContent().then((r) => r?.trim());

  if (!location) {
    on.error({
      service,
      error: new ParsingErrorV1({
        where: service.id,
        html: await page.content(),
        message: "Location is no longer on the same spot",
        url: link,
      }),
    });

    return;
  }

  const location_arr = location.split(" - ");

  let concelho: string | undefined;

  if (location_arr.length === 2) {
    concelho = location_arr[1].trim();
  }

  const concelhos = get_concelhos();
  const concelho_id = concelhos[concelho ?? ""] ?? null;

  const style = parse_style(title_text);

  const price_attempt = page.locator("#valor-base").first();

  const price = (await price_attempt.count())
    ? await price_attempt.textContent().then((r) => r?.trim() ?? null)
    : null;

  on.property(
    {
      title: title_text,
      style_lookup_id: style,
      url: link,
      price,
      concelho_id,
    },
    service
  );
};

async function only_one(locator: Locator, amount: number) {
  const count = await locator.count();

  return count === amount;
}
