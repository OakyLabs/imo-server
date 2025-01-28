import { validator } from "hono/validator";
import { z } from "zod";
import { Layout } from "../../components/Layout";
import { BackOfficeLogin } from "../../pages/back-office/login/login";

export const login_form_validator = validator("form", (value, c) => {
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
});
