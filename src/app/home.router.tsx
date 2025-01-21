import { Hono } from "hono";
import { Layout } from "./components/Layout";
import { Hero } from "./pages/home";
import { AppBindings } from "../types";

const home_router = new Hono<AppBindings>();

home_router.get("/", (c) => {
  return c.html(
    <Layout>
      <Hero />
    </Layout>,
  );
});

export { home_router };
