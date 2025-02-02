import {
  DbProperty,
  DbDistrict,
  DbMunicipality,
} from "../../../../../db/schema";
import { IncompleteHeader } from "./incomplete-header";

type MunicipalityIncompleteProps = {
  incomplete_properties: Array<DbProperty>;
  districts: Array<Pick<DbDistrict, "name">>;
  municipalities: Array<Pick<DbMunicipality, "name" | "id">>;
  curr_page: number;
  total_pages: number;
};

export function MunicipalityIncomplete(props: MunicipalityIncompleteProps) {
  return (
    <div
      class="bg-white shadow-md rounded-lg p-6 mb-8 max-w-7xl"
      id="municipality_listing"
    >
      <IncompleteHeader
        sector="municipality"
        curr_page={props.curr_page}
        total_pages={props.total_pages}
        header_text="Localização da Proppriedade"
      />
      <div x-data="{filled: false}">
        <form
          hx-post="/back-office/save/municipality"
          hx-target="#municipality_listing"
          hx-swap="outerHTML"
          onsubmit={
            "document.querySelectorAll('select[name=district]').forEach(e  => e.disabled = true)"
          }
          {...{
            "@htmx:after-request":
              "document.querySelectorAll('select[name=district]').forEach(e  => e.disabled = false)",
          }}
          x-on:input="filled = [...$el.querySelectorAll('select.municipality-select')].some(s => s.value)"
        >
          <ul className="space-y-4">
            {props.incomplete_properties.map((listing) => (
              <li
                key={listing.url}
                class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4"
              >
                <div class="flex-grow">
                  <a
                    href={listing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <span class="mr-2 overflow-hidden ">{listing.title}</span>
                    {/*<ExternalLink class="w-4 h-4" /> */}
                  </a>
                </div>
                <select
                  class="border rounded px-2 py-1"
                  name="district"
                  hx-get="/back-office/municipalities"
                  hx-trigger="change"
                  hx-target={`#municipalities-${encodeURIComponent(
                    listing.id,
                  )}`}
                  hx-swap="innerHTML"
                >
                  <option value="">Select District</option>
                  {props.districts.map((district) => (
                    <option key={district.name} value={district.name}>
                      {district.name}
                    </option>
                  ))}
                </select>

                <select
                  class="border rounded px-2 py-1 municipality-select sm:w-40 text-ellipsis"
                  id={`municipalities-${encodeURIComponent(listing.id)}`}
                  name={`municipality-${listing.id}`}
                >
                  <option selected disabled value="">
                    Select Municipality
                  </option>
                  {props.municipalities.map((municipality) => (
                    <option key={municipality.name} value={municipality.id}>
                      {municipality.name}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
          <button
            type="submit"
            class="text-white px-3 py-1 mt-2 rounded "
            x-bind:class="filled ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 cursor-not-allowed'"
            x-bind:disabled="!filled"
          >
            Gravar todos
          </button>
        </form>
      </div>
    </div>
  );
}
