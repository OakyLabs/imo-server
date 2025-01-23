import { Service } from "../../../../db/schema";

export function ServiceForm(props: {
  services: Array<Pick<Service, "name">>;
  up_services: number;
  down_services: number;
  total_services: number;
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Services</h2>
      <form
        className="space-y-4 mb-4"
        action="/back-office/new-service"
        method="post"
      >
        <div>
          <label
            htmlFor="serviceName"
            className="block text-sm font-medium text-gray-700"
          >
            Adicionar Novo Website
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
            placeholder="Nome do servico"
          />
        </div>

        <div>
          <label
            htmlFor="website"
            className="block text-sm font-medium text-gray-700"
          >
            URL
          </label>
          <input
            type="url"
            name="website"
            id="website"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
            placeholder="Link do website"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Novo Website
        </button>
      </form>
      <div className="mt-4">
        <h3 className="text-lg font-medium mb-2">Existing Services</h3>
        <ul className="list-disc pl-5 space-y-1">
          {props.services.map((service, index) => (
            <li key={index} className="text-sm text-gray-600">
              {service.name}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4" />
      <div className="mt-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Websites</span>
          <span className="text-sm fopnt-bold">{props.total_services}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-green-600">
            Serviços Online
          </span>
          <span className="text-sm font-bold text-green-600">
            {props.up_services}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-red-600">
            Serviços Offline
          </span>
          <span className="text-sm font-bold text-red-600">
            {props.down_services}
          </span>
        </div>
      </div>
      <a
        href="/back-office/manage-services"
        className="mt-4 inline-block text-blue-600 hover:text-blue-800"
      >
        Gerir Websites
      </a>
    </div>
  );
}
