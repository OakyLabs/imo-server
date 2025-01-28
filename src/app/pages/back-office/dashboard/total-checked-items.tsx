export function TotalCheckedItems(props: { count: number }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-gray-800">
          Número total de leilões vistos
        </h2>
        <div class="bg-green-100 rounded-full p-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        </div>
      </div>

      <p className="text-4xl font-bold text-green-600">{props.count}</p>
      <p className="text-sm text-gray-600 mt-2">
        Leilões e ofertas processadas
      </p>
    </div>
  );
}
