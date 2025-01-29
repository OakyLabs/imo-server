import { validator } from "hono/validator";
import { login_schema } from "./login-schema";
import { Layout } from "../../../components/Layout";
import { BackOfficeLogin } from "../../../pages/back-office/login/login";

export const login_form_validator = validator("form", (value, c) => {
  const parsed = login_schema.safeParse(value);

  if (!parsed.success) {
    return c.html(
      <Layout>
        <BackOfficeLogin error={parsed.error.flatten().fieldErrors} />
      </Layout>,
    );
  }

  return parsed.data;
});
