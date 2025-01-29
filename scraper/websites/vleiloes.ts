import type { Page } from "playwright";
import { get_on_methods } from "../config/local-storage";
import { scrape_many, EnqueueHandler } from "../config/wrapper";
import {
  common_parsing_errors,
  ParsingErrorV1,
} from "../events/errors/parsing-error";
import { resolve_url } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";

const URLS = {
  imovies: "https://www.vleiloes.com/?chkimoveis=I&q=&selectdistrito=0",
  direitos: "https://www.vleiloes.com/?chkdireitos=D&q=&selectdistrito=0",
};

export const scrape_v_leiloes = scrape_many(URLS, async (props) => {
  const { enqueue_links, logger, page, service, single } = props;
  const [key, url] = single;

  logger.info(`Scraping vleiloes:${key}`);

  const on = get_on_methods();

  await page.goto(url);
  await page.waitForLoadState("networkidle");

  if (await check_is_empty(page)) {
    logger.info(`Skipping ${url} because it seems to be empty`);

    return;
  }

  const list_of_sales = page.locator(".lista_vendas").locator(":scope > *");

  const list_amount = await list_of_sales.count();

  for (let i = 0; i < list_amount; ++i) {
    const item = list_of_sales.nth(i);

    const is_ongoing = item.locator("div#infobox_tempo small");

    const is_terminated = await is_ongoing.getAttribute("style");

    if (is_terminated) {
      continue;
    }

    const title_el = item.locator("a[href]:has(h1)");

    const href = await title_el.getAttribute("href");

    if (!href) {
      on.error({
        service,
        error: common_parsing_errors.no_href({
          html: await page.content(),
          url: URLS[key],
          where: service.id,
        }),
      });

      continue;
    }

    const link = resolve_url("https://www.vleiloes.com/", href);

    enqueue_links({ link, service, handler: enqueue_vleiloes });
  }
});

const enqueue_vleiloes: EnqueueHandler = async ({ link, page, service }) => {
  const on = get_on_methods();
  const title_el = await page.locator("h2.post_title").textContent();
  if (!title_el) {
    on.error({
      error: new ParsingErrorV1({
        message: "No title found",
        html: await page.content(),
        url: link,
        where: service.id,
      }),
      service,
    });

    return;
  }

  const title = title_el.trim();

  const description = await page
    .locator("div.post_content p")
    .first()
    .textContent();

  const style = parse_style(description ?? "");

  const price = await page
    .locator('.infobox_valores p:has-text("€")')
    .first()
    .textContent();

  on.property(
    {
      title,
      url: link,
      price,
      style_lookup_id: style,
      concelho_id: null,
    },
    service
  );

  //   await new Promise(() => {});
  //   //   await page.evaluate(() => {

  //   })
};

async function check_is_empty(page: Page) {
  const count = await page.locator(".filtro_vazio").count();

  return count !== 0;
}
