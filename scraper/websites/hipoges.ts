import type { Page } from "playwright";
import { RealEstate } from "../../db/real-estate";
import { scrape_many } from "../config/wrapper";
import { get_concelhos, get_on_methods } from "../config/local-storage";
import {
  common_parsing_errors,
  ParsingErrorV1,
} from "../events/errors/parsing-error";
import { get_text, resolve_url } from "../lib/helpers";

const URLS = {
  apartments: [
    "https://realestate.hipoges.com/pt/point/map/venda/casas-e-apartamentos/portugal/5/39.557191/-7.8536599",
    RealEstate.ApartamentoCasa,
  ],
  comercial: [
    "https://realestate.hipoges.com/pt/point/map/venda/espacos-comerciais-e-armazens/portugal/5/39.557191/-7.8536599",
    RealEstate.EstabelecimentoComercial,
  ],
  offices: [
    "https://realestate.hipoges.com/pt/point/map/venda/escritorios/portugal/5/39.557191/-7.8536599",
    RealEstate.EstabelecimentoComercial,
  ],
  garages: [
    "https://realestate.hipoges.com/pt/point/map/venda/garagem/portugal/5/39.557191/-7.8536599",
    RealEstate.Garagem,
  ],
  lands: [
    "https://realestate.hipoges.com/pt/point/map/venda/terrenos/portugal/5/39.557191/-7.8536599",
    RealEstate.ConstrucaoTerrenoRustico,
  ],
} satisfies Record<string, [string, RealEstate]>;

export const scrape_hipoges = scrape_many(
  URLS,
  async ({ logger, page, service, single }) => {
    const [key, [url, style]] = single;
    const on = get_on_methods();
    const concelhos = get_concelhos();

    logger.info(`About to start scraping hipoges:${key}`);

    await page.goto(url);

    await wait_idle(page);

    const ads = page.locator("init-asset-card");

    const ads_amount = await ads.count();

    if (!ads_amount) {
      logger.info(`Skipping ${key} because it seems to be empty`);

      return;
    }

    let { paginator, paginator_amount } = await get_pagination(page);

    do {
      await page.waitForSelector("init-asset-card");
      const each_ad = page.locator("init-asset-card");

      const ads_amount = await each_ad.count();
      const arr = Array.from({ length: ads_amount }, (_, i) => i);

      await Promise.all(
        arr.map(async (v) => {
          const item = each_ad.nth(v);

          const anchor = item.locator("article > a[href]");

          const anchor_amount = await anchor.count();

          if (!anchor_amount) {
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

          const href = await anchor.getAttribute("href");

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

          const link = resolve_url("https://realestate.hipoges.com/", href);

          const title_el = item.locator("h2").first();

          if (!(await title_el.count())) {
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

          const title = await get_text(title_el);

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

          const price_section = item.locator('a span:has-text("€")').first();

          const price_count = await price_section.count();

          if (price_count !== 1) {
            on.error({
              service,
              error: new ParsingErrorV1({
                html: await page.content(),
                message: "Price no longer in the expected spot",
                url,
                where: service.id,
              }),
            });

            return;
          }

          const price = await price_section
            .textContent()
            .then((r) => r?.trim());

          if (!price) {
            on.error({
              service,
              error: new ParsingErrorV1({
                html: await page.content(),
                message: "Price no longer in the expected spot",
                url,
                where: service.id,
              }),
            });

            return;
          }

          const concelho_str = title.split(", ");

          let concelho: number | null = null;

          const concelho_section = concelho_str.at(1);

          if (concelho_section) {
            concelho = concelhos[concelho_section] ?? null;
          }

          on.property(
            {
              price: price ?? null,
              style_lookup_id: style,
              title,
              url: link,
              concelho_id: concelho,
            },
            service,
          );
        }),
      );

      const p = await get_pagination(page);
      paginator = p.paginator;
      paginator_amount = p.paginator_amount;

      if (paginator_amount) {
        await paginator?.click();

        await wait_idle(page);
      }

      //   for (let i = 0; i < ads_amount; ++i) {
      //     const item = ads.nth(i);

      //     const anchor = item.locator(":scope > a[href]");

      //     console.log(await anchor.count());

      //     break;
      //   }
    } while (paginator_amount);

    // console.log(await paginator_amount, key);
  },
);

async function get_pagination(page: Page) {
  const pagination_section = page.locator("div.p-paginator");

  const pagination_amount = await pagination_section.count();

  const paginator = pagination_amount
    ? page.locator("button.p-paginator-next")
    : null;

  let paginator_amount = 0;
  if (paginator) {
    const is_disabled = await paginator.isDisabled();

    if (!is_disabled) {
      paginator_amount = await paginator.count();
    }
  }
  //   const paginator_amount = paginator ? await paginator.count() : 0;

  return {
    paginator,
    paginator_amount,
  };
}

async function wait_idle(page: Page) {
  try {
    await page.waitForLoadState("networkidle", { timeout: 3000 });
  } finally {
    return;
  }
}
