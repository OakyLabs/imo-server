import { Session, SessionData } from "hono-sessions";
import { IDatabase } from "../../../../../../db";
import { SessionDataTypes } from "../../../../../types";
import { Sessions } from "../../../../../modules/db/sessions";

type LogoutProps = {
  is_all: boolean;
  session: Session<SessionDataTypes>;
};

export async function logout(db: IDatabase, props: LogoutProps) {
  const session_id = props.session.get("session_id");

  if (props.is_all && session_id) {
    await Sessions.logout_all(db, session_id);
  } else {
    props.session.deleteSession();
  }
}
