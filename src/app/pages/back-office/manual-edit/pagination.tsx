type IncompletePaginationProps = {
  curr_page: number;
  total_pages: number;
  sector: "price" | "municipality" | "style";
};

function Pag() {
  return (
    <div className="flex items-center space-x-2 text-sm">
      <button
        disabled={false}
        className="px-2 py-1 rounded bg-gray-200 text-gray-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
      >
        Prev
      </button>
      <span className="text-gray-600">1 / 3</span>
      <button
        disabled={false}
        className="px-2 py-1 rounded bg-gray-200 text-gray-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
}

export function Pagination(props: IncompletePaginationProps) {
  return (
    <div className="flex items-center space-x-2 text-sm">
      <button
        hx-get={`/back-office/manual/${props.sector}/${props.curr_page - 1}`}
        hx-target={`#${props.sector}_listing`}
        hx-swap="outerHTML"
        disabled={props.curr_page === 1}
        class="px-2 py-1 rounded bg-gray-200 text-gray-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      <span class="text-gray-700">
        Página {props.curr_page} de {props.total_pages}
      </span>

      <button
        hx-get={`/back-office/manual/${props.sector}/${props.curr_page + 1}`}
        hx-target={`#${props.sector}_listing`}
        hx-swap="outerHTML"
        disabled={props.curr_page === props.total_pages}
        class="px-2 py-1 rounded bg-gray-200 text-gray-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
}
