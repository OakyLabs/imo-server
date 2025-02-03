import { and, count, eq, isNotNull, isNull, or } from "drizzle-orm";
import { IDatabase } from "../../../db";
import { DbProperty, properties_table } from "../../../db/schema";

export namespace Properties {
  type PropertyProps = {
    /**
     * Offset value when searching db
     * @default 0
     */
    offset?: number;
    /**
     * Limit of responses per page
     * @default 10
     */
    limit?: number;
    /**
     * Defines wether we should count discarded. Should always be false, unless there is a really important reason for it
     * @default false
     */
    count_discarded?: boolean;
  };

  export async function get_manual_and_style_list(db: IDatabase, offset = 0) {
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
          )
          .limit(10)
          .offset(offset),

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
    console.log("Discarding");
    await db
      .update(properties_table)
      .set({ discarded: true })
      .where(eq(properties_table.id, id));
  }

  /**
   *
   * @param {IDatabase} db instance of the database (created per request)
   * @returns {Promise<number>} Total amount of properties that are not discarded, have a price, a municipality and a style lookup assigned to it
   */
  export async function count_good(db: IDatabase) {
    const [{ count: amount }] = await db
      .select({ count: count() })
      .from(properties_table)
      .where(
        and(
          isNotNull(properties_table.price),
          isNotNull(properties_table.concelho_id),
          isNotNull(properties_table.style_lookup_id),
          eq(properties_table.discarded, false),
        ),
      );

    return amount;
  }

  /**
   *
   * @param {IDatabase} db instance of the database (created per request)
   * @returns {Promise<number>} Total amount of properties that are not discarded but have either price, municipality_id or style missing
   *
   */
  export async function count_incomplete(db: IDatabase) {
    const [{ count: amount }] = await db
      .select({ count: count() })
      .from(properties_table)
      .where(
        and(
          or(
            isNull(properties_table.price),
            isNull(properties_table.concelho_id),
            isNull(properties_table.style_lookup_id),
          ),
          eq(properties_table.discarded, false),
        ),
      );

    return amount;
  }
}
