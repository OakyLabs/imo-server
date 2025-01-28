import pino from "pino";
import { create_db } from "../db/index";
import distritos_e_concelhos from "../output.json";
import {
  style_lookup_table,
  Service,
  service_table,
  cache_table,
  districts_table,
  concelhos_table,
} from "../db/schema";
import { parse_env } from "../src/env";
import { logger } from "../src/logger";
// const client = new PrismaClient();

const env = parse_env(process.env);

const db = create_db(env);

const categories = [
  "apartamento/casa",
  "moradia",
  "edificio/predio/predio_urbano",
  "estabelecimento_comercial/industrial",
  "garagem",
  "construcao/terreno/predio_rustico",
  "quinhao_hereditario",
  "divisao_coisa_comum",
  "direito_a_meacao",
  "quintas/herdades",
  "arrumos/arrecadacoes",
  "direitos_a_heranca",
  "direito_de_usufruto",
  // "direitos",
];

logger.info(`Starting`);

logger.debug(`Adding style lookup table`);
await db
  .insert(style_lookup_table)
  .values(categories.map((e) => ({ name: e })))
  .onConflictDoNothing();

const links_and_urls: Array<
  Omit<Service, "id" | "use" | "is_premium" | "created_at" | "updated_at"> & {
    use?: boolean;
  }
