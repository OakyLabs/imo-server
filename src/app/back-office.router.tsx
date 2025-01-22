import { Hono } from "hono";
import { AppBindings } from "../types";
import { Layout } from "./components/Layout";
import { genSalt, hash } from "bcryptjs";
import { z } from "zod";
import { validator } from "hono/validator";
import { Service, service_table } from "../db/schema";
import { createMiddleware } from "hono/factory";
import { create_db } from "../db";
import { count, eq, isNull, or } from "drizzle-orm";
import { off } from "process";
import { on } from "events";
import { only } from "node:test";

const salt_rounds = 10;

const back_office_router = new Hono<AppBindings>();

type BackOfficeProps = {
  error: {
    email?: Array<string> | undefined;
    password?: Array<string> | undefined;
  };
};

function BackOfficeLogin(props: BackOfficeProps) {
  console.log(props);
  return (
    <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Entra na conta administrativa
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px04 shadow sm:rounded-lg sm:px-10">
          <form action="/back-office/login" method="post" class="space-y-6">
            <div>
              <label
                for="email"
                class="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  name="email"
                  autocomplete={"email"}
                  required
                  class={`appearance-none block w-full px-3 py-2 border ${
                    props.error.email ? "border-red-300" : "border-gray-300"
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />

                {props.error.email?.length ? (
                  <p className="mt-2 text-sm text-red-600" id="email-error">
                    {props.error.email}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <label
                for="password"
                class={"block text-sm font-medium text-gray-700"}
              >
                Password
              </label>

              <div className="mt-1 relative">
                <input
                  type="password"
                  name="password"
                  autocomplete={"current-password"}
                  required
                  id="password"
                  className={`appearance-none block w-full px-3 py-2 border ${
                    props.error.password ? "border-red-300" : "border-gray-300"
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
                {props.error.password?.length ? (
                  <p className="mt-2 text-sm text-red-600" id="email-error">
                    {props.error.password}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Log in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

back_office_router.get("/", async (c) => {
  const session = c.get("session");

  const session_id = session.get("session_id");

  if (!session_id) {
    return c.redirect("/back-office/login");
  }

  return c.html(
    <Layout>
      <h1>Hello</h1>
    </Layout>,
  );
});

back_office_router.get("/login", async (c) => {
  return c.html(
    <Layout>
      <BackOfficeLogin error={{ email: undefined, password: undefined }} />
    </Layout>,
  );
});

back_office_router.post(
  "/login",
  validator("form", (value, c) => {
    const parsed = z
      .object({
        email: z.string().email(),
        password: z.string().min(8),
      })
      .safeParse(value);

    if (!parsed.success) {
      return c.html(
        <Layout>
          <BackOfficeLogin error={parsed.error.flatten().fieldErrors} />
        </Layout>,
      );
    }

    return parsed.data;
  }),
  async (c) => {
    const body = c.req.valid("form");

    const salt = await genSalt(salt_rounds);

    const hashed_password = await hash(body.password, salt);

    const session = c.get("session");

    session.set("session_id", hashed_password);

    return c.redirect("/back-office/dashboard");
  },
);

const admin_logged_in_mw = createMiddleware(async (c, next) => {
  const session = c.get("session");

  const session_id = session.get("session_id");

  if (!session_id) {
    return c.redirect("/");
  }

  return next();
});

back_office_router.get("/dashboard", admin_logged_in_mw, async (c) => {
  const db = create_db(c.env);

  const [offline, online, services] = await Promise.all([
    db
      .select({ count: count() })
      .from(service_table)
      .where(eq(service_table.use, false)),

    db
      .select({ count: count() })
      .from(service_table)
      .where(eq(service_table.use, true)),
    db
      .select({ name: service_table.name })
      .from(service_table)
      .limit(3)
      .where(eq(service_table.use, true)),
  ]);

  console.log({ offline, online });

  const up_services = online[0].count;
  const down_services = offline[0].count;

  return c.html(
    <Layout>
      <Dashboard
        insuficient_data_count={1}
        services={services}
        active_user_count={5}
        total_correct_count={0}
        total_services={up_services + down_services}
        up_services={up_services}
        down_services={down_services}
      />
    </Layout>,
  );
});

function ActiveUsersCount(props: { count: number }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-2">Utilizadores activos</h2>
      <p className="text-4xl font-bold text-blue-600">{props.count}</p>
    </div>
  );
}

function InsufficientDataCount(props: { count: number }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font0-semibold mb-2">
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

function ServiceForm(props: {
  services: Array<Pick<Service, "name">>;
  up_services: number;
  down_services: number;
  total_services: number;
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Services</h2>
      <form className="space-y-4 mb-4">
        <div>
          <label
            htmlFor="serviceName"
            className="block text-sm font-medium text-gray-700"
          >
            Adicionar Novo Website
          </label>
          <input
            type="text"
            id="serviceName"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
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

function Dashboard(props: {
  active_user_count: number;
  services: Array<Pick<Service, "name">>;
  insuficient_data_count: number;
  total_correct_count: number;
  up_services: number;
  down_services: number;
  total_services: number;
}) {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          <ActiveUsersCount count={props.active_user_count} />
          <TotalCheckedItems count={props.total_correct_count} />
          <InsufficientDataCount count={props.insuficient_data_count} />
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

function TotalCheckedItems(props: { count: number }) {
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

export { back_office_router };
