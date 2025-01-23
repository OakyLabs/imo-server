import { Hono } from "hono";
import { AppBindings } from "../types";
import { Layout } from "./components/Layout";
import { genSalt, hash } from "bcryptjs";
import { z } from "zod";
import { validator } from "hono/validator";
import {
  cache_table,
  concelhos_table,
  districts_table,
  properties_table,
  service_table,
  style_lookup_table,
} from "../db/schema";
import { createMiddleware } from "hono/factory";
import { create_db } from "../db";
import { and, count, desc, eq, isNotNull, isNull, or } from "drizzle-orm";
import { Dashboard } from "./pages/back-office/dashboard/dashboard";
import { ManualEdit } from "./pages/back-office/manual-edit/manual-edit-form.page";
import { BackOfficeLogin } from "./pages/back-office/login/login";

const salt_rounds = 10;

const back_office_router = new Hono<AppBindings>();

back_office_router.get("/", async (c) => {
  const session = c.get("session");

  const session_id = session.get("session_id");

  if (!session_id) {
    return c.redirect("/back-office/login");
  }

  return c.redirect("/back-office/dashboard");
});

back_office_router.get("/login", async (c) => {
  return c.html(
    <Layout>
      <BackOfficeLogin error={{ email: undefined, password: undefined }} />
    </Layout>,
  );
});

back_office_router.post(
  "/login",
  validator("form", (value, c) => {
    const parsed = z
      .object({
        email: z.string().email(),
        password: z.string().min(8),
      })
      .safeParse(value);

    if (!parsed.success) {
      return c.html(
        <Layout>
          <BackOfficeLogin error={parsed.error.flatten().fieldErrors} />
        </Layout>,
      );
    }

    return parsed.data;
  }),
  async (c) => {
    const body = c.req.valid("form");

    const salt = await genSalt(salt_rounds);

    const hashed_password = await hash(body.password, salt);

    const session = c.get("session");

    session.set("session_id", hashed_password);

    return c.redirect("/back-office/dashboard");
  },
);

const admin_logged_in_mw = createMiddleware(async (c, next) => {
  const session = c.get("session");

  const session_id = session.get("session_id");

  if (!session_id) {
    return c.redirect("/");
  }

  return next();
});

back_office_router.get("/dashboard", admin_logged_in_mw, async (c) => {
  const db = create_db(c.env);

  const [
    offline,
    online,
    services,
    properties_count,
    incomplete,
    scraper_info,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(service_table)
      .where(eq(service_table.use, false)),

    db
      .select({ count: count() })
      .from(service_table)
      .where(eq(service_table.use, true)),
    db
      .select({ name: service_table.name })
      .from(service_table)
      .limit(3)
      .where(eq(service_table.use, true)),
    db
      .select({ count: count() })
      .from(properties_table)
      .where(
        and(
          isNotNull(properties_table.price),
          isNotNull(properties_table.concelho_id),
          isNotNull(properties_table.style_lookup_id),
        ),
      ),
    db
      .select({ count: count() })
      .from(properties_table)
      .where(
        or(
          isNull(properties_table.price),
          isNull(properties_table.concelho_id),
          isNull(properties_table.style_lookup_id),
        ),
      ),
    db
      .select({
        value: cache_table.value,
        updated_at: cache_table.updated_at,
      })
      .from(cache_table)
      .where(eq(cache_table.key, "in_use")),
  ]);

  const up_services = online[0].count;
  const down_services = offline[0].count;

  console.log(incomplete);

  return c.html(
    <Layout>
      <Dashboard
        insuficient_data_count={incomplete[0].count}
        services={services}
        active_user_count={0}
        total_correct_count={properties_count[0].count}
        total_services={up_services + down_services}
        up_services={up_services}
        down_services={down_services}
        is_on={scraper_info[0].value === "true"}
        last_changed={scraper_info[0].updated_at}
      />
    </Layout>,
  );
});

// HTMX here
back_office_router.get("/municipalities", admin_logged_in_mw, async (c) => {
  const db = create_db(c.env);

  const query = c.req.query("district");

  const all_concelhos_list = await db.query.concelhos_table.findMany({
    with: { distrito: { columns: { name: true } } },
  });

  if (!query) {
    return c.html(
      <>
        <option disabled value="">
          Select Municipality
        </option>
        {all_concelhos_list.map((municipality) => (
          <option key={municipality.name} value={municipality.name}>
            {municipality.name}
          </option>
        ))}
      </>,
    );
  }

  const all_concelhos = await db
    .select({ name: concelhos_table.name, id: concelhos_table.id })
    .from(concelhos_table)
    .leftJoin(
      districts_table,
      eq(concelhos_table.distrito_id, districts_table.id),
    )
    .where(eq(districts_table.name, query));

  return c.html(
    <>
      <option disabeld value="">
        Select Municipality
      </option>
      {all_concelhos.map((municipality) => (
        <option key={municipality.name} value={municipality.name}>
          {municipality.name}
        </option>
      ))}
    </>,
  );
});

