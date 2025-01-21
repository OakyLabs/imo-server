import { Hono } from "hono";
import { Child } from "hono/jsx";
import { home_router } from "./app/home.router";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.route("/", home_router);

export default app;
