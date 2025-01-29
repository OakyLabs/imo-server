import type { Locator, Page } from "playwright";
import type { Service } from "../../db/schema";
import { scrape_main } from "../config/wrapper";
import { get_concelhos, get_on_methods } from "../config/local-storage";
import { ParsingErrorV1 } from "../events/errors/parsing-error";
import { RealEstate } from "../../db/real-estate";
import { parse_style } from "../lib/parse-style";

const url =
  "https://e-leiloes.pt/eventos?layout=grid&first=0&sort=dataFimAsc&tipo=1";

export const scrape_e_leiloes = scrape_main(async (props) => {
  const { page, logger, service, on_api } = props;
  const on = get_on_methods();
  const concelhos = get_concelhos();

  logger.info("Starting e_leiloes");

  await page.goto(url);

  await page.waitForLoadState("networkidle");

  const result = await deal_with_formacao(page, url, service);

  if (!result) {
    logger.error(`Something is wrong with e-leiloes.`);

    return;
  }

  let paginator_btn = get_paginator_btn(page);

  for (;;) {
    await page.waitForSelector(".p-evento");

    const events = page.locator(".p-evento");

    const events_count = await events.count();

    for (let i = 0; i < events_count; ++i) {
      // for (let i = 0; i < 1; ++i) {
      const item = events.nth(i);

      const span = item.locator("i.pi.pi-tag + span");

      const span_count = await span.count();

      if (!span_count) {
        logger.debug(`Skipping because there seems to be no reference`);
        continue;
      }

      const text = await span.textContent();

      if (!text) {
        on.error({
          error: new ParsingErrorV1({
            html: await page.content(),
            url: page.url(),
            message: "Reference not found",
            where: service.id,
          }),
          service,
        });

        return;
      }

      on_api(
        { service, url: `https://e-leiloes.pt/api/Eventos/${text.trim()}` },
        (data) => {
          const body = data as Root;

          const item = body.item;

          let style: RealEstate | null = null;

          for (const option of [item.titulo, item.subtipo, item.descricao]) {
            const style_val = parse_style(option);

            if (style_val != null) {
              style = style_val;
              break;
            }
          }

          on.property(
            {
              title: body.item.titulo,
              price: String(body.item.valorMinimo),
              url: `https://e-leiloes.pt/evento/${text.trim()}`,
              style_lookup_id: style,
              concelho_id: concelhos[item.moradaConcelho] ?? null,
            },
            service
          );
        }
      );
    }

    if (await is_paginator_btn_disabled(paginator_btn)) {
      break;
    }

    await paginator_btn.click();
    await page.waitForLoadState("networkidle");
    paginator_btn = get_paginator_btn(page);
  }
});

const get_paginator_btn = (page: Page) => {
  const btn_locator = page.locator(".p-paginator-next");
  // const btn_locator = page.locator(".p-paginator-prev");

  return btn_locator;
};

const is_paginator_btn_disabled = async (el: Locator) => {
  const attribute = await el.isDisabled();

  return attribute;
};

async function deal_with_formacao(page: Page, url: string, service: Service) {
  const on = get_on_methods();
  try {
    const locator = page.locator(".p-dialog-mask");

    const locator_count = await locator.count();

    if (!locator_count) {
      return;
    }

    const close_btn = locator.locator("button");

    const btn_amount = await close_btn.count();

    if (!btn_amount) {
      on.error({
        error: new ParsingErrorV1({
          html: await page.content(),
          message: "Btn to close is no longer there",
          url,
          where: service.id,
        }),
        service,
      });

      return false;
    }

    await close_btn.click();

    await page.waitForLoadState("networkidle");

    return true;
  } catch {
    return true;
  }
}

export interface Root {
  item: Item;
  messages: boolean;
  messagesList: any[];
  errors: boolean;
  errorsList: any[];
  exception: boolean;
}

export interface Item {
  id: number;
  origem: number;
  lanceAtual: number;
  lanceAtualId: number;
  dataInicio: string;
  dataFimInicial: string;
  dataFim: string;
  cancelado: boolean;
  modalidadeId: number;
  referencia: string;
  tipoId: number;
  subtipoId: number;
  tipologiaId: number;
  capa: string;
  titulo: string;
  valorBase: number;
  valorAbertura: number;
  valorMinimo: number;
  tipo: string;
  subtipo: string;
  tipologia: string;
  descricao: string;
  observacoes: string;
  areaUtilPrivativa: number;
  areaUtilDependente: number;
  areaTotal: number;
  morada: string;
  moradaNumero: string;
  moradaAndar: string;
  moradaDistrito: string;
  moradaConcelho: string;
  moradaFreguesia: string;
  moradaCP: string;
  coordenadasLAT: string;
  coordenadasLON: string;
  ivaCobrar: boolean;
  ivaPercentagem: number;
  processoId: number;
  processoNumero: string;
  processoComarca: string;
  processoComarcaCodigo: string;
  processoTribunal: string;
  verbaId: number;
  osae360: string;
  matricula: string;
  executados: string;
  cerimoniaId: number;
  cerimoniaData: string;
  cerimoniaLocal: string;
  cerimoniaMorada: string;
  gestorId: number;
  gestorTipo: string;
  gestorTipoId: number;
  gestorCedula: string;
  gestorNome: string;
  gestorEmail: string;
  gestorComarca: string;
  gestorTribunal: string;
  gestorTelefone: string;
  gestorFax: string;
  gestorMorada: string;
  gestorHorario: string;
  dataServidor: string;
  dataAtualizacao: string;
  iniciado: boolean;
  terminado: boolean;
  ultimos5m: boolean;
  fotos: Foto[];
  onus: any[];
  descPredial: DescPredial[];
  visitas: any[];
  anexos: any[];
  favorito: boolean;
  licitado: boolean;
  primeiraProposta: boolean;
  informacaoMinima: boolean;
}

export interface Foto {
  legenda: string;
  image: string;
  thumbnail: string;
}

export interface DescPredial {
  id: number;
  numero: string;
  fracao: string;
  distritoDesc: string;
  concelhoDesc: string;
  freguesiaDesc: string;
  artigos: any[];
}
