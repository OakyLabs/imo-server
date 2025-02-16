import { eq } from "drizzle-orm";
import { IDatabase } from "../../../db";
import { concelhos_table, districts_table } from "../../../db/schema";

export async function districts(db: IDatabase) {
  return await db
    .select({ name: districts_table.name, id: districts_table.id })
    .from(districts_table);
}

export async function municipalities(
  db: IDatabase,
  district_name: string | undefined
) {
  let municipalities = db
    .select({
      name: concelhos_table.name,
      id: concelhos_table.id,
    })
    .from(concelhos_table)
    .$dynamic();

  if (district_name) {
    municipalities = municipalities
      .leftJoin(
        districts_table,
        eq(concelhos_table.distrito_id, districts_table.id)
      )
      .where(eq(districts_table.name, district_name));
  }

  return await municipalities;
}
