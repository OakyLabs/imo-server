import { get_on_methods } from "../config/local-storage";
import { EnqueueHandler, scrape_main } from "../config/wrapper";
import { common_parsing_errors } from "../events/errors/parsing-error";
import { parse_style } from "../lib/parse-style";

const url = "https://www.estamo.pt/category/emvenda/";

export const scrape_estamo = scrape_main(async (props) => {
  const { page, logger, service, enqueue_links } = props;
  const on = get_on_methods();

  logger.info(`Starting to scrape estamo`);

  await page.goto(url);

  const list = page.locator("article.post");

  const list_count = await list.count();

  if (!list_count) {
    return;
  }

  for (let i = 0; i < list_count; ++i) {
    const item = list.nth(i);

    const anchor = item.locator("a[href]").first();

    const anchor_count = await anchor.count();

    if (!anchor_count) {
      on.error({
        error: common_parsing_errors.no_href({
          html: await page.content(),
          url,
          where: service.id,
        }),
        service,
      });

      continue;
    }

    const link = await anchor.getAttribute("href");

    if (!link) {
      on.error({
        error: common_parsing_errors.no_href({
          html: await page.content(),
          url,
          where: service.id,
        }),
        service,
      });

      continue;
    }

    enqueue_links({ link, service, handler: enqueue_estamo });
  }
});

const enqueue_estamo: EnqueueHandler = async ({
  link,
  logger,
  page,
  service,
}) => {
  logger.info(`Scraping estamo:${link}`);
  const on = get_on_methods();

  const title_el = page.locator("h1.entry-title").first();

  const text_el_count = await title_el.count();

  if (!text_el_count) {
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

  const tr = page.locator('tr:has(span:text("€")) span:has-text("€")').first();

  const price = (await tr.count())
    ? await tr.textContent().then((r) => r?.trim() ?? null)
    : null;

  const style = parse_style(title);

  on.property(
    { title, url: link, price, style_lookup_id: style, concelho_id: null },
    service
  );
};
