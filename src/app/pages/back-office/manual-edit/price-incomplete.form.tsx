import { DbProperty } from "../../../../../db/schema";
import { Pagination } from "./pagination";

type PriceIncompleteProps = {
  incomplete_properties: Array<DbProperty>;
  curr_page: number;
  total_pages: number;
};

export function PriceIncomplete(props: PriceIncompleteProps) {
  return (
    <div
      class="bg-white shadow-md rounded-lg p-6 mb-8 max-w-7xl"
      id="price_listing"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Price Insufficient Data</h2>
        <Pagination {...props} sector="price" />
      </div>
      <div>
        <ul class="space-y-4">
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
                  class="inline-flex items-center text-blue-600 hover:text-blue-800 max-w-7 mr-2 overflow-hidden truncate"
                >
                  <span class="mr-2 overflow-hidden truncate lg:max-w-md max-w-7">
                    {listing.title}
                  </span>
                  {/*<ExternalLink class="w-4 h-4" /> */}
                </a>
              </div>
              <form
                class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4"
                method="post"
                action={`/back-office/save/price/${listing.id}`}
              >
                <input
                  type="text"
                  value="Não listado"
                  name="price"
                  class="border rounded px-2 py-1 w-32"
                />
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
