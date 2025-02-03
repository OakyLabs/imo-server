import { DbProperty } from "../../../../../db/schema";
import { Sectors } from "./incomplete.types";

type OpenModalProps = { listing_id: DbProperty["id"]; target: Sectors };

const open_modal_operation = `is_modal_open = true; title = 'Descartar anúncio?';`;

const styles = {
  div: "mt-5 flex justify-center gap-4 w-full mx-auto",
  no: "bg-red-400 rounded-md py-1 px-2 text-gray-100 min-w-20",
  yes: "bg-green-500 py-1 px-2 rounded-md min-w-20 text-gray-100",
};

export function open_modal({ listing_id, target }: OpenModalProps) {
  return `${open_modal_operation} bottom = '<div class="${styles.div}" x-init="$nextTick(() => {htmx.process($el)})"><button type="button" hx-delete="/back-office/manual/discard/location/${listing_id}" @htmx:after-request="close_modal()" hx-swap="outerHTML" hx-target="#${target}" class="${styles.yes}">Sim</button><button class="${styles.no}" x-on:click="is_modal_open = false;">Cancelar</button></div>'`;
}

export function DiscardButton(props: OpenModalProps) {
  return (
    // https://github.com/alpinejs/alpine/discussions/4069 explanation about htmx:after-request
    <button type="button" x-on:click={open_modal(props)}>
      Descartar
    </button>
  );
}
