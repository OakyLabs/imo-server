import { Hono } from "hono";
import { AppBindings } from "../../../../types";
import { Layout } from "../../../components/Layout";
import { BackOfficeLogin } from "../../../pages/back-office/login/login";
import { login_form_validator } from "./login-validator";
import { create_db } from "../../../../../db";
import { login } from "./login-use-case";

const login_router = new Hono<AppBindings>();

login_router.get("/", async (c) => {
  return c.html(
    <Layout>
      <BackOfficeLogin error={{ email: undefined, password: undefined }} />
    </Layout>,
  );
});

login_router.post("/", login_form_validator, async (c) => {
  const body = c.req.valid("form");

  const db = create_db(c.env);

  await login(body, db);

  const session = c.get("session");

  session.set("session_id", "3");

  return c.redirect("/back-office/dashboard");
});

export { login_router };
