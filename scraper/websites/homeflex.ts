import { get_concelhos, get_on_methods } from "../config/local-storage";
import { EnqueueHandler, scrape_main } from "../config/wrapper";
import {
  common_parsing_errors,
  ParsingErrorV1,
} from "../events/errors/parsing-error";
import { get_text, resolve_url } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";
import { ScrapedData } from "../scraper-types";

const url_func = (page = 1) =>
  `https://www.homeflex.pt/imoveis?natureza=8&imovel=&distrito=&concelho=&freguesia=&preco-min=&preco-max=&tipologia-min=T0&tipologia-max=T6+ou+Superior&referencia=&submit-search=&page=${page}`;

export const scrape_homeflex = scrape_main(
  async ({ enqueue_links, on_pagination, page, service }) => {
    const on = get_on_methods();
    const concelhos = get_concelhos();
    const base = url_func();

    await page.goto(base);

    const last_page = await page
      .locator("ul.pagination .page-link")
      .last()
      .getAttribute("href");

    const url = new URL(resolve_url("https://www.homeflex.pt/", last_page!));

    const page_nr = url.searchParams.get("page")!;

    if (!page_nr) {
      on.error({
        error: new ParsingErrorV1({
          url: base,
          html: await page.content(),
          where: service.id,
          message: "No pagination is present.",
        }),
        service,
      });

      return;
    }

    const num = Number(page_nr);

    on_pagination(
      { pages: num, url_func, service },
      // { pages: 1, url_func, service },
      async ({ page, service, logger, current_page, url }) => {
        logger.info(`Scraping page ${current_page}`);
        const cards = page.locator(".card-container");

        const cards_amount = await cards.count();

        for (let i = 0; i < cards_amount; ++i) {
          const item = cards.nth(i);

          const href_el = item.locator("h3.card-title a[href]");

          const href = await href_el.getAttribute("href");

          if (!href) {
            on.error({
              error: common_parsing_errors.no_href({
                where: service.id,
                url,
                html: await page.content(),
              }),
              service,
            });

            return;
          }

          const link = resolve_url("https://www.homeflex.pt/", href);

          const title = await get_text(href_el);

          if (!title) {
            on.error({
              error: common_parsing_errors.no_title({
                where: service.id,
                url,
                html: await page.content(),
              }),
              service,
            });

            return;
          }

          let price = "Não listado";

          const price_el = item.locator("p.card-price").first();

          if ((await price_el.count()) == 1) {
            const price_text = await get_text(price_el);

            if (price_text) {
              if (/\d/g.test(price_text)) {
                price = price_text;
              }
            }
          }

          const style = parse_style(title);

          const location = item.locator("p.card-location").first();

          let concelho_id: number | null = null;

          if (await location.count()) {
            const location_text = await get_text(location);

            if (location_text) {
              const [, concelho] = location_text
                .split(",")
                .map((e) => e.trim());

              concelho_id = concelhos[concelho] ?? null;
            }
          }

          const scraped_data: ScrapedData = {
            title,
            price,
            url: link,
            concelho_id,
            style_lookup_id: style,
          };

          if (concelho_id == null) {
            scraped_data.description = await get_text(location);
          }

          on.property(scraped_data, service);
        }
      },
    );
    // on_pagination(
    //   { pages: real_pages.length + 1, url_func, service },
    //   async ({ current_page, logger, page, service, url }) => {
    //     logger.info(`URL: `, { url });
    //   }
    // );
  },
);

const enqueue_homeflex: EnqueueHandler = async ({ page, link, service }) => {
  const title_el = page.locator("h1");
  const on = get_on_methods();

  const title_amount = await title_el.count();

  if (title_amount !== 1) {
    // TODO
    return;
  }

  const title = await title_el.textContent().then((r) => r?.trim());

  if (!title) {
    // tODO

    return;
  }
  // console.log("title:", title);

  const price =
    (await page
      .locator("p.preco")
      .textContent()
      .then((r) => r?.trim())) ?? null;
  // console.log("price:", price);

  let style_base = parse_style(title!);

  const type = await page
    .locator("p.tipo-imovel span")
    .textContent()
    .then((r) => r?.trim());

  style_base ??= parse_style(type!);

  const concelho = await page
    .locator("p.concelho")
    .textContent()
    .then((r) => r?.trim());
  // console.log("concelho:", concelho);

  const concelhos = get_concelhos();
  const concelho_id = concelho ? (concelhos[concelho] ?? null) : null;

  on.property(
    { concelho_id, price, style_lookup_id: style_base, title, url: link },
    service,
  );
  // on.property({}, service);
};
