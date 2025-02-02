import { Hono } from "hono";
import { AppBindings } from "../../../../types";
import { login_form_validator } from "../login/login-validator";
import { BackOfficeLogin } from "../../../pages/back-office/login/login";
import { Layout } from "../../../components/Layout";
import { create_db } from "../../../../../db";
import { login } from "../login/login-use-case";
import { admin_logged_in_mw } from "../../../middlewares/admin.middleware";
import { logout_query_validator } from "./validators";
import { logout } from "./use-cases/logout";

const bo_auth_router = new Hono<AppBindings>();

bo_auth_router.get("/login", async (c) => {
  return c.html(
    <Layout>
      <BackOfficeLogin error={{ email: undefined, password: undefined }} />
    </Layout>,
  );
});

bo_auth_router.post("/login", login_form_validator, async (c) => {
  const body = c.req.valid("form");

  const db = create_db(c.env);

  await login(body, db);

  const session = c.get("session");

  session.set("session_id", "3");

  return c.redirect("/back-office/dashboard");
});

bo_auth_router.get(
  "/logout",
  admin_logged_in_mw,
  logout_query_validator,
  async (c) => {
    c.header("HX-Redirect", "/");
    const { all } = c.req.valid("query");
    const session = c.get("session");
    const db = create_db(c.env);

    await logout(db, { is_all: all, session });

    return c.body(null);
  },
);
export { bo_auth_router };
