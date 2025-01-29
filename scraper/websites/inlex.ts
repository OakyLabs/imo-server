import { get_concelhos, get_on_methods } from "../config/local-storage";
import { EnqueueHandler, scrape_many } from "../config/wrapper";
import {
  common_parsing_errors,
  ParsingErrorV1,
} from "../events/errors/parsing-error";
import { resolve_url } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";

const urls = {
  imoveis: "https://www.inlexleiloeira.pt/tipo_verbas/1/Imoveis",
  direitos: "https://www.inlexleiloeira.pt/tipo_verbas/4/Direitos",
};

export const scrape_inlex = scrape_many(
  urls,
  async ({ single, page, enqueue_links, service, logger }) => {
    const [key, url] = single;
    const on = get_on_methods();
    const concelhos = get_concelhos();

    logger.info(`About to start scraping ${key} of inlex`);
    await page.goto(url);

    const locator = await page
      .locator(".row .col-md-12")
      .first()
      .locator('p:has-text("encontrada")')
      .count();

    if (locator) {
      logger.info(`Skipping ${key} because it seems to be empty`);

      return;
    }

    const estate_list = await page.$$(".project-single");

    if (!estate_list.length) {
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

    for (const item of estate_list) {
      const link = await item
        .$("a.homes-img")
        .then((r) => r?.getAttribute("href"));

      if (!link) {
        on.error({
          service,
          error: common_parsing_errors.no_href({
            html: await page.content(),
            url,
            where: service.id,
            more_info: JSON.stringify({ link }),
          }),
        });

        continue;
      }

      const href = resolve_url("https://www.inlexleiloeira.pt", link);

      const location = await item
        .$(".homes-address span")
        .then((r) => r?.textContent());

      if (!location) {
        logger.debug(
          "Known issue in inlex where some properties don't have location...",
          {
            url,
            message: "No location in the current property",
          }
        );

        continue;
      }

      const location_trimmed = location.trim().split(",").at(1);

      if (!location_trimmed) {
        on.error({
          service,
          error: new ParsingErrorV1({
            html: await page.content(),
            message: "No location anymore in page",
            url,
            where: service.id,
          }),
        });

        continue;
      }

      const concelho = concelhos[location_trimmed.trim()] ?? null;

      enqueue_links({
        handler: enqueue_inlex(concelho),
        link: href,
        service,
      });

      //   console.log("location_trimmed:", location_trimmed);
    }
  }
);

const enqueue_inlex =
  (concelho: number | null): EnqueueHandler =>
  async ({ link, page, service }) => {
    const on = get_on_methods();
    const title = await page
      .$(".featured h2")
      .then((r) => r?.textContent())
      .then((r) => r?.trim());

    if (!title) {
      on.error({
        service,
        error: new ParsingErrorV1({
          html: await page.content(),
          message: "No title in this page anymore",
          url: link,
          where: service.id,
        }),
      });

      return;
    }

    const style = parse_style(title);

    on.property(
      {
        title,
        url: link,
        concelho_id: concelho,
        style_lookup_id: style,
        price: null,
      },
      service
    );
  };
