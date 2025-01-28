import { DbProperty, DbStyle } from "../../../../../db/schema";
import { Pagination } from "./pagination";

type StyleIncompleteProps = {
  all_styles: Array<DbStyle>;
  incomplete_properties: Array<DbProperty>;
  curr_page: number;
  total_pages: number;
};

export function StyleIncomplete(props: StyleIncompleteProps) {
  return (
    <div
      class="bg-white shadow-md rounded-lg p-6 mb-8 max-w-7xl"
      id="style_listing"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Classificação de Propriedade</h2>
        <Pagination {...props} sector="style" />
      </div>
      <div>
        <ul className="space-y-4">
          {props.incomplete_properties.map((listing) => (
            <li
              key={listing.id}
              className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4"
            >
              <div className="flex-grow">
                <a
                  href={listing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  <span class="mr-2">{listing.title}</span>
                  {/*<ExternalLink class="w-4 h-4" /> */}
                </a>
              </div>
              <form
                class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4"
                method="post"
                action={`/back-office/save/style/${listing.id}`}
              >
                <select className="border rounded px-2 py-1" name="style">
                  <option value="">Selectionar Estilo de Propriedade</option>
                  {props.all_styles.map((type) => (
                    <option key={type} value={type.id}>
                      {type.name}
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
