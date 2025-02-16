import { get_concelhos, get_on_methods } from "../config/local-storage";
import { EnqueueHandler, scrape_main } from "../config/wrapper";
import {
  common_parsing_errors,
  ParsingErrorV1,
} from "../events/errors/parsing-error";
import { get_text, resolve_url } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";

export const scrape_aijm = scrape_main(
  async ({ logger, page, service, enqueue_links }) => {
    const on = get_on_methods();
    await page.goto("https://www.aijm.pt/bens.aspx");

    await page.waitForSelector("#CPH_Body_UP_Natureza");

    await page.click("#CPH_Body_UP_Natureza select");

    await page
      .locator("#CPH_Body_UP_Natureza select")
      .first()
      .selectOption("IMOVEL");

    await page.click("#CPH_Body_BT_Pesquisar");

    await page.waitForLoadState("networkidle");

    const pagination_regex = /[^0-9]+/;
    const pagination_section = "#CPH_Body_Paginacao_Numeracao";

    const pagination_el = await page.$(pagination_section);

    const pagination_text = (await pagination_el?.textContent())?.trim()!;

    const pages = pagination_text.split(pagination_regex).filter(Boolean);

    const last_page_el = pages.at(-1);

    const last_page = +last_page_el!;

    for (let i = 1; i <= last_page; ++i) {
      // for (let i = 1; i <= last_page; ++i) {
      logger.info(`Page: ${i} of aijm`);
      const elements = await page.$$(".PG_Bem");

      for (const el of elements) {
        const link_el = await el.$("a[href]");

        if (!link_el) {
          on.error({
            error: common_parsing_errors.no_href({
              html: await page.content(),
              url: "https://www.aijm.pt/bens.aspx",
              where: service.id,
              more_info: JSON.stringify({ page: i }),
            }),
            service,
          });

          continue;
        }

        const link = await link_el.getAttribute("href");

        if (!link) {
          on.error({
            error: common_parsing_errors.no_href({
              html: await page.content(),
              url: "https://www.aijm.pt/bens.aspx",
              where: service.id,
              more_info: JSON.stringify({ page: i }),
            }),
            service,
          });

          continue;
        }

        const title_el = await el.$(".PG_BemTextosDescricao");

        if (!title_el) {
          on.error({
            service,
            error: new ParsingErrorV1({
              html: await page.content(),
              message: "No Title element found, probably scraping changes",
              url: "https://www.aijm.pt/bens.aspx",
              where: service.id,
              more_info: JSON.stringify({ page: i }),
            }),
          });

          continue;
        }

        const title_text = await title_el.textContent();

        if (!title_text) {
          on.error({
            service,
            error: new ParsingErrorV1({
              html: await page.content(),
              message: "No Title element found, probably scraping changes",
              url: "https://www.aijm.pt/bens.aspx",
              where: service.id,
              more_info: JSON.stringify({ page: i }),
            }),
          });

          continue;
        }

        const title = title_text.trim();

        const href = resolve_url("https://www.aijm.pt/", link);

        enqueue_links({
          link: href,
          service,
          handler: enqueue_aijm(title),
        });
      }

      if (i !== last_page) {
        await page.locator(".BT_Paginacao_Seguinte").click();

        await page.waitForLoadState("networkidle");
      }
    }
  },
);

const enqueue_aijm =
  (title: string): EnqueueHandler =>
  async ({ link, page, service }) => {
    const on = get_on_methods();
    const concelhos = get_concelhos();

    const base_locator = await page.$(
      'section.well1 .row p:has-text("Concelho:")',
    );
    const text = await base_locator?.textContent();

    const concelho = text?.split(":").at(1)?.trim();

    const typo = await page.$('h3:has-text("Espécie")');
    const typo_text = await typo?.textContent();
    const description = typo_text?.split(":").at(1)?.trim();

    let style = parse_style(title);

    if (style == undefined) {
      style = parse_style(description ?? "");
    }

    const price_el = await page
      .$('.well1 h3:has-text("Valor M")')
      .then((r) => r?.textContent());

    let price = "Não listado";
    if (price_el) {
      const regex = /Valor Mínimo:\s*([\d\s,]+[€]?)$/;

      // Extract matches
      const match1 = price_el.match(regex);

      if (match1) {
        price = match1[1];
      }
    }

    const description_section = page.locator("div[data-wow-delay] p");

    let description_text: string | null = "";

    const count = await description_section.count();

    for (let i = 0; i < count; i++) {
      const str = "\n" + ((await get_text(description_section.nth(i))) ?? "");
      description_text += str;
    }

    const concelho_id = concelhos[concelho ?? ""] ?? null;

    on.property(
      {
        title,
        url: link,
        concelho_id,
        style_lookup_id: style,
        price,
        description: description_text,
      },
      service,
    );
  };
