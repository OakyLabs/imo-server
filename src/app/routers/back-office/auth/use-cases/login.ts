import { genSalt, hash } from "bcryptjs";
import { LoginBody } from "../validators";
import { IDatabase } from "../../../../../../db";

const salt_rounds = 10;

export async function login(body: LoginBody, _db: IDatabase) {
  const salt = await genSalt(salt_rounds);

  const _hashed = await hash(body.password, salt);

  return;
}
