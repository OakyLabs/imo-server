import { SQLiteSelect } from "drizzle-orm/sqlite-core";
import { IDatabase } from "../../../db";
import { service_table } from "../../../db/schema";
import { eq, count } from "drizzle-orm";

export namespace Services {
  export async function count_offline(db: IDatabase) {
    const [{ count: amount }] = await db
      .select({ count: count() })
      .from(service_table)
      .where(eq(service_table.use, false));

    return amount;
  }

  export async function count_online(db: IDatabase) {
    const [{ count: amount }] = await db
      .select({ count: count() })
      .from(service_table)
      .where(eq(service_table.use, true));

    return amount;
  }

  type BaseProps = {
    limit?: number;
    offset?: number;
  };

  export async function get_services(db: IDatabase, pagination?: BaseProps) {
    const { limit = undefined, offset = undefined } = pagination ?? {};

    let query = db
      .select({ name: service_table.name })
      .from(service_table)
      .$dynamic();

    if (limit != undefined) {
      query = query.limit(limit);
    }

    if (offset != undefined) {
      query = query.offset(offset);
    }

    return await db
      .select({ name: service_table.name })
      .from(service_table)
      .limit(limit as number)
      .offset(offset as number);
  }
}
