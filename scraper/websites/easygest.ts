import { get_concelhos, get_on_methods } from "../config/local-storage";
import { EnqueueHandler, scrape_main } from "../config/wrapper";
import { common_parsing_errors } from "../events/errors/parsing-error";
import { resolve_url } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";

const url_func = (page = 1) =>
  `https://www.easygest.com.pt/imoveis/destaque?lbl=1&pag=${page}`;

export const scrape_easygest = scrape_main(
  async ({ enqueue_links, on_pagination, page, service }) => {
    const url = url_func();

    await page.goto(url);
    await page.waitForLoadState("networkidle");

    const pagination = page.locator("ul.paginationWrapper");

    const last_page_el = pagination.locator("li").last();

    const last_page = await last_page_el.textContent().then((r) => r?.trim());

    let page_nr = 1;

    if (last_page) {
      let last_page_nr = Number(last_page);

      if (!Number.isNaN(last_page_nr)) {
        page_nr = last_page_nr;
      }
    }

    const on = get_on_methods();

    on_pagination(
      { pages: page_nr, service, url_func, should_wait_network_idle: true },
      async ({ page, service, url }) => {
        //
        const property_items = page.locator("div.propertyItem");

        const property_items_amount = await property_items.count();

        for (let i = 0; i < property_items_amount; ++i) {
          const item = property_items.nth(i);

          const anchor_el = item.locator("a[href]").first();

          if (!(await anchor_el.count())) {
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

          const href = await anchor_el.getAttribute("href");

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

          const link = resolve_url("https://www.easygest.com.pt/", href);

          enqueue_links({
            handler: enqueue_easygest,
            link,
            service,
          });
        }
      }
    );
  }
);

const enqueue_easygest: EnqueueHandler = async ({ link, page, service }) => {
  const title_el = page.locator(".propertyTitle h1").first();

  const on = get_on_methods();
  const title = await title_el.textContent().then((r) => r?.trim());

  if (!title) {
    on.error({
      service,
      error: common_parsing_errors.no_title({
        html: await page.content(),
        url: link,
        where: service.id,
      }),
    });

    return;
  }

  const location = page.locator("div.propertyLocation");

  const concelho_freguesia = await location
    .textContent()
    .then((r) => r?.split(">").map((e) => e.trim())[0]);

  const concelhos = get_concelhos();
  const concelho = concelhos[concelho_freguesia || ""] ?? null;

  let price: string | null = null;

  const price_loc = page.locator(".propertyPrice .value");

  if (await price_loc.count()) {
    price =
      (await price_loc
        .first()
        .textContent()
        .then((r) => r?.trim())) ?? null;
  }

  const style = parse_style(title);

  on.property(
    {
      concelho_id: concelho,
      price,
      url: link,
      style_lookup_id: style,
      title,
    },
    service
  );
};
