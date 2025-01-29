import { z } from "zod";
import { login_schema } from "./login-schema";
import { IDatabase } from "../../../../../db";
import { genSalt, hash } from "bcryptjs";

const salt_rounds = 10;

export async function login(
  body: z.infer<typeof login_schema>,
  _db: IDatabase,
) {
  const salt = await genSalt(salt_rounds);

  const _hashed = await hash(body.password, salt);

  return;
}
