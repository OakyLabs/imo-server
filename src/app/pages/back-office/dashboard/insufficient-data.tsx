export function InsufficientDataCount(props: { count: number }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-gray-800">
          Lista de propriedades incompletas
        </h2>
        <div class="bg-yellow-100 rounded-full p-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 text-yellow-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              k
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
      </div>

      <p className="text-4xl fontbold text-yellow-600 mb2">{props.count}</p>

      <p className="text-sm text-gray-600 mb-4">
        Estas propriedades requerem ação manual
      </p>

      <a
        href="/back-office/manual"
        class="inline-block bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600 transition duration-300 ease-in-out"
      >
        Ver propriedades
      </a>
    </div>
  );
}
