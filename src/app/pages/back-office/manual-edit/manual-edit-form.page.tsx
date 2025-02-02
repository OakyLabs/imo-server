import {
  DbDistrict,
  DbMunicipality,
  DbProperty,
  DbStyle,
} from "../../../../../db/schema";
import { Layout } from "../../../components/Layout";
import { MunicipalityIncomplete } from "./municipality";
import { PriceIncomplete } from "./price-incomplete.form";
import { StyleIncomplete } from "./style-incomplete.form";

type ManualEditProps = {
  price: {
    incomplete_properties: Array<DbProperty>;
    curr_page: number;
    total_pages: number;
  };

  style: {
    incomplete_properties: Array<DbProperty>;
    curr_page: number;
    total_pages: number;
    all_styles: Array<DbStyle>;
  };
  municipalities: {
    incomplete_properties: Array<DbProperty>;
    districts: Array<Pick<DbDistrict, "name">>;
    municipalities: Array<Pick<DbMunicipality, "name">>;
    curr_page: number;
    total_pages: number;
  };
};

export function ManualEdit(props: ManualEditProps) {
  return (
    <Layout>
      <div>
        <div class="py-12 h-full px-4 sm:px-6 lg:px8">
          <div class="max-w-7xl mx-auto" x-data>
            <h1 class="text-3xl font-bold text-gray-900 mb-8">
              Propriedades Incompletas
            </h1>

            {props.price.incomplete_properties.length ? (
              <PriceIncomplete {...props.price} />
            ) : null}

            {props.municipalities.incomplete_properties.length ? (
              <MunicipalityIncomplete {...props.municipalities} />
            ) : null}

            {props.style.incomplete_properties.length ? (
              <StyleIncomplete {...props.style} />
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
}
