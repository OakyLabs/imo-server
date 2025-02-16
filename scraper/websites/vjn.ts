import type { Page } from "playwright";
import { get_on_methods } from "../config/local-storage";
import { scrape_main, EnqueueHandler } from "../config/wrapper";
import { common_parsing_errors } from "../events/errors/parsing-error";
import { get_text, resolve_url } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";

const url = "https://www.vjn.pt/?chkimoveis=I&q=";

export const scrape_vjn = scrape_main(
  async ({ enqueue_links, page, service }) => {
    await page.goto(url);

    const list = page.locator(".home_block_advert");

    const on = get_on_methods();
    const listings_amount = await list.count();

    for (let i = 0; i < listings_amount; ++i) {
      const item = list.nth(i);

      const anchor = item.locator("a[href]").first();

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

      const link = resolve_url("https://www.vjn.pt/", href);

      enqueue_links({ handler: enqueue_vjn, link, service }, true);
    }
  },
);

const enqueue_vjn: EnqueueHandler = async ({ link, logger, page, service }) => {
  logger.info(`Starting to scrape individual from vjn`);

  await wait_for_terminated(page);
  const terminated_auction = page.locator("#leilao_terminado");

  const is_terminated = await terminated_auction.isVisible();

  if (is_terminated) {
    logger.info(`Skipping individual auction because it is terminated`);

    return;
  }
  logger.info(`Not skipping because it is not terminated`);

  const title_el = page
    .locator("h4.title > span")
    .nth(1)
    .locator(":scope > a")
    .last();

  const title_count = await title_el.count();
  const on = get_on_methods();

  if (title_count !== 1) {
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

  const title = await title_el.textContent().then((e) => e?.trim());

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

  const price =
    (await page
      .locator(".infobox_valorbase p")
      .first()
      .textContent()
      .then((e) => e?.trim())) ?? null;

  const description = page.locator(".post_content");

  const description_text = await get_text(description);

  on.property(
    {
      concelho_id: null,
      price,
      style_lookup_id: parse_style(title),
      title,
      url: link,
      description: description_text,
    },
    service,
  );
};

async function wait_for_terminated(page: Page) {
  try {
    await page.waitForSelector("#leilao_terminado", {
      state: "visible",
      timeout: 500,
    });
  } finally {
    return;
  }
}
