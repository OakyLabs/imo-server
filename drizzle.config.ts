//import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { parse_env } from "./src/env";

const env = parse_env(process.env);

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  },
  verbose: true,
  strict: true,
});