> = [
  {
    link: "https://www.aijm.pt/bens.aspx",
    name: "aijm",
  },
  {
    link: "https://www.avaliberica.pt/results-page.php?page=1&search%5BcategorySells%5D%5B6%5D=on&search%5BpartnerCountries%5D%5BPortugal%5D=on",
    name: "avaliberica",
    use: false,
  },
  {
    link: "https://www.capital-leiloeira.pt/index.php?page=bem_list&order=&modalidade_venda=&natureza=IMOVEL&tipo_bem_id=&distritoId=&concelhoId=&freguesiaId=&greaterThan=&lowerThan=&freeSearch=&pn=1",
    name: "capital_leiloeira",
  },
  {
    name: "c_paraiso",
    link: "https://cparaiso.pt/lots?cat=realestate",
    use: false,
  },
  {
    name: "imoloriente",
    link: "https://www.imoloriente.pt/categoria-produto/imoveis/",
  },
  {
    name: "inlex",
    link: "https://www.inlexleiloeira.pt/tipo_verbas/1/Imoveis",
  },
  {
    name: "justa_venda",
    link: "https://www.justavenda.pt/vendas/?tipo=imovel",
  },
  {
    name: "leilosoc",
    link: "https://leilosoc.com/pt-PT/category/5-imoveis/?page=1",
  },
  {
    name: "leilon",
    link: "https://www.leilon.pt/pt/auction/search?category=13&page=1",
  },
  {
    name: "leiloport",
    link: "https://leiloport.pt/carteira/page/1?tipo=cartafechada&categoria=imoveis",
  },
  {
    name: "leilovalor",
    link: "https://www.leilovalor.com/index.php?page=bem_list&order=&modalidade_venda=leilao_presencial&natureza=IMOVEL&tipo_bem_id=&distritoId=&concelhoId=&freguesiaId=&greaterThan=&lowerThan=&freeSearch=",
  },
  {
    name: "leiloversatil",
    link: "https://leiloversatil.pt/?chkimoveis=I&q=",
  },
  {
    name: "lexleiloes",
    link: "https://lexleiloes.com/vendas-em-curso/vendas-judiciais-de-imoveis/",
  },
  {
    name: "logica_directa",
    link: "https://www.logicadirecta.com/imoveis?Tipo+de+Bem+=Im%25C3%25B3veis",
  },
  {
    name: "maximo_valor",
    link: "https://www.maximovalor.pt/leiloes-presenciais/1?titulo=&categoria=2&distrito=&concelho=&freguesia=",
  },

  {
    name: "onefix",
    link: "https://www.onefix-leiloeiros.pt/tipo_verbas/1/Imoveis",
  },
  {
    name: "venda_judicial",
    link: "https://vendajudicial.pt/bens-imoveis/",
  },
  {
    name: "vias_e_rumos",
    link: "https://www.viaserumos.pt/pt/filtrar/1/Tipo%20de%20bens",
    use: false,
  },
  {
    name: "vleiloes",
    link: "https://www.vleiloes.com/?chkimoveis=I&q=&selectdistrito=0",
  },
  {
    name: "leilosil",
    link: "https://www.leilosil.pt/pt/",
    use: false,
  },
  {
    name: "exclusivo_agora",
    link: "https://www.exclusivagora.com/index.php",
    use: true,
  },
  {
    name: "lismed",
    link: "https://www.lismed.com/",
    use: true,
  },
  {
    name: "leilostar",
    link: "https://www.leilostar.pt/index.php?page=bem_list&order=&modalidade_venda=&natureza=IMOVEL&tipo_bem_id=&distritoId=&concelhoId=&freguesiaId=&greaterThan=&lowerThan=&freeSearch=",
    use: true,
  },
  {
    name: "leiloatrium",
    link: "https://leiloatrium.pt/?_sft_tipo_de_bem=imovel",
    use: true,
  },
  {
    name: "santander",
    link: "https://imoveis.santander.pt/imoveis/1/0/-1/-1/-1/-1/-1/-1/-1/-1/-1/-1/-/-1/-1/-",
  },
  {
    name: "caixa",
    link: "https://www.caixaimobiliario.pt/comprar/imoveis-venda.jsp?op=comprar&pgnr=1&ofs=0&rsnr=&pgsz=-1&listing=resumo&ordby=preco_desc&dc=0&tptpl=0&pcmax=0&pcmin=-1&f=0&armin=0",
  },
  {
    name: "millenium",
    link: "https://ind.millenniumbcp.pt/pt/Particulares/viver/Imoveis/Pages/imoveis.aspx#/Search.aspx?buf=1",
  },
  {
    name: "montepio",
    link: "https://imoveismontepio.pt/Comprar/",
  },
  {
    name: "credito_agricola",
    link: "https://www.caimoveis.pt/Comprar/?pn=1",
  },
  {
    name: "estamo",
    link: "https://www.estamo.pt/category/emvenda/",
  },
  {
    name: "uon",
    link: "https://www.leiloesimobiliarios.pt/Imobiliario.aspx?lang=PT#/listaCatalogo/?objcatalogoId=531346&pagina=1&ordenacao=0",
  },
  {
    name: "euro_estates",
    link: "https://www.euroestates.pt/realestate/search",
  },
  {
    name: "eleiloes",
    link: "https://e-leiloes.pt/eventos?layout=grid&first=0&sort=dataFimAsc&tipo=1",
  },
  {
    name: "citius",
    link: "https://www.citius.mj.pt/portal/consultas/ConsultasVenda.aspx",
    use: false,
  },
  {
    name: "eso_auction",
    link: "https://www.esoauction.pt/produtos/lista/p/1/v/e/o/t,a/c/imovel",
  },
  {
    name: "homeflex",
    link: "https://www.homeflex.pt/imoveis?natureza=8&imovel=&distrito=&concelho=&freguesia=&preco-min=&preco-max=&tipologia-min=T0&tipologia-max=T6+ou+Superior&referencia=&submit-search=&page=1",
  },
  // TODO: investigate still
  // {
  //   name: "domus_legis",
  //   link: "https://www.domuslegis.pt/",
  // },
  // {
  //   name: "avilei",
  //   link: "https://www.avilei.com/portfolio/",
  // },
  {
    name: "duomaquete",
    link: "https://duomaquete.com/leiloes/",
  },
  {
    name: "a4a",
    link: "https://www.a4a.pt/pt/auction/list/v/c/t/1",
  },
  {
    name: "leiloeira_forense",
    link: "https://www.aleiloeiraforense.pt/",
  },
  {
    name: "hipoges",
    link: "https://realestate.hipoges.com/pt",
  },
  {
    name: "lemos",
    link: "https://www.lemosadvalorem.pt/index.php?page=bem_list&order=&modalidade_venda=&natureza=IMOVEL&tipo_bem_id=&distritoId=&concelhoId=&freguesiaId=&greaterThan=&lowerThan=&freeSearch=",
  },
  { name: "nleiloes", link: "https://www.nleiloes.pt/?chkimoveis=I&q=" },
  {
    name: "ptrelax",
    link: "https://ptrelax.net/produto-categoria/leiloes/imoveis-casas-apartamento-moradia-lojas-terrenos/",
  },
  {
    name: "easydigest",
    link: "https://www.easygest.com.pt/imoveis/destaque?lbl=1",
  },
  {
    name: "vamgo",
    link: "https://www.vamgo.pt/?cat=1&q=",
  },
  {
    name: "vjn",
    link: "https://www.vjn.pt/?chkimoveis=I&q=",
  },
  {
    name: "imook",
    link: "https://www.imook.pt/imoveis",
  },
  {
    name: "agroleiloes",
    link: "http://www.agroleiloes.net/index.php/negociacao-particular/terrenos",
    use: false,
  },
  {
    name: "solventium",
    link: "https://www.solventium.pt/?chkimoveis=I&q=",
    use: false,
  },
  {
    name: "lena",
    link: "https://www.leiloeiradolena.com/leiloes",
  },
];

logger.debug(`Adding services`);
await db.insert(service_table).values(links_and_urls).onConflictDoNothing();

logger.debug(`Adding to cache table`);
await db
  .insert(cache_table)
  .values({ key: "in_use", value: "false" })
  .onConflictDoNothing();

logger.debug(`Adding distritos e concelhos`);
await db.transaction(async (tx) => {
  for (const district of distritos_e_concelhos) {
    const created_districts = await tx
      .insert(districts_table)
      .values({ name: district.distrito })
      .onConflictDoNothing()
      .returning({ id: districts_table.id });

    if (created_districts.length) {
      const [{ id }] = created_districts;

      for (const concelho of district.municipios) {
        await tx
          .insert(concelhos_table)
          .values({ distrito_id: id, name: concelho })
          .onConflictDoNothing();
      }
    }
  }
});
