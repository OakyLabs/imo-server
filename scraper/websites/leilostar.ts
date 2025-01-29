import { get_concelhos, get_on_methods } from "../config/local-storage";
import { EnqueueHandler, scrape_main } from "../config/wrapper";
import {
  common_parsing_errors,
  ParsingErrorV1,
} from "../events/errors/parsing-error";
import { resolve_url } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";

const url_func = (page = 1) =>
  `https://www.leilostar.pt/index.php?page=bem_list&order=&modalidade_venda=&natureza=IMOVEL&tipo_bem_id=&distritoId=&concelhoId=&freguesiaId=&greaterThan=&lowerThan=&freeSearch=&pn=${page}`;

export const scrape_leilostar = scrape_main(
  async ({ enqueue_links, logger, page, service, on_pagination }) => {
    const base_url = url_func();

    logger.info(`Starting on leilostar`);
    await page.goto(base_url);

    await page.waitForLoadState("networkidle");

    const pagination_amount = await page.locator("ul.pager li").count();

    const on = get_on_methods();

    on_pagination(
      {
        pages: pagination_amount,
        service,
        url_func: url_func,
        should_wait_network_idle: true,
      },
      async ({ logger, page, service, url }) => {
        logger.info(`Starting to scrape ${url}`);

        const listings = page
          .locator(".topStyle.row > *")
          .first()
          .locator(".row a[href]");

        const listing_count = await listings.count();

        for (let j = 0; j < listing_count; ++j) {
          const item = listings.nth(j);

          const link = await item.getAttribute("href");

          if (!link) {
            on.error({
              error: common_parsing_errors.no_href({
                html: await page.content(),
                url,
                where: service.id,
              }),
              service,
            });

            continue;
          }

          const href = resolve_url("https://www.leilostar.pt/", link);

          enqueue_links({
            link: href,
            service,
            handler: enqueue_leilostar,
          });
        }
      }
    );
  }
);

const enqueue_leilostar: EnqueueHandler = async ({ page, link, service }) => {
  const price_el = page.locator("div#div_oferta .boxProposta").first();
  const on = get_on_methods();

  if (!(await price_el.count())) {
    on.error({
      error: new ParsingErrorV1({
        html: await page.content(),
        message: "Price is no longer correct",
        url: link,
        where: service.id,
      }),
      service,
    });

    return;
  }

  const price = await price_el.locator("span.value").first().textContent();

  const title = await page
    .locator("h2")
    .textContent()
    .then((r) => r?.trim());

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

  let concelho: number | null = null;

  const concelho_section = page.locator(
    'div.c_row:has-text("Concelho") .value'
  );

  if (await concelho_section.count()) {
    const value = await concelho_section.textContent().then((r) => r?.trim());

    if (value) {
      const concelhos = get_concelhos();
      concelho = concelhos[value];
    }
  }

  on.property(
    {
      title,
      style_lookup_id: style,
      url: link,
      price,
      concelho_id: concelho,
    },
    service
  );
};
