import { RealEstate } from "../../db/real-estate";

export function parse_style(str: string) {
  if (/T\d/i.test(str)) {
    return RealEstate.ApartamentoCasa;
  }

  if (/terrenos?/i.test(str)) {
    return RealEstate.ConstrucaoTerrenoRustico;
  }

  if (/moradias?/i.test(str)) {
    return RealEstate.Moradia;
  }

  if (/casa|apartamentos?|habita[cç][ãa]o|habita[çc][oõ]es/i.test(str)) {
    return RealEstate.ApartamentoCasa;
  }

  if (/armaz|estabelecimentos/i.test(str)) {
    return RealEstate.EstabelecimentoComercial;
  }

  if (/loja|industria|indústria|indus|pavilh/i.test(str)) {
    return RealEstate.EstabelecimentoComercial;
  }

  if (/fabri/i.test(str)) {
    return RealEstate.EstabelecimentoComercial;
  }

  if (
    /industrial|loja|industria|armazem|fábrica|fabrica|comercio|comércio|armaz[ée]ns|armaz[ée]m/i.test(
      str
    )
  ) {
    return RealEstate.EstabelecimentoComercial;
  }

  if (/pr[ée]dios?/i.test(str)) {
    return RealEstate.EdificioUrbano;
  }

  if (/(?=.*\quinhão\b)(?=.*\bhereditário\b)/i.test(str)) {
    return RealEstate.QuinhaoHereditario;
  }

  if (/quinh/i.test(str)) {
    return RealEstate.QuinhaoHereditario;
  }

  if (/r[úu]stico/i.test(str)) {
    return RealEstate.ConstrucaoTerrenoRustico;
  }

  if (/quinta/i.test(str)) {
    return RealEstate.QuintasHerdades;
  }

  if (/herança/i.test(str)) {
    return RealEstate.DireitoAHeranca;
  }

  if (/(?=.*\bdireito\b)(?=.*\bmeaç[ãa]o\b)/i.test(str)) {
    return RealEstate.DireitoAMeacao;
  }

  if (/r[úu]stico/gi.test(str)) {
    return RealEstate.ConstrucaoTerrenoRustico;
  }

  if (/fra[cç][aã]o auto[oó]noma/i.test(str)) {
    return RealEstate.DivisaoCoisaComum;
  }

  if (/garage[mn]s|aparcamento|estacionamentos??/i.test(str)) {
    return RealEstate.Garagem;
  }

  if (/restaurantes?/gi.test(str)) {
    return RealEstate.EstabelecimentoComercial;
  }

  if (/usufruto/i.test(str)) {
    return RealEstate.DireitoDeUsufruto;
  }

  return null;

  // if (/direitos?/i.test(str)) {
  //   return RealEstate.D
  // }
}
