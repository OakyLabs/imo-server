import { and, count, eq, isNull } from "drizzle-orm";
import { IDatabase } from "../../../db";
import { DbProperty, properties_table } from "../../../db/schema";

export namespace Properties {
  export async function get_manual_and_style_list(db: IDatabase) {
    const [properties, [{ count: style_missing_properties_count }]] =
      await Promise.all([
        db
          .select()
          .from(properties_table)
          .where(
            and(
              isNull(properties_table.style_lookup_id),
              eq(properties_table.discarded, false),
            ),
          ),

        db
          .select({ count: count() })
          .from(properties_table)
          .where(
            and(
              isNull(properties_table.style_lookup_id),
              eq(properties_table.discarded, false),
            ),
          ),
      ]);

    return {
      properties,
      style_missing_properties_count,
    };
  }

  export async function discard(db: IDatabase, id: DbProperty["id"]) {
    await db
      .update(properties_table)
      .set({ discarded: true })
      .where(eq(properties_table.id, id));
  }
}
