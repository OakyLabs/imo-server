import { DbProperty, DbStyle } from "../../../../../db/schema";
import { IncompleteHeader } from "./incomplete-header";
import { DiscardButton } from "./open-modal";

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
      <IncompleteHeader
        header_text="Classificação de Propriedade"
        sector="style"
        curr_page={props.curr_page}
        total_pages={props.total_pages}
      />
      <div x-data="{filled: false}">
        <form
          hx-post="/back-office/save/style"
          hx-target="#style_listing"
          hx-swap="outerHTML"
          x-on:input="filled = [...$el.querySelectorAll('select')].some(s => s.value)"
        >
          <ul className="space-y-4">
            {props.incomplete_properties.map((listing) => (
              <li
                key={listing.id}
                class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4"
              >
                <div className="flex-grow">
                  <a
                    href={listing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <span class="mr-2">{listing.title}</span>
                  </a>
                </div>
                <select
                  className="border rounded px-2 py-1 "
                  name={`style-${listing.id}`}
                >
                  <option value="">Selectionar Estilo de Propriedade</option>
                  {props.all_styles.map((type) => (
                    <option key={type} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                <DiscardButton target="style" listing_id={listing.id} />
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
