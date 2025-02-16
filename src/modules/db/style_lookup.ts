import { IDatabase } from "../../../db";
import { style_lookup_table } from "../../../db/schema";

export async function get_styles(db: IDatabase) {
  return await db.select().from(style_lookup_table);
}
