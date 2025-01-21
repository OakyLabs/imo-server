import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { Environment } from "../env";

export function create_db(env: Environment) {
  const db = drizzle({
    connection: {
      url: env.DATABASE_URL,
      authToken: env.DATABASE_AUTH_TOKEN,
    },
    schema,
  });

  return db;
}

export type IDatabase = ReturnType<typeof create_db>;
