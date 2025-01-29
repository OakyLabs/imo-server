import type { Page } from "playwright";
import { EnqueueHandler, scrape_main } from "../config/wrapper";
import { get_concelhos, get_on_methods } from "../config/local-storage";
import {
  common_parsing_errors,
  ParsingErrorV1,
} from "../events/errors/parsing-error";
import { RealEstate } from "../../db/real-estate";
import { parse_style } from "../lib/parse-style";

const URLS = "https://www.imoloriente.pt/categoria-produto/imoveis/";

async function check_is_empty(page: Omit<Page, "close">) {
  const selector = ".woocommerce-no-products-found";

  const amount = await page.locator(selector).count();

  return !!amount;
}

export const scrape_imoloriente = scrape_main(
  async ({ enqueue_links, logger, page, service }) => {
    const web_url = URLS;

    await page.goto(web_url);
    await page.waitForLoadState("networkidle");
    logger.info(`Starting to scrape ${web_url}`);

    if (await check_is_empty(page)) {
      logger.info(`Skipping ${web_url} becaues it seems to be empty`);

      return;
    }

    const on = get_on_methods();
    const listings = page.locator(".products-container li");

    for (let i = 0; i < (await listings.count()); ++i) {
      const item = listings.nth(i);

      const is_sold_locator = item.locator(".isb_sale_badge");

      if (await is_sold_locator.count()) {
        logger.info(`Skipping item because it has been sold`);

        return;
      }

      const is_over_locator = item.locator(
        ".product-inner .price .“winned-for"
      );

      if (await is_over_locator.count()) {
        logger.info(`Skipping item because it is over`);
        return;
      }

      const link_locator = item.locator(".product-loop-title[href]");

      const link_amount = await link_locator.count();

      if (!link_amount) {
        on.error({
          service,
          error: common_parsing_errors.no_href({
            html: await page.content(),
            url: web_url,
            where: service.id,
          }),
        });

        continue;
      }

      const link = await link_locator.getAttribute("href");

      if (!link) {
        on.error({
          service,
          error: common_parsing_errors.no_href({
            html: await page.content(),
            url: web_url,
            where: service.id,
          }),
        });

        continue;
      }

      const possible_concelho_locator = await item.locator(
        ".product-content p:first-of-type"
      );

      let concelho: number | null = null;
      if (await possible_concelho_locator.count()) {
        const possible_concelho = await possible_concelho_locator
          .first()
          .textContent()
          .then((r) => r?.trim() ?? null);

        const concelhos = get_concelhos();
        concelho = possible_concelho ? concelhos[possible_concelho] : null;
      }

      const style_locator = item.locator(".category-list a").first();

      const style_amount = await style_locator.count();

      let style: RealEstate | null = null;

      if (style_amount) {
        const style_component = await style_locator
          .textContent()
          .then((r) => r?.trim() ?? null);

        style = parse_style(style_component ?? "");
      }

      enqueue_links({
        handler: enqueue_imoloriente(concelho, style),
        link,
        service,
      });
    }
  }
);

const enqueue_imoloriente =
  (concelho_id: number | null, style: RealEstate | null): EnqueueHandler =>
  async ({ link, page, service }) => {
    const on = get_on_methods();
    const title = await page
      .$("h2.product_title")
      .then((e) => e?.textContent());

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

    const price = await page
      .$(".woocommerce-Price-amount.amount")
      .then((r) => r?.textContent() ?? null);

    if (style == null) {
      style = parse_style(title);
    }

    on.property(
      {
        title: title.trim(),
        style_lookup_id: style,
        concelho_id,
        url: link,
        price,
      },
      service
    );
  };
