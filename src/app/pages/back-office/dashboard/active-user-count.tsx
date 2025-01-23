export function ActiveUsersCount(props: { count: number }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-2">Utilizadores activos</h2>
      <p className="text-4xl font-bold text-blue-600">{props.count}</p>
    </div>
  );
}
