export function SystemStatus(props: { is_on: boolean; last_changed: Date }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div class="flex justify-between items-center mb-4">
        <h2 class={`text-xl font-semibold $`}>System Status</h2>
        <div
          class={`${props.is_on ? "bg-orange-100" : "bg-green-100"} rounded-full p-3`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class={`h-6 w-6 ${props.is_on ? "text-orange-800" : "text-gray-800"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
            />
          </svg>
        </div>
      </div>
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
