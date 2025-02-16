import { like } from "drizzle-orm";
import { IDatabase } from "../../../db";
import { sessions_table } from "../../../db/schema";
import { SessionDataTypes } from "../../types";

export async function logout_all(
  db: IDatabase,
  session_id: SessionDataTypes["session_id"]
) {
  await db
    .delete(sessions_table)
    .where(like(sessions_table.data, `%\\"value\\":\\"${session_id}\\"%`));
}
