import { validator } from "hono/validator";
import { Layout } from "../../../components/Layout";
import { BackOfficeLogin } from "../../../pages/back-office/login/login";
import { z } from "zod";

export const login_schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginBody = z.infer<typeof login_schema>;

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

export const logout_query_validator = validator("query", (value) => {
  const parsed = z
    .object({ all: z.literal("true").optional() })
    .safeParse(value);

  if (!parsed.success) {
    return {
      all: false,
    };
  }

  return {
    all: parsed.data.all === "true",
  };
});
