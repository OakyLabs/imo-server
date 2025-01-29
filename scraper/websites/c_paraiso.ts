import type { Page } from "playwright";
import { EnqueueHandler, scrape_many } from "../config/wrapper";
import { get_concelhos, get_on_methods } from "../config/local-storage";
import {
  common_parsing_errors,
  ParsingErrorV1,
} from "../events/errors/parsing-error";
import { parse_style } from "../lib/parse-style";

const web_link = "https://cparaiso.pt/lots?cat=realestate";

const URLS = {
  online: "https://cparaiso.pt/pt/auction/list?tipo=1&categoria=5&distrito=",
  presencial:
    "https://cparaiso.pt/pt/auction/list?tipo=2&categoria=5&distrito=",
  particular:
    "https://cparaiso.pt/pt/auction/list?tipo=3&categoria=5&distrito=",
  carta_fechada:
    "https://cparaiso.pt/pt/auction/list?tipo=4&categoria=5&distrito=",
};

export const scrape_cparaiso = scrape_many(
  URLS,
  async ({ page, logger, service, enqueue_links, single }) => {
    const [key, url] = single;
    const on = get_on_methods();

    logger.info(`Starting to scrape cparaiso:${key}`);

    await page.goto(url);

    await page.waitForLoadState("networkidle");

    await deal_with_cookies(page);

    await close_btn(page);

    const grid = page.locator(".auction-grid");

    const count = await grid.count();

    if (count !== 1) {
      on.error({
        error: new ParsingErrorV1({
          url,
          html: await page.content(),
          where: service.id,
          message: "Auction grid has changed...",
        }),
        service,
      });

      return;
    }

    const empty_locator = grid.locator(":scope > p");

    const empty_locator_amount = await empty_locator.count();

    if (empty_locator_amount) {
      logger.info(`Skipping ${key} because it seems to be empty`);

      return;
    }

    const options = grid.locator(":scope ul li");

    const length = await options.count();

    for (let i = 0; i < length; ++i) {
      const item = options.nth(i);

      const anchor_el = item.locator("a[href]").first();

      const anchor_amount = await anchor_el.count();

      if (!anchor_amount) {
        on.error({
          service,
          error: common_parsing_errors.no_href({
            where: service.id,
            html: await page.content(),
            url,
          }),
        });

        return;
      }

      const anchor = await anchor_el.getAttribute("href");

      if (!anchor) {
        on.error({
          service,
          error: common_parsing_errors.no_href({
            where: service.id,
            html: await page.content(),
            url,
          }),
        });

        return;
      }

      enqueue_links(
        { link: anchor, service, handler: enqueue_c_paraiso },
        true
      );
    }

    //await new Promise(() => {});
  }
);

const enqueue_c_paraiso: EnqueueHandler = async ({ service, link, page }) => {
  const on = get_on_methods();

  const title_el = page.locator("h1:not(.logo)").first();

  const title_amount = await title_el.count();

  if (title_amount !== 1) {
    on.error({
      error: common_parsing_errors.no_title({
        url: link,
        html: await page.content(),
        where: service.id,
      }),
      service,
    });

    return;
  }

  const title = await title_el.textContent().then((e) => e?.trim());

  if (!title) {
    on.error({
      error: common_parsing_errors.no_title({
        url: link,
        html: await page.content(),
        where: service.id,
      }),
      service,
    });

    return;
  }

  const price_el = page.locator(".amount");

  const price_amount = await price_el.count();

  let price: string | null = null;

  if (price_amount === 1) {
    const price_text = await price_el.textContent().then((e) => e?.trim());

    if (price_text) {
      price = price_text;
    }
  }

  const style = parse_style(title);

  const details = page.locator('.detais p:has-text("Concelho:")');

  let concelho: number | null = null;

  const details_amount = await details.count();

  if (details_amount === 1) {
    const text = await details.textContent().then((r) => r?.trim());

    if (text) {
      const concelhos = get_concelhos();
      //
      const concelho_text = text.split(":").at(1)?.trim();

      if (concelho_text) {
        concelho = concelhos[concelho_text];
      }
    }
  }

  on.property(
    { title, price, url: link, concelho_id: concelho, style_lookup_id: style },
    service
  );
};

async function deal_with_cookies(page: Page) {
  try {
    await page.waitForSelector("#accept_all_cookies", { timeout: 500 });

    const locator = page.locator("#accept_all_cookies");

    await locator.click();
  } finally {
    return;
  }
}

async function close_btn(page: Page) {
  try {
    await page.waitForSelector(".closer", { timeout: 500 });

    await page.locator(".closer").click();
  } finally {
    return;
  }
}
