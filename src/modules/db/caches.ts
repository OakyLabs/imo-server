import { eq } from "drizzle-orm";
import { IDatabase } from "../../../db";
import { cache_table } from "../../../db/schema";

export namespace Caches {
  export async function is_in_use_result(db: IDatabase) {
    const result = await db
      .select({
        value: cache_table.value,
        updated_at: cache_table.updated_at,
      })
      .from(cache_table)
      .where(eq(cache_table.key, "in_use"));

    return result?.[0];
  }
}
