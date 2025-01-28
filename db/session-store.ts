import { SessionData, Store } from "hono-sessions";
import { IDatabase } from ".";
import { sessions_table } from "./schema";
import { eq } from "drizzle-orm";

export class DrizzleSessionStore implements Store {
  readonly #db: IDatabase;
  constructor(db: IDatabase) {
    this.#db = db;
  }

  async getSessionById(
    session_id: string
  ): Promise<SessionData | null | undefined> {
    if (!session_id) {
      return null;
    }

    const query = await this.#db
      .select()
      .from(sessions_table)
      .where(eq(sessions_table.id, session_id));

    if (query.length) {
      const data = query[0].data;
      return JSON.parse(data as string) as SessionData;
    }

    return null;
  }

  async createSession(
    sessionId: string,
    initialData: SessionData
  ): Promise<void> {
    await this.#db
      .insert(sessions_table)
      .values({ id: sessionId, data: JSON.stringify(initialData) });
  }

  async persistSessionData(
    sessionId: string,
    sessionData: SessionData
  ): Promise<void> {
    await this.#db
      .update(sessions_table)
      .set({ data: JSON.stringify(sessionData) })
      .where(eq(sessions_table.id, sessionId));
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.#db
      .delete(sessions_table)
      .where(eq(sessions_table.id, sessionId));
  }
}
