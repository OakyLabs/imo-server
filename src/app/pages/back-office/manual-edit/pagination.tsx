import { Child, PropsWithChildren } from "hono/jsx";
import { Sectors } from "./incomplete.types";

type IncompletePaginationProps = {
  curr_page: number;
  total_pages: number;
  sector: Sectors;
};

export function Pagination(props: IncompletePaginationProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-center items-center sm:space-x-2 text-sm">
      <PaginationButton
        sector={props.sector}
        disabled={props.curr_page === 1}
        url={`/back-office/manual/${props.sector}/${props.curr_page - 1}`}
      >
        Anterior
      </PaginationButton>
      <span class="text-gray-700">
        Página {props.curr_page} de {props.total_pages}
      </span>

      <PaginationButton
        url={`/back-office/manual/${props.sector}/${props.curr_page + 1}`}
        sector={props.sector}
        disabled={props.curr_page === props.total_pages}
      >
        Próxima
      </PaginationButton>
    </div>
  );
}

type PaginationButtonProps = {
  sector: Sectors;
  url: string;
  children: Child;
  disabled: boolean;
};

function PaginationButton(props: PaginationButtonProps) {
  return (
    <button
      hx-get={props.url}
      hx-target={`#${props.sector}_listing`}
      hx-swap="outerHTML"
      disabled={props.disabled}
      class="px-2 py-1 rounded bg-gray-200 text-gray-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed w-full sm:w-auto"
    >
      {props.children}
    </button>
  );
}
