import { Sectors } from "./incomplete.types";
import { Pagination } from "./pagination";

type IncompleteHeaderProps = {
  curr_page: number;
  total_pages: number;
  header_text: string;
  sector: Sectors;
};

export function IncompleteHeader(props: IncompleteHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold">{props.header_text}</h2>
      <Pagination
        curr_page={props.curr_page}
        total_pages={props.total_pages}
        sector={props.sector}
      />
    </div>
  );
}
