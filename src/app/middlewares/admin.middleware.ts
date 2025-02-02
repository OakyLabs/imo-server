import { createMiddleware } from "hono/factory";
import { AppBindings } from "../../types";

export const admin_logged_in_mw = createMiddleware<AppBindings>(
  async (c, next) => {
    const session = c.get("session");

    const session_id = session.get("session_id");

    if (!session_id) {
      return c.redirect("/");
    }

    return next();
  },
);
