import type { Page } from "playwright";
import { get_on_methods } from "../config/local-storage";
import { scrape_many } from "../config/wrapper";
import { ParsingErrorV1 } from "../events/errors/parsing-error";

// TODO: Varias verbas

const URLS = {
  imoveis: "https://www.viaserumos.pt/pt/filtrar/1/Tipo%20de%20bens",
  diretos: "https://www.viaserumos.pt/pt/filtrar/7/Tipo%20de%20bens",
};

export const scrape_vias_e_rumos = scrape_many(URLS, async (props) => {
  const { logger, page, service, single } = props;
  const [key, url] = single;

  logger.info(`About to start scraping vias_e_rumos:${key}`);
  const on = get_on_methods();

  await page.goto(url);

  if (await check_is_empty(page)) {
    logger.info(`Skipping ${url} becasue it seems to be empty`);

    return;
  }

  const list = page.locator(".each_prod");

  const list_count = await list.count();

  if (list_count === 0) {
    on.error({
      service,
      error: new ParsingErrorV1({
        html: await page.content(),
        url,
        where: service.id,
        message: "No individual cards even though it does not say it is empty",
      }),
    });

    return;
  }

  for (let i = 0; i < list_count; ++i) {
    const item = list.nth(i);

    const link = item.locator("a[href]").first();

    const href = await link.getAttribute("href");

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
  }
});

async function check_is_empty(page: Page) {
  const locator = await page.locator(".no-data-here").count();

  return locator !== 0;
}
