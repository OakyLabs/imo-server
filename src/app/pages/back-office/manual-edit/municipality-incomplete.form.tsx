import { DbProperty, DbDistrict, DbMunicipality } from "../../../../db/schema";
import { Pagination } from "./pagination";

type MunicipalityIncompleteProps = {
  incomplete_properties: Array<DbProperty>;
  districts: Array<Pick<DbDistrict, "name">>;
  municipalities: Array<Pick<DbMunicipality, "name">>;
  curr_page: number;
  total_pages: number;
};

export function MunicipalityIncomplete(props: MunicipalityIncompleteProps) {
  return (
    <div
      class="bg-white shadow-md rounded-lg p-6 mb-8 max-w-7xl"
      id="municipality_listing"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Localização da Properiedade</h2>
        <Pagination {...props} sector="municipality" />
      </div>
      <div>
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
                  <span class="mr-2 overflow-hidden truncate max-w-sm">
                    {listing.title}
                  </span>
                  {/*<ExternalLink class="w-4 h-4" /> */}
                </a>
              </div>
              <form
                class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4"
                method="post"
                action={`/back-office/save/location/${listing.id}`}
              >
                <select
                  class="border rounded px-2 py-1"
                  name="district"
                  hx-get="/back-office/municipalities"
                  hx-trigger="change"
                  hx-target={`#municipalities-${encodeURIComponent(listing.id)}`}
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
                  class="border rounded px-2 py-1"
                  id={`municipalities-${encodeURIComponent(listing.id)}`}
                  required
                  name="municipality"
                >
                  <option selected disabled value="">
                    Select Municipality
                  </option>
                  {props.municipalities.map((municipality) => (
                    <option key={municipality.name} value={municipality.name}>
                      {municipality.name}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                >
                  Gravar
                </button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
