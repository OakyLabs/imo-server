import { z } from "zod";

const EnvSchema = z
  .object({
    NODE_ENV: z.string().default("development"),
    DATABASE_URL: z.string().url(),
    DATABASE_AUTH_TOKEN: z.string().optional(),
  })
  .superRefine((input, ctx) => {
    if (input.NODE_ENV === "production" && !input.DATABASE_AUTH_TOKEN) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_type,
        expected: "string",
        received: "undefined",
        path: ["DATABASE_AUTH_TOKEN"],
        message: "Must be set when NODE_ENV is 'production'",
      });
    }
  });

export type Environment = z.infer<typeof EnvSchema>;

export function parse_env(data: unknown) {
  const { data: env, error } = EnvSchema.safeParse(data);

  if (error) {
    const errorMessage = `❌ Invalid env - ${Object.entries(
      error.flatten().fieldErrors
    )
      .map(([key, errors]) => `${key}: ${errors.join(",")}`)
      .join(" | ")}`;
    throw new Error(errorMessage);
  }

  return env;
}
