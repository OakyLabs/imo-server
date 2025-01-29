import { ScrapeFunc } from "./config/wrapper";
import { scrape_a4a } from "./websites/a4a";
import { scrape_agro_leiloes } from "./websites/agroleiloes";
import { scrape_aijm } from "./websites/aijm";
import { scrape_millenium } from "./websites/bcp";
import { scrape_cparaiso } from "./websites/c_paraiso";
import { scrape_caixa } from "./websites/caixa";
import { scrape_capital_leiloeira } from "./websites/capital-leiloeira";
import { scrape_citius } from "./websites/citius";
import { scrape_credito_agricola } from "./websites/credito-agricola";
import { scrape_duomaquete } from "./websites/duomaquete";
import { scrape_e_leiloes } from "./websites/e-leiloes";
import { scrape_easygest } from "./websites/easygest";
import { scrape_eso_auction } from "./websites/eso_auction";
import { scrape_estamo } from "./websites/estamo";
import { scrape_euro_estates } from "./websites/euroestates";
import { scrape_exclusivo_agora } from "./websites/exclusivo-agora";
import { scrape_hipoges } from "./websites/hipoges";
import { scrape_homeflex } from "./websites/homeflex";
import { scrape_imoloriente } from "./websites/imoloriente";
import { scrape_imook } from "./websites/imook";
import { scrape_inlex } from "./websites/inlex";
import { scrape_justa_venda } from "./websites/justa-venda";
import { scrape_leilosoc } from "./websites/leilo-soc";
import { scrape_leiloatrium } from "./websites/leiloatrium";
import { scrape_leiloeira_forense } from "./websites/leiloeira-forense";
import { scrape_leilon } from "./websites/leilon";
import { scrape_leiloport } from "./websites/leiloport";
import { scrape_leilostar } from "./websites/leilostar";
import { scrape_leilo_valor } from "./websites/leilovalor";
import { scrape_leilo_versatil } from "./websites/leiloversatil";
import { scrape_lemos } from "./websites/lemos";
import { scrape_leiloeira_do_lena } from "./websites/lena";
import { scrape_lex_leiloes } from "./websites/lex_leiloes";
import { scrape_lismed } from "./websites/lismed";
import { scrape_montepio } from "./websites/montepio";
import { scrape_one_fix } from "./websites/onefix-leiloeiros";
import { scrape_pt_relax } from "./websites/ptrelax";
import { scrape_santander } from "./websites/santander";
import { scrape_solventium } from "./websites/solventium";
import { scrape_uon } from "./websites/uon";
import { scrape_vamgo } from "./websites/vamgo";
import { scrape_venda_judicial } from "./websites/venda-judicial";
import { scrape_vjn } from "./websites/vjn";
import { scrape_v_leiloes } from "./websites/vleiloes";

export const SCRAPERS: Record<string, ScrapeFunc> = {
  aijm: scrape_aijm,
  // avaliberica: scrape_aval,
  c_paraiso: scrape_cparaiso,
  capital_leiloeira: scrape_capital_leiloeira,
  imoloriente: scrape_imoloriente,
  inlex: scrape_inlex,
  justa_venda: scrape_justa_venda,
  leilosoc: scrape_leilosoc,
  leilon: scrape_leilon,
  leiloport: scrape_leiloport,
  leilovalor: scrape_leilo_valor,
  leiloversatil: scrape_leilo_versatil,
  lexleiloes: scrape_lex_leiloes,
  onefix: scrape_one_fix,
  venda_judicial: scrape_venda_judicial,
  // vias_e_rumos: scrape_vias_e_rumos,
  vleiloes: scrape_v_leiloes,
  lismed: scrape_lismed,
  leilostar: scrape_leilostar,
  leiloatrium: scrape_leiloatrium,
  santander: scrape_santander,
  caixa: scrape_caixa,
  millenium: scrape_millenium,
  exclusivo_agora: scrape_exclusivo_agora,
  montepio: scrape_montepio,
  credito_agricola: scrape_credito_agricola,
  estamo: scrape_estamo,
  uon: scrape_uon,
  euro_estates: scrape_euro_estates,
  eleiloes: scrape_e_leiloes,
  // TODO: Not yet done
  citius: scrape_citius,
  eso_auction: scrape_eso_auction,
  homeflex: scrape_homeflex,
  duomaquete: scrape_duomaquete,
  // TODO: Ongoing
  a4a: scrape_a4a,
  leiloeira_forense: scrape_leiloeira_forense,
  hipoges: scrape_hipoges,
  lemos: scrape_lemos,
  ptrelax: scrape_pt_relax,
  easygest: scrape_easygest,
  // TODO
  solventium: scrape_solventium,
  vamgo: scrape_vamgo,
  vjn: scrape_vjn,
  imook: scrape_imook,
  // TODO: still ongoing
  agroleiloes: scrape_agro_leiloes,
  // TODO ONGOING
  lena: scrape_leiloeira_do_lena,
};
