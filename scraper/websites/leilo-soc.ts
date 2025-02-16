import { get_concelhos, get_on_methods } from "../config/local-storage";
import { EnqueueHandler, scrape_many } from "../config/wrapper";
import { ParsingErrorV1 } from "../events/errors/parsing-error";
import { get_text, resolve_url } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";

const URLS = {
  direitos: (page = 1) =>
    `https://leilosoc.com/pt-PT/category/10/27-quinhao-hereditario/?slug=10&slug=27-quinhao-hereditario?page=${page}`,
  imovies: (page = 1) =>
    `https://leilosoc.com/pt-PT/category/5-imoveis/?page=${page}a&view=36`,
};

export const scrape_leilosoc = scrape_many(URLS, async (props) => {
  const { enqueue_links, logger, on_pagination, page, service, single } = props;
  const [key, url_func] = single;

  const on = get_on_methods();

  const base_url = url_func();

  await page.goto(base_url);
  await page.waitForLoadState("networkidle");

  const is_empty = await page.locator(".EmptyState_emptyState__SRALW").count();

  if (is_empty) {
    logger.info(`Skipping ${key} because it seems to be empty`);
    return;
  }

  const pages = await page
    .locator("select:last-of-type")
    .last()
    .locator("option")
    .all();

  on_pagination(
    {
      pages: pages.length,
      service,
      url_func,
    },
    async ({ current_page, logger, page, service, url }) => {
      logger.info(`Scraping page leilosoc:${key}:${current_page}`);

      await page.goto(url);

      const list = page.locator("main div[id]");

      const list_count = await list.count();

      for (let i = 0; i < list_count; i++) {
        const item = list.nth(i);

        const id = await item.getAttribute("id");

        if (!id) {
          continue;
        }

        const is_property_id = /^\d+-\d+$/.test(id);
        if (!is_property_id) {
          continue;
        }

        const anchor_el = item.locator("..");
        const el = await anchor_el.evaluate((e) => e.tagName.toLowerCase());

        if (el !== "a") {
          on.error({
            service,
            error: new ParsingErrorV1({
              message: "Anchor tag not found. Structure might have changed",
              url,
              where: service.id,
              html: await page.content(),
            }),
          });

          continue;
        }

        const href = await anchor_el.getAttribute("href");
        if (!href) {
          on.error({
            service,
            error: new ParsingErrorV1({
              message: "Anchor tag not found. Structure might have changed",
              url,
              where: service.id,
              html: await page.content(),
            }),
          });
          return;
        }

        const link = resolve_url("https://leilosoc.com", href);

        const price = await item
          .locator("span")
          .filter({ hasText: "€" })
          .textContent();

        if (!price) {
          on.error({
            error: new ParsingErrorV1({
              html: await page.content(),
              message: "No price in leilosoc",
              url,
              where: service.id,
            }),
            service,
          });
          continue;
        }
        enqueue_links({
          handler: enqueue_leilosoc(price),
          service,
          link,
        });
      }
    },
  );
});

const enqueue_leilosoc =
  (price: string): EnqueueHandler =>
  async ({ link, page, service }) => {
    //
    const on = get_on_methods();

    const title = await page.$("h1").then((r) => r?.textContent());

    if (!title) {
      on.error({
        service,
        error: new ParsingErrorV1({
          html: await page.content(),
          message: "No title found",
          url: link,
          where: service.id,
        }),
      });

      return;
    }

    const style = parse_style(title);

    const location = await page
      .locator("div")
      .filter({ hasText: "Localização", has: page.locator("h3") })
      .last()
      .locator("p")
      .last()
      .textContent();

    if (!location) {
      on.error({
        error: new ParsingErrorV1({
          message: "Location section has changed",
          html: await page.content(),
          url: link,
          where: service.id,
        }),
        service,
      });

      return;
    }

    const concelho_text = location.split(",").at(1);

    const concelhos = get_concelhos();
    const concelho = concelhos[concelho_text ?? ""] ?? null;

    const description_section = page.locator(
      'div > h3:has-text("Localização")',
    );

    const count = await description_section.count();

    let description_text = "";

    if (count) {
      for (let i = 0; i < count; ++i) {
        const str = "\n" + ((await get_text(description_section.nth(i))) ?? "");
        description_text + str;
      }
    }

    on.property(
      {
        title,
        url: link,
        style_lookup_id: style,
        price,
        concelho_id: concelho,
        description: description_text,
      },
      service,
    );
  };
