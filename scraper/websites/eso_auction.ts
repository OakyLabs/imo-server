import { get_on_methods } from "../config/local-storage";
import { EnqueueHandler, scrape_main } from "../config/wrapper";
import { parse_style } from "../lib/parse-style";

const URL = (page = 1) =>
  `https://www.esoauction.pt/produtos/lista/p/${page}/v/e/o/t,a/c/imovel`;

export const scrape_eso_auction = scrape_main(async (props) => {
  const { enqueue_links, logger, on_pagination, page, service } = props;

  logger.info(`Starting eso_auction`);

  const url = URL();

  await page.goto(url);

  await page.waitForLoadState("networkidle");

  const page_section = page.locator(".search-results-header strong").first();

  const page_section_count = await page_section.count();

  if (!page_section_count) {
    // TODO
    return;
  }
  const pages_str = await page_section.textContent().then((r) => r?.trim());

  if (!pages_str) {
    // TODO
    return;
  }

  const page_numbers = pages_str.match(/\d+/g);

  if (!page_numbers) {
    // TODO
    return;
  }

  if (page_numbers.length !== 2) {
    // todo
    return;
  }

  const [, target_page] = page_numbers;

  const target_page_nr = Number(target_page);

  on_pagination(
    {
      pages: target_page_nr,
      service,
      url_func: URL,
      should_wait_network_idle: true,
    },
    async ({ logger, page, service }) => {
      const options = page.locator("table.lista-produtos tbody tr");

      for (let i = 0; i < (await options.count()); ++i) {
        const item = options.nth(i);

        const anchor = item.locator(".price a[href]");

        if (!(await anchor.count())) {
          // TODO
          logger.error("Oh no");
          return;
        }

        const href = await anchor.getAttribute("href");

        if (!href) {
          logger.error("OH NO");
          return;
        }

        enqueue_links({
          link: href,
          service,
          handler: enqueue_eso_auction,
        });
      }
    }
  );
});

const enqueue_eso_auction: EnqueueHandler = async ({ link, page, service }) => {
  const on = get_on_methods();
  const current_price = page.locator("span.currentBid");

  const current_price_amount = await current_price.count();

  if (!current_price_amount) {
    // TODO
    return;
  }

  const price = await current_price.textContent();

  const title = page.locator("h1");

  const title_count = await title.count();

  if (title_count !== 1) {
    // TODO
    return;
  }

  const title_text = await title.textContent();

  if (!title_text) {
    return;
  }

  const type = page.locator('tr:has-text("Tipo") td').first();

  const style =
    parse_style(title_text ?? "") ??
    parse_style((await type.textContent().then((r) => r?.trim())) ?? "");

  on.property(
    {
      concelho_id: null,
      price,
      title: title_text,
      style_lookup_id: style,
      url: link,
    },
    service
  );
};
