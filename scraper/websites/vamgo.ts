import { get_on_methods } from "../config/local-storage";
import { scrape_main } from "../config/wrapper";
import { common_parsing_errors } from "../events/errors/parsing-error";
import { resolve_url } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";

const url = "https://www.vamgo.pt/?cat=1&q=";

export const scrape_vamgo = scrape_main(async ({ page, service }) => {
  await page.goto(url);

  await page.waitForLoadState("networkidle");

  const listings = page.locator(".vendas .post_content");

  const on = get_on_methods();
  const listings_amount = await listings.count();

  for (let i = 0; i < listings_amount; ++i) {
    const item = listings.nth(i);

    const anchor = item.locator("a[href]").first();

    const href = await anchor.getAttribute("href");

    if (!href) {
      on.error({
        service,
        error: common_parsing_errors.no_href({
          html: await page.content(),
          url,
          where: service.id,
        }),
      });

      return;
    }

    const link = resolve_url("https://www.vamgo.pt/", href);

    const title_el = item.locator("h1").first();

    const title_amount = await title_el.count();

    if (title_amount !== 1) {
      on.error({
        error: common_parsing_errors.no_title({
          html: await page.content(),
          url,
          where: service.id,
        }),
        service,
      });

      return;
    }

    const title = await title_el.textContent().then((r) => r?.trim());

    if (!title) {
      on.error({
        error: common_parsing_errors.no_title({
          html: await page.content(),
          url,
          where: service.id,
        }),
        service,
      });

      return;
    }

    const price_table = item.locator("table");

    const base_price_section = price_table
      .locator("tr")
      .first()
      .locator("strong");

    let price: string | null = null;

    const base_price = await base_price_section.count();

    if (base_price === 1) {
      price =
        (await base_price_section.textContent().then((e) => e?.trim())) ?? null;
    }

    const description =
      (await item
        .locator(".texto_lote")
        .first()
        .textContent()
        .then((e) => e?.trim())) ?? "";

    const style = parse_style(description);

    on.property(
      {
        concelho_id: null,
        price,
        style_lookup_id: style,
        title,
        url: link,
        description,
      },
      service,
    );
  }
});
