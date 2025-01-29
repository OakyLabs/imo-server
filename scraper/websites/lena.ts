import type { Page } from "playwright";
import { scrape_main } from "../config/wrapper";
import { get_on_methods } from "../config/local-storage";
import { common_parsing_errors } from "../events/errors/parsing-error";
import { resolve_url } from "../lib/helpers";

const url = "https://www.leiloeiradolena.com/leiloes";

export const scrape_leiloeira_do_lena = scrape_main(
  async ({ service, logger, page, enqueue_links }) => {
    await page.goto(url);
    await page.waitForLoadState("networkidle");

    await deal_with_popup(page);

    await page
      .locator('select[name="pesq_tipo_bem"].ajax_inpt')
      .selectOption("Imóvel");

    await page.waitForLoadState("networkidle");

    const get_listings_func = () => page.locator("#box_lista_leiloes > *");

    const loading_btn = page.locator("#bt_carregar_info");

    console.log(await loading_btn.isHidden(), await loading_btn.isVisible());

    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });

    while (await loading_btn.isVisible()) {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      await page.waitForLoadState("networkidle");
    }

    const listings = get_listings_func();
    const count = await listings.count();

    const on = get_on_methods();

    for (let i = 0; i < count; ++i) {
      const item = listings.nth(i);

      const anchor = item.locator("a[href]").first();

      const anchor_amount = await anchor.count();

      if (!anchor_amount) {
        on.error({
          error: common_parsing_errors.no_href({
            url,
            html: await page.content(),
            where: service.id,
          }),
          service,
        });

        return;
      }

      const href = await anchor.getAttribute("href");

      if (!href) {
        on.error({
          error: common_parsing_errors.no_href({
            url,
            html: await page.content(),
            where: service.id,
          }),
          service,
        });

        return;
      }

      const link = resolve_url("https://www.leiloeiradolena.com/", href);

      console.log(link);
      //
    }

    return;
  }
);

async function deal_with_popup(page: Page) {
  try {
    await page.waitForSelector("button.nyroModalClose", { timeout: 3000 });

    await page.locator("button.nyroModalClose").click({ timeout: 1000 });
  } catch (e) {
    return;
  }
}
