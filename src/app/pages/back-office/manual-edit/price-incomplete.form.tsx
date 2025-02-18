import { DbProperty } from "../../../../../db/schema";
import { IncompleteHeader } from "./incomplete-header";
import { DiscardButton } from "./open-modal";
import { SaveAllButton } from "./save-all.button";

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
      <IncompleteHeader
        header_text="Preço em falta"
        sector="price"
        curr_page={props.curr_page}
        total_pages={props.total_pages}
      />
      <div x-data="{filled: false}">
        <form x-on:input="filled = [...$el.querySelectorAll('input')].some(s => s.value)">
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
                    class="inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <span class="mr-2 overflow-hidden ">{listing.title}</span>
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
                  <SaveButton id={listing.id} />
                  <DiscardButton listing_id={listing.id} target="price" />
                </form>
              </li>
            ))}
          </ul>
        </form>

        <SaveAllButton />
      </div>
    </div>
  );
}

function SaveButton(props: { id: number }) {
  return (
    <button
      type="button"
      hx-post={`/back-office/save/price/${props.id}`}
      class="text-white px-3 py-1 mt-2 rounded bg-green-500 hover:bg-green-600"
      hx-target="#price_listing"
      hx-swap="outerHTML"
      {...{
        "hx-on::after-request":
          "if (!event.detail.xhr.responseText.trim()) document.querySelector('#price_listing').innerHTML = '';",
      }}
    >
      Guardar
    </button>
  );
}
