export function TotalCheckedItems(props: { count: number }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-2">
        Número total de leilões vistos
      </h2>
      <p className="text-4xl font-bold text-green-600">{props.count}</p>
      <p className="text-sm text-gray-600 mt-2">
        Leilões e ofertas processadas
      </p>
    </div>
  );
}
