import { type Page } from "playwright";
import { scrape_main } from "../config/wrapper";
import { get_concelhos, get_on_methods } from "../config/local-storage";
import { ParsingErrorV1 } from "../events/errors/parsing-error";
import { resolve_url } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";

const url = "https://www.justavenda.pt/vendas/?tipo=imovel";

export const scrape_justa_venda = scrape_main(
  async ({ logger, page, service }) => {
    logger.info(`About to start scraping ${url}`);

    await page.goto(url);

    if (await check_is_empty(page)) {
      logger.debug(`Skipping ${url}, because it seems to be empty`);
    }
    const on = get_on_methods();

    const auction_list = await page.$$('[id^="auction-"]');

    if (!auction_list.length) {
      on.error({
        service,
        error: new ParsingErrorV1({
          html: await page.content(),
          url,
          message:
            "No auctions available even though listing is not empty. Structure changed?",
          where: service.id,
        }),
      });

      return;
    }

    const concelhos = get_concelhos();
    for (const item of auction_list) {
      const label = await item.$(".status .status-label");

      if (label) {
        const text = await label.textContent();

        if (text) {
          if (/terminado/i.test(text)) {
            continue;
          }
        }
      }

      const id = await item.getAttribute("id");

      if (!id) {
        on.error({
          service,
          error: new ParsingErrorV1({
            html: await page.content(),
            url,
            message:
              "Tried retrieving id, but could not find. Structure changed?",
            where: service.id,
          }),
        });

        continue;
      }

      const href = resolve_url("https://www.justavenda.pt/vendas", `#${id}`);

      const title = await item
        .$('[id^="bid-card-"] .text-sm')
        .then((r) => r?.textContent())
        .then((r) => r?.trim().split("\n").join(" - "));

      if (!title) {
        on.error({
          service,
          error: new ParsingErrorV1({
            html: await page.content(),
            message: "No title",
            url: href,
            where: service.id,
          }),
        });

        continue;
      }

      const style = await item
        .$(".item-type span")
        .then((r) => r?.textContent())
        .then((r) => r?.trim());

      const style_type = parse_style(style ?? "");

      const location_trimmed = await item
        .$(".item-location span")
        .then((r) => r?.textContent())
        .then((r) => r?.trim());

      const concelho = concelhos[location_trimmed?.trim() ?? ""] ?? null;

      const price_base = await item
        .$(".actions .value")
        .then((r) => r?.textContent())
        .then((r) => r?.trim().replace("€", "") ?? null);

      on.property(
        {
          title,
          url: href,
          concelho_id: concelho,
          style_lookup_id: style_type,
          price: price_base,
        },
        service
      );
    }
  }
);

async function check_is_empty(page: Page) {
  const main_children_count = await page
    .locator("main")
    .locator(":scope > *")
    .count();

  return main_children_count === 2;
}
