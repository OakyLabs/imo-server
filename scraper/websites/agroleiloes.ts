import { RealEstate } from "../../db/real-estate";
import { get_on_methods } from "../config/local-storage";
import { scrape_many } from "../config/wrapper";
import { common_parsing_errors } from "../events/errors/parsing-error";
import { resolve_url } from "../lib/helpers";

const URLS = {
  terrenos: [
    "http://www.agroleiloes.net/index.php/negociacao-particular/terrenos",
    RealEstate.ConstrucaoTerrenoRustico,
  ],
  // moradias:
  //   "http://www.agroleiloes.net/index.php/negociacao-particular/moradias",
  // armazens:
  //   "http://www.agroleiloes.net/index.php/negociacao-particular/armazens",

  // apartamentos:
  //   "http://www.agroleiloes.net/index.php/negociacao-particular/apartamentos",
  // garagens:
  //   "http://www.agroleiloes.net/index.php/negociacao-particular/garagens",
} satisfies Record<string, [string, RealEstate]>;

export const scrape_agro_leiloes = scrape_many(
  URLS,
  async ({ logger, page, service, single }) => {
    // @ts-ignore
    const [key, [url, style]] = single;

    await page.goto(url);

    logger.info(`Starting to scrape agroleiloes:${key}`);

    const locator = page.locator(".vm-products-horizon");

    const listings_amount = await locator.count();
    console.log("listings_amount:", listings_amount);

    if (!listings_amount) {
      logger.info(`Skipping ${key} because it seems to be empty`);
      return;
    }

    const on = get_on_methods();

    for (let i = 0; i < listings_amount; ++i) {
      const item = locator.nth(i);

      const anchor_and_title = item
        .locator(".vm-product-descr-container-1")
        .first();

      const anchor_and_title_el = anchor_and_title.locator("h2 a").first();

      if (!(await anchor_and_title_el.count())) {
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

      const href = await anchor_and_title_el.getAttribute("href");

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

      const title = await anchor_and_title_el
        .textContent()
        .then((r) => r?.trim());

      if (!title) {
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

      console.log("title:", resolve_url("http://www.agroleiloes.net/", href));
    }
  }
);
