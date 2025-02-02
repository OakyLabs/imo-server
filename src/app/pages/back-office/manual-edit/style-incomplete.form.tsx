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
      <div x-data="{filled: false}">
        <form
          hx-post="/back-office/save/stuff"
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
                  className="border rounded px-2 py-1"
                  name={`style-${listing.id}`}
                >
                  <option value="">Selectionar Estilo de Propriedade</option>
                  {props.all_styles.map((type) => (
                    <option key={type} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                <button
                  // https://github.com/alpinejs/alpine/discussions/4069 explanation about htmx:after-request
                  type="button"
                  x-on:click={`is_modal_open=true; title = 'Descartar anúncio?'; bottom= '<div class="mt-5 flex justify-center gap-4 w-full mx-auto" x-init="$nextTick(() => {htmx.process($el)})"><button type="button" hx-post="/back-office/manual/discard/${listing.id}" @htmx:after-request="close_modal()" hx-swap="outerHTML" hx-target="#style_listing" class="bg-green-500 py-1 px-2 rounded-md min-w-20 text-gray-100">Sim</button><button class="bg-red-400 rounded-md py-1 px-2 text-gray-100 min-w-20" x-on:click="is_modal_open = false;">Cancelar</button></div>'`}
                >
                  Descartar
                </button>
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
