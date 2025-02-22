import { Session } from "hono-sessions";
import { Environment } from "./env";

export type SessionDataTypes = {
  session_id: string;
};

export type AppBindings = {
  Bindings: CloudflareBindings & Environment;
  Variables: {
    session: Session<SessionDataTypes>;
    session_key_rotation: boolean;
  };
};
