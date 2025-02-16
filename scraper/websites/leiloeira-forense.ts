import { isBefore, parse } from "date-fns";
import { EnqueueHandler, scrape_many } from "../config/wrapper";
import { get_on_methods } from "../config/local-storage";
import {
  common_parsing_errors,
  ParsingErrorV1,
} from "../events/errors/parsing-error";
import { get_text, resolve_url } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";

const URLS = {
  presencial: "https://www.aleiloeiraforense.pt/?tipo=1",
  eletronico: "https://www.aleiloeiraforense.pt/?tipo=2",
  carta_fechada: "https://www.aleiloeiraforense.pt/?tipo=6",
  negociacao_particular: "https://www.aleiloeiraforense.pt/?tipo=5",
};

export const scrape_leiloeira_forense = scrape_many(
  URLS,
  async ({ enqueue_links, logger, page, service, single }) => {
    const on = get_on_methods();
    const [key, url] = single;

    await page.goto(url);

    logger.info(`Starting to scrape leiloeira_forense:${key}`);

    const posts = page.locator(".lista_vendas article");

    const posts_count = await posts.count();

    if (!posts_count) {
      return;
    }

    for (let i = 0; i < posts_count; ++i) {
      const item = posts.nth(i);
      const title = item.locator("h1.post_title");

      const anchor = title.locator(":scope > a[href]");

      if (!(await anchor.count())) {
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

      const href = await anchor.getAttribute("href");

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

      const link = resolve_url("https://www.aleiloeiraforense.pt/", href);

      const title_content = title.locator("span.titulo_venda");

      if (!(await title_content.count())) {
        on.error({
          service,
          error: common_parsing_errors.no_title({
            html: await page.content(),
            url,
            where: service.id,
          }),
        });

        return;
      }

      const title_content_text = await title_content
        .textContent()
        .then((r) => r?.trim());

      if (!title_content_text) {
        on.error({
          service,
          error: common_parsing_errors.no_title({
            html: await page.content(),
            url,
            where: service.id,
          }),
        });

        return;
      }

      const tipo_leilao = item.locator("p.tipo_leilao span");

      if (!tipo_leilao.count()) {
        return;
      }

      const date = await tipo_leilao
        .textContent()
        .then((r) => r?.trim().replace(/\s+/g, " "));

      if (!date) {
        on.error({
          service,
          error: new ParsingErrorV1({
            html: await page.content(),
            message: "No date in sight",
            url,
            where: service.id,
          }),
        });

        return;
      }

      const parsed_date = parse(date, "dd/MM/yyyy HH:mm", new Date());

      const time = parsed_date.getTime();

      if (Number.isNaN(time)) {
        on.error({
          service,
          error: new ParsingErrorV1({
            html: await page.content(),
            message: "Not a valid date :/",
            url,
            where: service.id,
          }),
        });

        return;
      }

      if (isBefore(parsed_date, new Date())) {
        logger.info(`Skipping auction because it has already ended`);
        continue;
      }

      //   console.log(
      //     parse(date?.replace(/\s+/g, " "), "dd/MM/yyyy HH:mm", new Date()),
      //     isDate(parse(date, "dd/mm/yyyy", new Date())),
      //     parse(date, "dd/mm/yyyy", new Date()).getTime()
      //   );

      enqueue_links({
        handler: enqueue_leiloeira_forense(title_content_text),
        link,
        service,
      });
    }
  },
);

const enqueue_leiloeira_forense =
  (title: string): EnqueueHandler =>
  async ({ link, page, service }) => {
    const on = get_on_methods();

    let price: string | null = null;
    const price_section = page.locator(
      'tr:has-text("Valor Minimo") + tr:has-text("€")',
    );

    const price_section_amount = await price_section.count();

    if (price_section_amount) {
      const price_amount = await price_section
        .textContent()
        .then((r) => r?.trim());

      price = price_amount ?? null;
    }

    const description = page.locator("p.texto_lote").first();

    const description_text = await get_text(description);

    on.property(
      {
        title,
        concelho_id: null,
        price,
        style_lookup_id: parse_style(title),
        url: link,
        description: description_text,
      },
      service,
    );
  };
