import { ElementHandle } from "playwright";
import { get_concelhos, get_on_methods } from "../config/local-storage";
import { scrape_main } from "../config/wrapper";
import {
  common_parsing_errors,
  ParsingErrorV1,
} from "../events/errors/parsing-error";
import { parse_style } from "../lib/parse-style";
import { get_text, resolve_url } from "../lib/helpers";

const url =
  "https://www.caixaimobiliario.pt/comprar/imoveis-venda.jsp?op=comprar&pgnr=1&ofs=0&rsnr=&pgsz=-1&listing=resumo&ordby=preco_desc&dc=0&tptpl=0&pcmax=0&pcmin=-1&f=0&armin=0";

export const scrape_caixa = scrape_main(async ({ logger, page, service }) => {
  logger.info(`Starting to scrape caixa`);
  await page.goto(url);
  const on = get_on_methods();
  const concelhos = get_concelhos();

  const central_$ = await page.$$("div#central > div[id]");

  for (const item of central_$) {
    const section = await item.$(".result_imovel_txt");

    if (!section) {
      on.error({
        service,
        error: new ParsingErrorV1({
          html: await page.content(),
          message: "House section is no longer correct",
          url,
          where: service.id,
        }),
      });

      return;
    }

    const evaled = await section.evaluate((elements) => {
      for (const child of Array.from(elements.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          if (child.textContent?.trim()) {
            return child.textContent
              .trim()
              .split("|")
              .map((e) => e.trim());
          }
        }
      }
    });

    if (!evaled) {
      on.error({
        service,
        error: new ParsingErrorV1({
          html: await page.content(),
          message: "location is no longer correct",
          url,
          where: service.id,
        }),
      });

      return;
    }

    const [distrito, concelho] = evaled;

    if (!distrito.trim() || !concelho.trim()) {
      on.error({
        service,
        error: new ParsingErrorV1({
          html: await page.content(),
          message: "Location section is no longer correct",
          url,
          where: service.id,
        }),
      });

      return;
    }

    const estranheiro_regex = /estrangeiro/i;

    if (estranheiro_regex.test(distrito) || estranheiro_regex.test(concelho)) {
      logger.info(`Skipping this item because it is not in Portugal`);

      continue;
    }

    const link_el = await section.$("a[href]");

    if (!link_el) {
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

    const link = await link_el.getAttribute("href");

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

    // For some reason, the url has several search params that might impact where the ad was and it creates a new property even though no property ad had been actually created
    const new_url = new URL(
      resolve_url("https://www.caixaimobiliario.pt/", link),
    );

    const keys_to_delete: Array<string> = [];
    new_url.searchParams.forEach((_, key) => {
      if (key !== "id") {
        keys_to_delete.push(key);
      }
    });

    keys_to_delete.forEach((key) => new_url.searchParams.delete(key));

    const price = await section
      .$("b")
      .then((r) => r?.textContent())
      .then((r) => r?.trim() ?? null);

    const title = await get_text(link_el);

    if (!title) {
      on.error({
        service,
        error: common_parsing_errors.no_title({
          html: await page.content(),
          url: link,
          where: service.id,
        }),
      });

      continue;
    }

    const style = parse_style(title);

    const concelho_id = concelhos[concelho] ?? null;

    on.property(
      {
        title,
        url: new_url.toString(),
        concelho_id,
        price,
        style_lookup_id: style,
      },
      service,
    );
  }
});

// const enqueue_caixa =
//   ({
//     concelho,
//     distrito,
//     price,
//   }: {
//     concelho: string;
//     distrito: string;
//     price: string | undefined;
//   }): EnqueueHandler =>
//   async ({ link, logger, page, service }) => {
//     const title = await page
//       .locator("div.tab_id_descricao h1")
//       .textContent()
//       .then((r) => {
//         return r
//           ?.split("|")
//           .map((e) => e.trim())
//           .at(0);
//       });

//     const on = get_on_methods();

//     if (!title) {
//       on.error({
//         service,
//         error: common_parsing_errors.no_title({
//           html: await page.content(),
//           url: link,
//           where: service.id,
//         }),
//       });

//       return;
//     }

//     const style = parse_style(title);

//     on.property(
//       { title, url: link, concelho, distrito, price, style_lookup_id: style },
//       service
//     );
//   };
