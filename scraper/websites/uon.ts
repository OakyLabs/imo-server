import { RealEstate } from "../../db/real-estate";
import { get_on_methods, get_concelhos } from "../config/local-storage";
import { scrape_main, EnqueueHandler } from "../config/wrapper";
import { resolve_url } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";
import { to_pascal_case } from "../lib/pascal";

const url =
  "https://www.leiloesimobiliarios.pt/Imobiliario.aspx?lang=PT#/listaCatalogo/?objcatalogoId=531346&pagina=1&ordenacao=0";

export const scrape_uon = scrape_main(async (props) => {
  const { enqueue_links, logger, page, service } = props;

  logger.info(`Starting to scrape uon`);

  await page.goto(url);

  await page.waitForLoadState("networkidle");

  const listings = page.locator(".BoxSlider_XL");

  const listings_amount = await listings.count();

  if (!listings_amount) {
    logger.info(`Skipping uon because it seems to be empty`);
    return;
  }

  for (let i = 0; i < listings_amount; ++i) {
    const item = listings.nth(i);

    const anchor = item.locator("a[href]").first();

    const href = await anchor.getAttribute("href");

    if (!href) {
      throw 1;
    }

    const link = resolve_url(
      "https://www.leiloesimobiliarios.pt/Imobiliario.aspx?lang=PT",
      href
    );

    enqueue_links({ link, service, handler: enqueue_uon }, true);
  }
});

const enqueue_uon: EnqueueHandler = async ({ link, page, service }) => {
  const title = page.locator(".HeaderList_TitleL");

  const text_content = await title.textContent().then((r) => r?.trim());

  if (!text_content) {
    throw 1;
  }

  const on = get_on_methods();
  const concelhos = get_concelhos();

  const concelho_div = page
    .locator('div.dd01:has-text("Concelho:") span')
    .last();

  const style_div = page.locator('div.dd01:has-text("Tipologia:") span').last();

  let concelho: number | null = null;

  if (await concelho_div.count()) {
    const concelho_text = to_pascal_case(
      await concelho_div.textContent().then((r) => r?.trim())
    );

    concelho = concelhos[concelho_text] ?? null;
  }

  let style: RealEstate | null = null;

  if (await style_div.count()) {
    const text_content = await style_div.textContent().then((r) => r?.trim());

    if (text_content) {
      style = parse_style(text_content);
    }
  }

  const price_location = page.locator("#ctl00_lblValorBase");

  let price: string | null = null;

  if (await price_location.count()) {
    price = (await page.locator("#ctl00_lblValorBase").count())
      ? await page
          .locator("#ctl00_lblValorBase")
          .textContent()
          .then((r) => r?.trim() ?? null)
      : null;
  }

  on.property(
    {
      title: text_content,
      url: link,
      concelho_id: concelho,
      price,
      style_lookup_id: style,
    },
    service
  );
};
