import { get_concelhos, get_on_methods } from "../config/local-storage";
import { EnqueueHandler, scrape_main } from "../config/wrapper";
import {
  common_parsing_errors,
  ParsingErrorV1,
} from "../events/errors/parsing-error";
import { resolve_url } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";

const url =
  "https://www.lemosadvalorem.pt/index.php?page=bem_list&order=&modalidade_venda=&natureza=IMOVEL&tipo_bem_id=&distritoId=&concelhoId=&freguesiaId=&greaterThan=&lowerThan=&freeSearch=";

export const scrape_lemos = scrape_main(async (props) => {
  props.logger.info(`Starting to scrape lemos ad valorem`);
  const on = get_on_methods();

  await props.page.goto(url);
  await props.page.waitForLoadState("networkidle");

  const list = props.page.locator("div.topStyle > div a:not(li > a)");

  const list_amount = await list.count();

  if (!list_amount) {
    props.logger.info(`Skipping lemos ad valorem because it seems to be empty`);
    return;
  }

  for (let i = 0; i < list_amount; ++i) {
    const item = list.nth(i);

    const anchor = await item.getAttribute("href");

    if (!anchor) {
      on.error({
        service: props.service,
        error: common_parsing_errors.no_href({
          html: await props.page.content(),
          url,
          where: props.service.id,
        }),
      });

      return;
    }

    const link = resolve_url("https://www.lemosadvalorem.pt/", anchor);

    const title = item.locator("h3");

    if (!(await title.count())) {
      on.error({
        service: props.service,
        error: common_parsing_errors.no_title({
          html: await props.page.content(),
          url,
          where: props.service.id,
        }),
      });

      return;
    }

    const title_text = await title.textContent().then((e) => e?.trim());

    if (!title_text) {
      on.error({
        service: props.service,
        error: common_parsing_errors.no_title({
          html: await props.page.content(),
          url,
          where: props.service.id,
        }),
      });

      return;
    }

    props.enqueue_links(
      {
        link,
        service: props.service,
        handler: enqueue_lemos({
          title: title_text,
        }),
      },
      true
    );
  }
});

const enqueue_lemos =
  (high_props: { title: string }): EnqueueHandler =>
  async (props) => {
    const concelho_section = props.page.locator(
      'div.c_row:has(div.item:has-text("Concelho")) div.value'
    );
    const on = get_on_methods();

    const concelho_count = await concelho_section.count();

    if (concelho_count !== 1) {
      on.error({
        service: props.service,
        error: new ParsingErrorV1({
          html: await props.page.content(),
          url: props.link,
          message: "Concelho not in the right spot anymore",
          where: props.service.id,
        }),
      });

      return;
    }

    const concelho_text = await concelho_section
      .textContent()
      .then((r) => r?.trim());

    if (!concelho_text) {
      on.error({
        service: props.service,
        error: new ParsingErrorV1({
          html: await props.page.content(),
          url: props.link,
          message: "Concelho not in the right spot anymore",
          where: props.service.id,
        }),
      });

      return;
    }
    const concelhos = get_concelhos();

    const concelho = concelhos[concelho_text] ?? null;

    const price_section = props.page.locator(
      'div.row_p:has(span.title:has-text("Valor M")) span.value'
    );

    const price_amount = await price_section.count();

    let price = !price_amount ? "Não listado" : null;

    if (price_amount === 1) {
      price =
        (await price_section.textContent().then((r) => r?.trim())) ?? null;
    }

    const style = parse_style(high_props.title);

    on.property(
      {
        concelho_id: concelho,
        price,
        style_lookup_id: style,
        title: high_props.title,
        url: props.link,
      },
      props.service
    );

    // console.log(await price.count());
  };
