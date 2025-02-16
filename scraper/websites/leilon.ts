import type { Page } from "playwright";
import { EnqueueHandler, scrape_many } from "../config/wrapper";
import { get_on_methods } from "../config/local-storage";
import {
  common_parsing_errors,
  ParsingErrorV1,
} from "../events/errors/parsing-error";
import { parse_style } from "../lib/parse-style";
import { to_pascal_case } from "../lib/pascal";
import { get_text } from "../lib/helpers";

const URLS = {
  imoveis: (page = 1) =>
    `https://www.leilon.pt/pt/auction/search?category=13&page=${page}`,
  direitos: (page = 1) =>
    `https://www.leilon.pt/pt/auction/search?category=25&page=${page}`,
};

export const scrape_leilon = scrape_many(URLS, async (props) => {
  const { enqueue_links, logger, on_pagination, page, service, single } = props;
  const on = get_on_methods();
  const [key, url_func] = single;

  const url = url_func();

  await page.goto(url);

  logger.info(`About to start scraping leilon:${key}`);

  await deal_with_cookies_acceptance(page);

  const last_page = await page
    .locator(".pager ul li")
    .last()
    .textContent()
    .then((r) => r?.trim());

  if (!last_page || Number.isNaN(+last_page)) {
    on.error({
      service,
      error: new ParsingErrorV1({
        html: await page.content(),
        url: url_func(),
        where: service.id,
        more_info: JSON.stringify({ last_page }),
        message: "Error parsing pagination",
      }),
    });

    await page.close();

    return;
  }

  on_pagination(
    { pages: +last_page, service, url_func },
    async ({ page, service, url }) => {
      const listings = page.locator("li.lot");

      const count = await listings.count();

      for (let i = 0; i < count; i++) {
        const item = listings.nth(i);

        const has_terminated = (await item.locator(".terminated").count()) > 0;

        if (has_terminated) {
          continue;
        }

        const link = await item.locator(".lot-info a").getAttribute("href");

        if (!link) {
          on.error({
            service,
            error: common_parsing_errors.no_href({
              html: await page.content(),
              url: url,
              where: service.id,
              more_info: JSON.stringify({ link }),
            }),
          });

          continue;
        }

        enqueue_links(
          {
            handler: enqueue_leilon,
            link,
            service,
          },
          true,
        );
      }
    },
  );
});

const enqueue_leilon: EnqueueHandler = async ({
  link,
  logger,
  page,
  service,
}) => {
  logger.info(`Scraping ${link} of leilon`);

  const on = get_on_methods();

  const title = await page
    .$(".title h1")
    .then((r) => r?.textContent())
    .then((r) => r?.trim());

  if (!title) {
    on.error({
      error: new ParsingErrorV1({
        html: await page.content(),
        message: "No title",
        url: link,
        where: service.id,
      }),
      service,
    });

    return;
  }

  const price = await page
    .locator(".list-reserve-amount-info")
    .textContent()
    .then((r) => r?.trim() ?? null);

  const style = parse_style(title);

  const description_section = page.locator(".additional-content #description");

  let description: string | null = "";

  if (await description_section.count()) {
    description = await get_text(description_section);
  }

  on.property(
    {
      url: link,
      style_lookup_id: style,
      title: to_pascal_case(title),
      price: price,
      concelho_id: null,
      description,
    },
    service,
  );
};

async function deal_with_cookies_acceptance(page: Page) {
  try {
    await page.waitForSelector("#accept_selected_cookies");
    await page.click("#accept_selected_cookies");
  } catch (_error) {
    return;
  }
}
