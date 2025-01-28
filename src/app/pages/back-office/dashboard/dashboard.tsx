import { type Service } from "../../../../db/schema";
import { ActiveUsersCount } from "./active-user-count";
import { ServiceForm } from "./service-form";
import { InsufficientDataCount } from "./insufficient-data";
import { SystemStatus } from "./system-status";
import { TotalCheckedItems } from "./total-checked-items";

export function Dashboard(props: {
  active_user_count: number;
  services: Array<Pick<Service, "name">>;
  insuficient_data_count: number;
  total_correct_count: number;
  up_services: number;
  down_services: number;
  total_services: number;
  last_changed: Date;
  is_on: boolean;
}) {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div class="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
          <Logout />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          <ActiveUsersCount count={props.active_user_count} />
          <TotalCheckedItems count={props.total_correct_count} />
          <InsufficientDataCount count={props.insuficient_data_count} />
          <SystemStatus last_changed={props.last_changed} is_on={props.is_on} />
          <ServiceForm
            services={props.services}
            down_services={props.down_services}
            up_services={props.up_services}
            total_services={props.total_services}
          />
        </div>
      </div>
    </div>
  );
}

function Logout() {
  return (
    <div class="relative group" x-data="{open: false}">
      <button
        x-on:click="open = !open"
        type="button"
        class="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
        id="options-menu"
        aria-haspopup="true"
        x-bind:aria-expanded="open"
      >
        Logout
        <svg
          class="-mr-1 ml-2 h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
      <div
        x-show="open"
        {...{ "@click.away": "open = false" }}
        class="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="options-menu"
      >
        <div class="py-1" role="none">
          <button
            hx-swap="none"
            hx-get="/back-office/logout"
            class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            role="menuitem"
          >
            Logout
          </button>
        </div>
        <div class="py-1" role="none">
          <button
            hx-swap="none"
            hx-get="/back-office/logout?all=true"
            class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            role="menuitem"
          >
            Logout from all devices
          </button>
        </div>
      </div>
    </div>
  );
}
