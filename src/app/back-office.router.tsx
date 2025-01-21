import { Hono } from "hono";
import { AppBindings } from "../types";
import { Layout } from "./components/Layout";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { validator } from "hono/validator";

const back_office_router = new Hono<AppBindings>();

type BackOfficeProps = {
  error: {
    email?: Array<string> | undefined;
    password?: Array<string> | undefined;
  };
};

function BackOfficeLogin(props: BackOfficeProps) {
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
                  <p class="absolute right-0 top-0 mt-2 mr-2 text-sm text-red-600">
                    {props.error.email.join(" ")}
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

              <div className="mt-1">
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
                  <p class="absolute right-0 top-0 mt-2 mr-2 text-sm text-red-600">
                    {props.error.password.join(" ")}
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
      console.log(parsed.error.flatten().fieldErrors);

      return c.html(
        <Layout>
          <BackOfficeLogin error={parsed.error.flatten().fieldErrors} />
        </Layout>,
      );
    }

    console.log("Data");

    return parsed.data;
  }),
  async (c) => {
    return c.html(
      <Layout>
        <h1>Hello</h1>
      </Layout>,
    );
  },
);

export { back_office_router };
