import { DbProperty, DbStyle } from "../../../../db/schema";

type StyleIncompleteProps = {
  properties: Array<DbProperty>;
  all_styles: Array<DbStyle>;
};

export function StyleIncomplete(props: StyleIncompleteProps) {
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">
        Classificação de Propriedade
      </h2>
      <ul className="space-y-4">
        {props.properties.map((listing) => (
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
  );
}
