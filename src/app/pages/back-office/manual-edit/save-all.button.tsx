export function SaveAllButton() {
  return (
    <button
      type="submit"
      class="text-white px-3 py-1 mt-2 rounded "
      x-bind:class="filled ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 cursor-not-allowed'"
      x-bind:disabled="!filled"
    >
      Gravar todos
    </button>
  );
}
