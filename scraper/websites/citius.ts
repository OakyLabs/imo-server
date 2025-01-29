import type { Page } from "playwright";
import { scrape_many } from "../config/wrapper";
import { get_on_methods } from "../config/local-storage";
import { ParsingErrorV1 } from "../events/errors/parsing-error";

const URLS = {
  processos_executivos:
    "https://www.citius.mj.pt/portal/consultas/ConsultasVenda.aspx",
};

export const scrape_citius = scrape_many(URLS, async (props) => {
  const { logger, single, page, service } = props;
  const on = get_on_methods();

  const [name, url] = single;

  logger.info(`About to start scraping citius:${name}`);

  await page.goto(url);

  await page.waitForLoadState("networkidle");

  const tribunais = await get_specific_select(page, /tribunais/gi);

  if (!tribunais) {
    on.error({
      service,
      error: new ParsingErrorV1({
        html: await page.content(),
        message: "No tribunais select anymore",
        url,
        where: service.id,
      }),
    });

    return;
  }

  const types = await get_specific_select(page, /tiposbem/gi);

  if (!types) {
    on.error({
      service,
      error: new ParsingErrorV1({
        html: await page.content(),
        message: "No types select anymore",
        url,
        where: service.id,
      }),
    });

    return;
  }

  // @ts-ignore
  const _options_of_types = types.locator("option");

  const imoveis = types.locator('option:has-text("Imóvel")');

  const value = await imoveis.getAttribute("value");

  if (!value) {
    return;
  }

  await types.selectOption(value);

  const input = page.locator(
    'div#divpesquisapubvendaconteudo input[type="text"]'
  );

  let wanted_input = null;

  for (let i = 0; i < (await input.count()); ++i) {
    const id = await input.nth(i).getAttribute("id");

    if (!id) {
      continue;
    }

    if (/ate/gi.test(id)) {
      wanted_input = input.nth(i);
    }
  }

  if (!wanted_input) {
    return;
  }

  await wanted_input.fill("12-12-2028");

  const all_options = tribunais.locator(':scope > option:not([value="0"])');

  // @ts-ignore
  const _all_options_count = await all_options.count();

  //   await wanted_input.press("Enter");

  for (let i = 0; i < 2; ++i) {
    //   for (let i = 0; i < all_options_count; ++i) {
    const option = all_options.nth(i);

    const value = await option.getAttribute("value");
    if (!value) {
      return;
    }

    const text = await option.textContent();

    if (!text) {
      return;
    }

    logger.info(`Doing ${text} tribunal`);

    await tribunais.selectOption(value);

    await tribunais.press("Enter");

    await page.waitForLoadState("networkidle");

    // const div = page.locator("#divpesquisapubvenda + div");

    // console.log(
    //   await div.count(),
    //   await div.getAttribute("id"),
    //   await div.locator(":scope > *").count()
    // );

    logger.info("Response");
    await page.waitForResponse(
      "https://www.citius.mj.pt/portal/consultas/ConsultasVenda.aspx"
    );

    // await page.waitForSelector();
    await page.waitForTimeout(150);

    // await page.waitForSelector('div#divresultadopubvenda div[align="center"]');

    // // await page.waitForLoadState("networkidle");
    // await page
    //   .locator(
    //     '#ctl00_ContentPlaceHolder1_AjaxLoadingAnimation_UpdateProgress[aria-hidden="false"]'
    //   )
    //   .waitFor();
    console.log(await page.locator(".resultadopubvenda").count());
    console.log((await page.$$(".resultadopubvenda")).length);

    // const span = await page
    //   .locator('div#divresultadopubvenda div[align="center"] span')
    //   .textContent();

    // console.log("span:", span);
    // await page.waitForTimeout(500);

    // const every = page.$$(".resultadopubvenda");

    // const count = (await every).length;

    // console.log({ count });
    // await new Promise(() => {});
  }
});

async function get_specific_select(page: Page, type: RegExp) {
  const selects = page.locator("select[id]");

  const selects_amount = await selects.count();

  for (let i = 0; i < selects_amount; ++i) {
    const item = selects.nth(i);
    const id = await item.getAttribute("id");

    if (!id) {
      return null;
    }

    const is_tribunais = type.test(id);

    if (is_tribunais) {
      return item;
    }
  }
  return null;
  _get_tribunais_select(page);
}

async function _get_tribunais_select(page: Page) {
  const selects = page.locator("select[id]");

  const selects_amount = await selects.count();

  for (let i = 0; i < selects_amount; ++i) {
    const item = selects.nth(i);
    const id = await item.getAttribute("id");

    if (!id) {
      return null;
    }

    const is_tribunais = /tribunais/gi.test(id);

    if (is_tribunais) {
      return item;
    }
  }
  return null;
}
