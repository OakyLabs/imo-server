import { Hono } from "hono";
import { home_router } from "./app/home.router";
import { sessionMiddleware, Store } from "hono-sessions";
import { parse_env } from "./env";
import { create_db } from "./db";
import { DrizzleSessionStore } from "./db/session-store";
import { districts_table } from "./db/schema";
import { AppBindings } from "./types";
import { back_office_router } from "./app/back-office.router";

const app = new Hono<AppBindings>();

app.use((c, next) => {
  const pr = typeof process !== "undefined" ? process.env : {};

  c.env = parse_env(Object.assign(c.env || {}, pr));

  return next();
});

app.use("*", async (c, next) => {
  const db = create_db(c.env);

  const store = new DrizzleSessionStore(db);

  return sessionMiddleware({
    encryptionKey: "password_at_least_32_characters_long", // Required for CookieStore, recommended for others
    expireAfterSeconds: 900 * 4, // Expire session after 15 minutes of inactivity
    cookieOptions: {
      sameSite: "Lax", // Recommended for basic CSRF protection in modern browsers
      path: "/", // Required for this library to work properly
      httpOnly: true, // Recommended to avoid XSS attacks
    },
    store,
  })(c, next);
});

//app.get("/", async (c) => {
//  const session = c.get("session");
//  ////
//  ////
//  await session.set("counter", (session.get("counter") || 0) + 1);
//  //
//  return c.html(`<h1>You have visited this page ${session.get("counter")} times</h1>`);
//});
app.route("/", home_router);
app.route("/back-office", back_office_router);

export default app;
