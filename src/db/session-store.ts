import { SessionData, Store } from "hono-sessions";
import { IDatabase } from ".";
import { districts_table, sessions_table } from "./schema";
import { eq } from "drizzle-orm";

async function wait() {
  return new Promise((r) => setTimeout(r, 300));
}

export class DrizzleSessionStore implements Store {
  private readonly db: IDatabase;
  constructor(db: IDatabase) {
    console.log("created");
    this.db = db;
  }

  async getSessionById(
    session_id: string,
  ): Promise<SessionData | null | undefined> {
    await wait();
    if (!session_id) {
      return null;
    }
    console.log(await this.db.select().from(districts_table));
    console.log("Called");

    console.log("About to");
    const db = this.db;
    const query = await db
      .select()
      .from(sessions_table)
      .where(eq(sessions_table.id, session_id));

    console.log("Done?");

    console.log("QUERY");

    if (query.length) {
      return JSON.parse(query[0].data) as SessionData;
    }
    console.log("NTOHING");

    return null;
  }

  async createSession(
    sessionId: string,
    initialData: SessionData,
  ): Promise<void> {
    await this.db
      .insert(sessions_table)
      .values({ id: sessionId, data: JSON.stringify(initialData) });
  }

  async persistSessionData(
    sessionId: string,
    sessionData: SessionData,
  ): Promise<void> {
    await this.db
      .update(sessions_table)
      .set({ data: JSON.stringify(sessionData) })
      .where(eq(sessions_table.id, sessionId));
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.db
      .delete(sessions_table)
      .where(eq(sessions_table.id, sessionId));
  }
}
