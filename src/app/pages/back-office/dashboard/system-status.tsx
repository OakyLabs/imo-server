export function SystemStatus(props: { is_on: boolean; last_changed: Date }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">System Status</h2>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium">Current Status:</span>
        <span
          className={`text-sm font-bold ${props.is_on ? "text-green-600" : "text-red-600"}`}
        >
          {props.is_on ? "A correr" : "Stand by"}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Last Changed:</span>
        <span className="text-sm font-bold">
          {props.last_changed.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
