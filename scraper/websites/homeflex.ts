import { get_concelhos, get_on_methods } from "../config/local-storage";
import { EnqueueHandler, scrape_main } from "../config/wrapper";
import { resolve_url } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";

const url_func = (page = 1) =>
  `https://www.homeflex.pt/imoveis?natureza=8&imovel=&distrito=&concelho=&freguesia=&preco-min=&preco-max=&tipologia-min=T0&tipologia-max=T6+ou+Superior&referencia=&submit-search=&page=${page}`;

export const scrape_homeflex = scrape_main(
  async ({ enqueue_links, on_pagination, page, service }) => {
    const base = url_func();

    await page.goto(base);

    const last_page = await page
      .locator("ul.pagination .page-link")
      .last()
      .getAttribute("href");

    const url = new URL(resolve_url("https://www.homeflex.pt/", last_page!));

    const page_nr = url.searchParams.get("page")!;

    if (!page_nr) {
      // TODO
      return;
    }

    const num = Number(page_nr);

    on_pagination(
      { pages: num, url_func, service },
      // { pages: 1, url_func, service },
      async ({ page, service }) => {
        const cards = page.locator(".card-container");

        const cards_amount = await cards.count();

        for (let i = 0; i < cards_amount; ++i) {
          const item = cards.nth(i);

          const href = await item
            .locator("h3.card-title a[href]")
            .getAttribute("href");

          if (!href) {
            // TODO
            return;
          }

          const link = resolve_url("https://www.homeflex.pt/", href);

          enqueue_links({
            handler: enqueue_homeflex,
            link,
            service,
          });
        }
      }
    );
    // on_pagination(
    //   { pages: real_pages.length + 1, url_func, service },
    //   async ({ current_page, logger, page, service, url }) => {
    //     logger.info(`URL: `, { url });
    //   }
    // );
  }
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
  const concelho_id = concelho ? concelhos[concelho] ?? null : null;

  on.property(
    { concelho_id, price, style_lookup_id: style_base, title, url: link },
    service
  );
  // on.property({}, service);
};
