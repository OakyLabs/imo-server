import { get_on_methods } from "../config/local-storage";
import { scrape_main } from "../config/wrapper";
import { ParsingErrorV1 } from "../events/errors/parsing-error";

const url = "https://www.solventium.pt/?chkimoveis=I&q=";

export const scrape_solventium = scrape_main(async ({ page, service }) => {
  await page.goto(url);

  const listings = page.locator("div.lista_vendas div.post_content");
  const on = get_on_methods();

  const listings_count = await listings.count();

  for (let i = 0; i < listings_count; ++i) {
    const item = listings.nth(i);

    const anchor_el = item.locator("a[href]").first();

    const anchor_count = await anchor_el.count();

    if (anchor_count !== 1) {
      on.error({
        service,
        error: new ParsingErrorV1({
          html: await page.content(),
          message: "No href",
          url,
          where: service.id,
        }),
      });

      return;
    }
  }
});
