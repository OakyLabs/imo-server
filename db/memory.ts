import { eq } from "drizzle-orm";
import { IDatabase } from ".";
import * as Schema from "./schema";
import { ScrapedData } from "../scraper/scraper-types";

export class Database {
  #db: IDatabase;

  constructor(db: IDatabase) {
    this.#db = db;
  }

  async services() {
    return await this.#db
      .select()
      .from(Schema.service_table)
      .where(eq(Schema.service_table.use, true));
  }

  async stop_services(arr: Array<Schema.Service["id"]>) {
    const list = new Set([...arr]);

    await this.#db.transaction(async (tx) => {
      await Promise.all(
        Array.from(list).map(async (id) => {
          await tx
            .update(Schema.service_table)
            .set({ use: false })
            .where(eq(Schema.service_table.id, id));
        })
      );
    });
  }

  async get_municipalities() {
    const concelhos = await this.#db
      .select({
        id: Schema.concelhos_table.id,
        name: Schema.concelhos_table.name,
      })
      .from(Schema.concelhos_table);

    const data_structure_concelhos = concelhos.reduce<Record<string, number>>(
      (acc, val) => {
        acc[val.name] = val.id;

        return acc;
      },

      {}
    );

    return data_structure_concelhos;
  }

  async get_services() {
    const data = await this.#db
      .select({ url: Schema.properties_table.url })
      .from(Schema.properties_table);

    return new Set(data.map((e) => e.url));
  }

  async store(arr: Array<ScrapedData & { service_id: number }>) {
    let counts = {
      success: 0,
      repeat: 0,
    };

    const now = new Date();

    const result = await this.#db
      .insert(Schema.properties_table)
      .values(arr.map((e) => ({ ...e, created_at: now })))
      .returning({ u: Schema.properties_table.url })
      .onConflictDoNothing({ target: Schema.properties_table.url });

    counts = {
      success: result.length,
      repeat: arr.length - result.length,
    };

    console.log({ counts });

    return result;
  }

  async check_is_in_use() {
    const result = await this.#db
      .select({ value: Schema.cache_table.value })
      .from(Schema.cache_table)
      .where(eq(Schema.cache_table.key, "in_use"));

    return result?.[0]?.value === "true";
  }
}
