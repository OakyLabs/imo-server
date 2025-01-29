import type { Page } from "playwright";
import { get_on_methods } from "../config/local-storage";
import { scrape_many, EnqueueHandler } from "../config/wrapper";
import { ParsingErrorV1 } from "../events/errors/parsing-error";
import { parse_style } from "../lib/parse-style";

const URLS = {
  imoveis: "https://vendajudicial.pt/bens-imoveis/",
  direitos: "https://vendajudicial.pt/direitos-e-quotas/",
};

export const scrape_venda_judicial = scrape_many(URLS, async (props) => {
  const { enqueue_links, logger, page, service, single } = props;
  const [key, url] = single;

  const on = get_on_methods();

  logger.info(`Starting to scrape venda_judicial:${key}`);

  await page.goto(url);

  if (await check_is_empty(page)) {
    logger.info(`Skipping ${url}e it seems to be empty`);

    return;
  }

  const all_elements = page.locator('[id^="post-"]');

  const all_elements_count = await all_elements.count();

  for (let i = 0; i < all_elements_count; ++i) {
    const item = all_elements.nth(i);

    const text_column = item.locator(".wpb_column h2 a");

    const href = await text_column.getAttribute("href");

    if (!href) {
      on.error({
        service: service,
        error: new ParsingErrorV1({
          html: await page.content(),
          url,
          where: service.id,
          message: "Couldn't find href",
        }),
      });

      continue;
    }

    const description = item.locator(".mkd-post-excerpt");

    const price_amount = extract_euro_amount(
      (await description.textContent()) ?? ""
    );

    enqueue_links({
      link: href,
      service,
      handler: enqueue_venda_judicial(price_amount),
    });
  }
});

const euro_amount_regex = /(\d{1,3}(?:\.\d{3})*,\d{2})€/;

// Function to extract euro amount
function extract_euro_amount(input: string): string | null {
  const match = input.match(euro_amount_regex);
  return match ? match[1] + "€" : null;
}

const enqueue_venda_judicial =
  (price: string | null): EnqueueHandler =>
  async ({ link, page, service }) => {
    const on = get_on_methods();
    const title = await page

      .$(".mkd-post-title")
      .then((r) => r?.textContent())
      .then((r) => r?.trim());

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

    const style = parse_style(title);

    on.property(
      { title, url: link, price, style_lookup_id: style, concelho_id: null },
      service
    );
  };

async function check_is_empty(page: Page) {
  const elements = await page.locator('[id^="post-"]').count();

  return elements === 0;
}
