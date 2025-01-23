export function InsufficientDataCount(props: { count: number }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-2">
        Lista de propriedades incompletas
      </h2>

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
