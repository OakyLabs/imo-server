import { get_on_methods, get_concelhos } from "../config/local-storage";
import { scrape_many, EnqueueHandler } from "../config/wrapper";
import { ParsingErrorV1 } from "../events/errors/parsing-error";
import { resolve_url } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";

const URLS = {
  imoveis: "https://www.onefix-leiloeiros.pt/tipo_verbas/1/Imoveis",
  direitos: "https://www.onefix-leiloeiros.pt/tipo_verbas/4/Direitos_e_Marcas",
} as const;

export const scrape_one_fix = scrape_many(
  URLS,
  async ({ enqueue_links, logger, page, service, single }) => {
    const [key, url] = single;

    logger.info(`About to start scraping onefix:${key}`);

    const on = get_on_methods();

    await page.goto(url);

    const property_grid = page.locator(".property_grid");

    const property_count = await property_grid.count();
    const concelhos = get_concelhos();

    for (let i = 0; i < property_count; ++i) {
      const item = property_grid.nth(i);

      const location_el = item.locator("span");

      const location = await location_el.textContent();

      //   Every propoerty auction has location
      if (!location?.trim()) {
        continue;
      }

      const concelho_text = location.split(",").at(-1)?.trim() ?? null;

      let concelho: number | null = null;

      if (concelho_text) {
        concelho = concelhos[concelho_text] ?? null;
      }

      const link = item.locator(".property-text a[href]").first();

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

      const target_url = resolve_url("https://www.onefix-leiloeiros.pt", href);

      enqueue_links({
        link: target_url,
        service,
        handler: enqueue_one_fix(concelho),
      });
    }
  }
);

const enqueue_one_fix =
  (concelho: number | null): EnqueueHandler =>
  async ({ link, page, service }) => {
    const on = get_on_methods();

    let title = await page
      .locator("h3")
      .first()
      .textContent()
      .then((r) => r?.trim());

    if (!title) {
      on.error({
        service,
        error: new ParsingErrorV1({
          html: await page.content(),
          message: "No title found in anchor tag. Potentially changed",
          url: link,
          where: service.id,
          more_info: JSON.stringify({ title }),
        }),
      });

      return;
    }

    const matched_string = title.match(/^.*?\)/);

    if (matched_string) {
      title = matched_string[0];
    }

    const style = parse_style(title);

    const price_section = page
      .locator(".profile_data.c-verba-sidebar-list")
      .first()
      .locator('li:has-text("€")')
      .first();

    let price: string | null = null;

    if (await price_section.count()) {
      price =
        (await price_section.textContent().then((r) => r?.trim())) ?? null;
    }

    on.property(
      {
        title,
        url: link,
        concelho_id: concelho,
        style_lookup_id: style,
        price,
      },
      service
    );
  };
