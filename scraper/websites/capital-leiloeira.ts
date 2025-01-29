import { get_concelhos, get_on_methods } from "../config/local-storage";
import { EnqueueHandler, scrape_many } from "../config/wrapper";
import {
  common_parsing_errors,
  ParsingErrorV1,
} from "../events/errors/parsing-error";
import { resolve_url } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";

const URLS = {
  imoveis: (page = 1) =>
    `https://www.capital-leiloeira.pt/index.php?page=bem_list&order=&modalidade_venda=&natureza=IMOVEL&tipo_bem_id=&distritoId=&concelhoId=&freguesiaId=&greaterThan=&lowerThan=&freeSearch=&pn=${page}`,
  direitos: (page = 1) =>
    `https://www.capital-leiloeira.pt/index.php?page=bem_list&order=&modalidade_venda=&natureza=DIREITO&tipo_bem_id=&distritoId=&concelhoId=&freguesiaId=&greaterThan=&lowerThan=&freeSearch=&pn=${page}`,
};

export const scrape_capital_leiloeira = scrape_many(URLS, async (props) => {
  const { enqueue_links, logger, page, service, single, on_pagination } = props;
  const on = get_on_methods();
  const [key, url_func] = single;

  logger.info(`About to start scraping capital_leiloeira:${key}`);

  const url = url_func();

  await page.goto(url);
  await page.waitForLoadState("networkidle");

  const is_empty = await page.$(
    '.row p:has-text("foram encontrados resultados")'
  );

  if (is_empty) {
    logger.info(`Skipping ${url} because it seems to be empty`);

    return;
  }

  const last_page = await page.locator(".pager li").last().textContent();

  if (!last_page || Number.isNaN(+last_page)) {
    on.error({
      service,
      error: new ParsingErrorV1({
        html: await page.content(),
        url,
        where: service.id,
        message: "Pagination seems to be broken. Structure changed?",
      }),
    });

    return;
  }

  on_pagination(
    { should_wait_network_idle: true, pages: +last_page, service, url_func },
    async ({ current_page, logger, service, url, page }) => {
      logger.info(`Scraping page capital_leiloeira:${key}:${current_page}`);

      const list = await page.$$(".property_item");

      if (!list.length) {
        on.error({
          service,
          error: new ParsingErrorV1({
            html: await page.content(),
            url,
            where: service.id,
            message:
              "No individual cards, even though it does not say it is empty",
          }),
        });

        return;
      }

      for (const listing of list) {
        const image_component = await listing.$(".image");

        if (!image_component) {
          on.error({
            error: new ParsingErrorV1({
              html: await page.content(),
              message: "No image anymore",
              url,
              where: service.id,
            }),
            service,
          });

          return;
        }

        const text = await image_component.textContent();

        if (!text) {
          on.error({
            error: new ParsingErrorV1({
              html: await page.content(),
              message: "No image anymore",
              url,
              where: service.id,
            }),
            service,
          });

          return;
        }

        const is_not_sold = !/vendido/im.test(text);

        if (!is_not_sold) {
          continue;
        }

        const link = await listing
          .$("h3 a[href]")
          .then((r) => r?.getAttribute("href"));

        if (!link) {
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

        const target_url = resolve_url(
          "https://www.capital-leiloeira.pt/",
          link
        );

        enqueue_links({
          link: target_url,
          service,
          handler: enqueue_capital,
        });
      }
    }
  );
});

const enqueue_capital: EnqueueHandler = async ({
  link,
  logger,
  page,
  service,
}) => {
  const on = get_on_methods();
  await page.goto(link);

  await page.waitForLoadState("networkidle");

  const title = await page.locator(".container .row h2").first().textContent();

  if (!title) {
    on.error({
      error: new ParsingErrorV1({
        html: await page.content(),
        message: "No title available",
        url: link,
        where: service.id,
      }),
      service,
    });

    return;
  }

  const style = parse_style(title);

  let concelho: string | undefined | null;

  const location = await page.$('#property tr:has-text("Concelho")');

  if (!location) {
    logger.debug("Location is no longer available");
  } else {
    concelho = await location.$("td.text-right").then((r) => r?.textContent());
  }

  const price = await page
    .$('.boxProposta .row_p:has-text("Valor M")')
    .then((r) => r?.$(".value"))
    .then((r) => r?.textContent() ?? null);

  const concelhos = get_concelhos();
  const concelho_id = concelhos[concelho ?? ""] ?? null;

  on.property(
    {
      title,
      url: link,
      concelho_id,
      style_lookup_id: style,
      price,
    },
    service
  );
};