back_office_router.get("/manual", admin_logged_in_mw, async (c) => {
  const db = create_db(c.env);

  const [price, concelho, style, all_styles, districts, concelhos] =
    await Promise.all([
      db.select().from(properties_table).where(isNull(properties_table.price)),
      db
        .select()
        .from(properties_table)
        .where(isNull(properties_table.concelho_id)),
      db
        .select()
        .from(properties_table)
        .where(isNull(properties_table.style_lookup_id)),
      db.select().from(style_lookup_table),
      db.select().from(districts_table),
      db.query.concelhos_table.findMany({
        with: { distrito: { columns: { name: true } } },
      }),
    ]);

  if (!price.length && !concelho.length && !style.length) {
    return c.redirect("/back-office/dashboard");
  }

  return c.html(
    <ManualEdit
      style_incomplete={style}
      all_styles={all_styles}
      districts={districts}
      municipality_incomplete={concelho}
      municipalities={concelhos}
      price_incomplete={price}
    />,
  );
});

back_office_router.post(
  "/save/style/:param",
  admin_logged_in_mw,
  validator("form", (value, c) => {
    const parsed = z.object({ style: z.coerce.number() }).safeParse(value);

    if (!parsed.success) {
      return c.redirect("/back-office/manual");
    }

    return parsed.data;
  }),
  validator("param", (value, c) => {
    const parsed = z
      .object({
        param: z.coerce.number(),
      })
      .safeParse(value);

    if (!parsed.success) {
      return c.redirect("/back-office/manual");
    }

    return parsed.data;
  }),
  async (c) => {
    const { style } = c.req.valid("form");
    const { param } = c.req.valid("param");

    const db = create_db(c.env);

    const style_exists = await db
      .select({ id: style_lookup_table.id })
      .from(style_lookup_table)
      .where(eq(style_lookup_table.id, style));

    if (!style_exists.length) {
      c.status(400);
      return c.redirect("/back-office/manual");
    }

    await db
      .update(properties_table)
      .set({ style_lookup_id: style_exists[0].id })
      .where(eq(properties_table.id, param));

    return c.redirect("/back-office/manual");
  },
);

back_office_router.post(
  "/save/price/:param",
  admin_logged_in_mw,
  validator("form", (value, c) => {
    const parsed = z.object({ price: z.string().min(3) }).safeParse(value);
    console.log("HERE?", parsed.success);

    if (!parsed.success) {
      c.status(400);
      return c.redirect("/back-office/manual");
    }
    console.log(" HERE ");

    return parsed.data;
  }),
  validator("param", (value, c) => {
    const parsed = z
      .object({
        param: z.coerce.number(),
      })
      .safeParse(value);

    if (!parsed.success) {
      c.status(400);
      return c.redirect("/back-office/manual");
    }

    return parsed.data;
  }),
  async (c) => {
    const { price } = c.req.valid("form");
    console.log(price);
    const { param } = c.req.valid("param");

    const db = create_db(c.env);

    await db
      .update(properties_table)
      .set({ price })
      .where(eq(properties_table.id, param));

    return c.redirect("/back-office/manual");
  },
);

back_office_router.post(
  "/save/location/:param",
  admin_logged_in_mw,
  validator("form", (value, c) => {
    const parsed = z
      .object({ district: z.string(), municipality: z.string() })
      .safeParse(value);

    if (!parsed.success) {
      return c.redirect("/back-office/manual");
    }

    return parsed.data;
  }),
  validator("param", (value, c) => {
    const parsed = z
      .object({
        param: z.coerce.number(),
      })
      .safeParse(value);

    if (!parsed.success) {
      return c.redirect("/back-office/manual");
    }

    return parsed.data;
  }),
  async (c) => {
    const { municipality } = c.req.valid("form");
    const { param } = c.req.valid("param");

    const db = create_db(c.env);

    const municipality_exists = await db
      .select({ id: concelhos_table.id })
      .from(concelhos_table)
      .where(eq(concelhos_table.name, municipality));

    if (!municipality.length) {
      c.status(400);
      return c.redirect("/back-office/manual");
    }

    await db
      .update(properties_table)
      .set({ concelho_id: municipality_exists[0].id })
      .where(eq(properties_table.id, param));

    return c.redirect("/back-office/manual");
  },
);

back_office_router.post(
  "/new-service",
  admin_logged_in_mw,
  validator("form", (value, c) => {
    const parsed = z
      .object({ name: z.string(), website: z.string().url() })
      .safeParse(value);

    console.log({ parsed });

    if (!parsed.success) {
      return c.redirect("/back-office");
    }

    return parsed.data;
  }),
  async (c) => {
    const body = c.req.valid("form");

    console.log({ body });
    const db = create_db(c.env);

    await db
      .insert(service_table)
      .values({ name: body.name, link: body.website, use: false });

    return c.redirect("/back-office/dashboard");
  },
);

export { back_office_router };
