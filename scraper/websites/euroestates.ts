import { RealEstate } from "../../db/real-estate";
import { get_concelhos, get_on_methods } from "../config/local-storage";
import { EnqueueHandler, scrape_main } from "../config/wrapper";
import {
  common_parsing_errors,
  ParsingErrorV1,
} from "../events/errors/parsing-error";
import { parse_style } from "../lib/parse-style";

const url = "https://www.euroestates.pt/realestate/search";

export const scrape_euro_estates = scrape_main(async (props) => {
  const { enqueue_links, logger, page, service } = props;
  const on = get_on_methods();

  logger.info(`About to start scraping euro_estates`);

  await page.goto(url);

  const select = page.locator("select[name='businesstype_id']");

  await select.selectOption({ label: "Venda" });

  const btn = page.locator(".widget-search form button");

  await btn.click();

  await page.waitForLoadState("networkidle");

  const listings = page.locator(".sale-block");

  const listings_amount = await listings.count();

  const concelhos = get_concelhos();
  for (let i = 0; i < listings_amount; ++i) {
    const item = listings.nth(i);

    const anchor_el = item.locator("a[href]").first();

    const anchor_amount = await anchor_el.count();

    if (!anchor_amount) {
      continue;
    }

    const href = await anchor_el.getAttribute("href");

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

    const location = item.locator(".property-details ul li").last();

    if (!location) {
      on.error({
        error: new ParsingErrorV1({
          html: await page.content(),
          message: "Location is no longer in the right spot",
          url,
          where: service.id,
        }),
        service,
      });

      return;
    }

    const location_concelho = await location
      .textContent()
      .then((r) => r?.trim());

    if (!location_concelho) {
      on.error({
        error: new ParsingErrorV1({
          html: await page.content(),
          message: "Location is no longer in the right spot",
          url,
          where: service.id,
        }),
        service,
      });

      return;
    }

    const concelho = concelhos[location_concelho] ?? null;
    enqueue_links({
      link: href,
      service,
      handler: enqueue_euro_estates(concelho),
    });
  }
});

const enqueue_euro_estates =
  (concelho_id: number | null): EnqueueHandler =>
  async (props) => {
    const { link, page, service } = props;
    //async ({ link, logger, page, service }) => {
    const title_el = page.locator(".property-header h3");

    const on = get_on_methods();

    const title_amount = await title_el.count();

    if (!title_amount) {
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

    const title_text = await title_el.textContent().then((r) => r?.trim());

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

    const description_section = page
      .locator(".single-property-details p")
      .first();

    let style: RealEstate | null = null;

    if (await description_section.count()) {
      const description_text = await description_section
        .textContent()
        .then((r) => r?.trim());

      if (description_text) {
        style = parse_style(description_text);
      }
    }

    const price_section = page
      .locator('tr:has-text("Preço") td:has-text("€")')
      .last();

    let price: string | null = null;

    if (await price_section.count()) {
      const price_text = await price_section
        .textContent()
        .then((r) => r?.trim());

      if (price_text) {
        price = price_text;
      }
    }

    on.property(
      {
        title: title_text,
        url: link,
        concelho_id,
        style_lookup_id: style,
        price,
      },
      service
    );
  };
