import { type Service } from "../../../../db/schema";
import { ActiveUsersCount } from "./active-user-count";
import { ServiceForm } from "./service-form";
import { InsufficientDataCount } from "./insufficient-data";
import { SystemStatus } from "./system-status";
import { TotalCheckedItems } from "./total-checked-items";
import { BackOfficeLogout } from "./logout";

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
          <BackOfficeLogout />
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
