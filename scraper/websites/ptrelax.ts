import { get_on_methods } from "../config/local-storage";
import { scrape_many, EnqueueHandler } from "../config/wrapper";
import { common_parsing_errors } from "../events/errors/parsing-error";
import { get_text } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";

const URLS = {
  imoveis: (page = 1) =>
    `https://ptrelax.net/produto-categoria/leiloes/imoveis-casas-apartamento-moradia-lojas-terrenos/page/${page}`,
  negociacao_particular: (page = 1) =>
    `https://ptrelax.net/produto-categoria/todas-as-vendas/negociacao-particular/page/${page}/`,
};

export const scrape_pt_relax = scrape_many(URLS, async (p) => {
  const { enqueue_links, logger, on_pagination, page, service, single } = p;

  const [key, url_func] = single;

  const url = url_func();

  logger.info(`Starting to scrape ${key} of ptrelax`);
  await page.goto(url);

  await page.waitForLoadState("networkidle");

  const paginated_section = page.locator("ul.page-numbers");

  let page_nrs = 1;

  if (await paginated_section.count()) {
    page_nrs = (await paginated_section.locator(":scope > *").count()) - 1;
  }

  const on = get_on_methods();

  on_pagination(
    { pages: page_nrs, service, url_func, should_wait_network_idle: true },
    async (props) => {
      const { current_page, logger, page, service, url } = props;
      logger.info(`Paginated discovery of pt:relax ${key}:${current_page}`);

      const listing = page.locator("ul.products li.product");

      const listings_amount = await listing.count();

      for (let i = 0; i < listings_amount; ++i) {
        const item = listing.nth(i);

        const expired_selector = item.locator("span.expired");

        if (await expired_selector.count()) {
          continue;
        }

        const winning_selector = item.locator("span.winning_bid");

        if (await winning_selector.count()) {
          continue;
        }

        const link = item.locator("a[href]").first();

        const link_amount = await link.count();

        if (link_amount !== 1) {
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

        const href = await link.getAttribute("href");

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

        enqueue_links({ handler: enqueue_ptrelax, link: href, service });
      }
    },
  );
});

const enqueue_ptrelax: EnqueueHandler = async ({ link, page, service }) => {
  const title_el = page.locator("h1.product_title.entry-title").first();
  const on = get_on_methods();

  if (!(await title_el.count())) {
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

  const title = await get_text(title_el);

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

  const price_section = page.locator(".price bdi").first();

  let price: string | null = null;

  if (await price_section.count()) {
    price = await get_text(price_section);
  }

  const style = parse_style(title);

  on.property(
    { concelho_id: null, price, style_lookup_id: style, title, url: link },
    service,
  );
};
