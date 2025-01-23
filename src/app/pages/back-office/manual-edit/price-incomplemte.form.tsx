import { DbProperty } from "../../../../db/schema";

type PriceIncompleteProps = {
  properties: Array<DbProperty>;
};

export function PriceIncomplete(props: PriceIncompleteProps) {
  return (
    <div class="bg-white shadow-md rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">Price Insufficient Data</h2>
      <ul class="space-y-4">
        {props.properties.map((listing) => (
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
                <span class="mr-2">{listing.title}</span>
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
  );
}
