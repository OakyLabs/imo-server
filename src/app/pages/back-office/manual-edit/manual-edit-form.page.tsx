import {
  DbDistrict,
  DbMunicipality,
  DbProperty,
  DbStyle,
} from "../../../../db/schema";
import { Layout } from "../../../components/Layout";
import { MunicipalityIncomplete } from "./municipality-incomplete.form";
import { PriceIncomplete } from "./price-incomplemte.form";
import { StyleIncomplete } from "./style-incomplete.form";

type ManualEditProps = {
  price_incomplete: Array<DbProperty>;
  municipality_incomplete: Array<DbProperty>;
  municipalities: Array<Pick<DbMunicipality, "name">>;
  districts: Array<DbDistrict>;
  style_incomplete: Array<DbProperty>;
  all_styles: Array<DbStyle>;
};

export function ManualEdit(props: ManualEditProps) {
  return (
    <Layout>
      <div class="py-12 h-full px-4 sm:px-6 lg:px8">
        <div class="max-w-7xl mx-auto" x-data>
          <h1 class="text-3xl font-bold text-gray-900 mb-8">
            Propriedades Incompletas
          </h1>

          {props.price_incomplete.length ? (
            <PriceIncomplete properties={props.price_incomplete} />
          ) : null}

          {props.municipalities.length ? (
            <MunicipalityIncomplete
              municipalities={props.municipalities}
              properties={props.municipality_incomplete}
              districts={props.districts}
            />
          ) : null}

          {props.style_incomplete.length ? (
            <StyleIncomplete
              all_styles={props.all_styles}
              properties={props.style_incomplete}
            />
          ) : null}
        </div>
      </div>
    </Layout>
  );
}
