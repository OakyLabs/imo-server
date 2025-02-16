import { get_concelhos, get_on_methods } from "../config/local-storage";
import { EnqueueHandler, scrape_main } from "../config/wrapper";
import { common_parsing_errors } from "../events/errors/parsing-error";
import { get_text, resolve_url } from "../lib/helpers";
import { parse_style } from "../lib/parse-style";

const url = "https://duomaquete.com/leiloes/";

export const scrape_duomaquete = scrape_main(async (props) => {
  const on = get_on_methods();
  const concelhos = get_concelhos();
  await props.page.goto(url);

  const list = props.page.locator(".destaque-box-wrapper");

  const list_count = await list.count();

  for (let i = 0; i < list_count; ++i) {
    const item = list.nth(i);

    const anchor = item.locator("a[href]").first();

    const anchor_amount = await anchor.count();

    if (!anchor_amount) {
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

    const href = await anchor.getAttribute("href");

    if (!href) {
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

    const title_wrapper = item.locator(".overlay-title-wrapper");

    let concelho: number | null = null;

    const title_wrapper_amount = await title_wrapper.count();

    if (title_wrapper_amount) {
      const concelho_el = title_wrapper.locator("b");

      const concelho_el_amount = await title_wrapper.count();

      if (concelho_el_amount) {
        const text = await concelho_el.textContent().then((r) => r?.trim());

        if (text) {
          concelho = concelhos[text] ?? null;
        }
      }
    }

    let price: string | null = null;

    const price_section = item.locator(".overlay-price-wrapper");

    const price_section_amount = await price_section.count();

    if (price_section_amount) {
      price =
        (await price_section.textContent().then((r) => r?.trim())) ?? null;
    }

    props.enqueue_links({
      link: resolve_url(url, href),
      handler: enqueue_duomaquete(concelho, price),
      service: props.service,
    });
  }
});

const enqueue_duomaquete =
  (concelho: number | null, price: string | null): EnqueueHandler =>
  async (props) => {
    const title = await props.page.title();

    const on = get_on_methods();

    const style = parse_style(title);

    const description = props.page
      .locator(".imovel-details .imovel-details2 p")
      .first();

    const description_text = await get_text(description);

    on.property(
      {
        concelho_id: concelho,
        price,
        style_lookup_id: style,
        title,
        url: props.link,
        description: description_text,
      },
      props.service,
    );
  };
