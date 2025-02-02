import { Hono } from "hono";
import { AppBindings } from "../types";
import { z } from "zod";
import { validator } from "hono/validator";
import {
  concelhos_table,
  districts_table,
  properties_table,
  service_table,
  style_lookup_table,
} from "../../db/schema";
import { create_db } from "../../db";
import { and, count, desc, eq, isNull, like } from "drizzle-orm";
import { ManualEdit } from "./pages/back-office/manual-edit/manual-edit-form.page";
import { PriceIncomplete } from "./pages/back-office/manual-edit/price-incomplete.form";
import { StyleIncomplete } from "./pages/back-office/manual-edit/style-incomplete.form";
import { MunicipalityIncomplete } from "./pages/back-office/manual-edit/municipality";
import { ManageWeb } from "./pages/back-office/manage-websites/manage-websites";
import { Properties } from "../modules/db/properties";
import { Styles } from "../modules/db/style_lookup";
import { admin_logged_in_mw } from "./middlewares/admin.middleware";
import { dashboard_router } from "./routers/back-office/dashboard/dashboard.router";
import { bo_auth_router } from "./routers/back-office/auth/back-office-auth.router";
import { manual_router } from "./routers/back-office/manual/manual.router";

const back_office_router = new Hono<AppBindings>();

back_office_router.get("/", async (c) => {
  const session = c.get("session");

  const session_id = session.get("session_id");

  if (!session_id) {
    return c.redirect("/back-office/auth/login");
  }

  return c.redirect("/back-office/dashboard");
});

back_office_router.route("/auth", bo_auth_router);
back_office_router.route("/dashboard", dashboard_router);
back_office_router.route("/manual", manual_router);

back_office_router.get("/manual", admin_logged_in_mw, async (c) => {
  const db = create_db(c.env);

  const [
    price,
    concelho,
    style,
    all_styles,
    districts,
    concelhos,
    [{ count: properties_amount }],
    [{ count: style_amount }],
    [{ count: municipalities_amount }],
  ] = await Promise.all([
    db
      .select()
      .from(properties_table)
      .where(
        and(
          isNull(properties_table.price),
          eq(properties_table.discarded, false),
        ),
      )
      .limit(10),
    db
      .select()
      .from(properties_table)
      .where(
        and(
          isNull(properties_table.concelho_id),
          eq(properties_table.discarded, false),
        ),
      )
      .limit(10),
    db
      .select()
      .from(properties_table)
      .where(
        and(
          isNull(properties_table.style_lookup_id),
          eq(properties_table.discarded, false),
        ),
      )
      .limit(10),
    db.select().from(style_lookup_table),
    db.select().from(districts_table),
    db.query.concelhos_table.findMany({
      with: { distrito: { columns: { name: true, id: true } } },
    }),

    db
      .select({ count: count() })
      .from(properties_table)
      .where(isNull(properties_table.price)),
    db
      .select({ count: count() })
      .from(properties_table)
      .where(isNull(properties_table.style_lookup_id)),
    db
      .select({ count: count() })
      .from(properties_table)
      .where(isNull(properties_table.concelho_id)),
  ]);

  if (!price.length && !concelho.length && !style.length) {
    return c.redirect("/back-office/dashboard");
  }

  return c.html(
    <ManualEdit
      municipalities={{
        districts,
        incomplete_properties: concelho,
        municipalities: concelhos,
        total_pages: Math.ceil(municipalities_amount / 10),
        curr_page: 1,
      }}
      price={{
        incomplete_properties: price,
        curr_page: 1,
        total_pages: Math.ceil(properties_amount / 10),
      }}
      style={{
        all_styles,
        incomplete_properties: style,
        curr_page: 1,
        total_pages: Math.ceil(style_amount / 10),
      }}
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

    if (!parsed.success) {
      c.status(400);
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
      c.status(400);
      return c.redirect("/back-office/manual");
    }

    return parsed.data;
  }),
  async (c) => {
    const { price } = c.req.valid("form");
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

    if (!parsed.success) {
      return c.redirect("/back-office");
    }

    return parsed.data;
  }),
  async (c) => {
    const body = c.req.valid("form");

    const db = create_db(c.env);

    await db
      .insert(service_table)
      .values({ name: body.name, link: body.website, use: false });

    return c.redirect("/back-office/dashboard");
  },
);

back_office_router.get(
  "/manual/:sector/:page",
  admin_logged_in_mw,
  validator("param", (value, c) => {
    const parsed = z
      .object({
        sector: z.enum(["price", "municipality", "style"]),
        page: z.coerce.number().int().positive(),
      })
      .safeParse(value);

    if (!parsed.success) {
      return c.redirect("/back-office-manual");
    }

    return parsed.data;
  }),
  async (c) => {
    const { sector, page } = c.req.valid("param");
    const db = create_db(c.env);

    const table_col =
      sector === "price"
        ? properties_table.price
        : sector === "style"
          ? properties_table.style_lookup_id
          : properties_table.concelho_id;

    const table = await db
      .select()
      .from(properties_table)
      .where(isNull(table_col))
      .limit(10)
      .offset((page - 1) * 10);

    const [{ count: total }] = await db
      .select({ count: count() })
      .from(properties_table)
      .where(isNull(table_col));

    const total_pages = Math.ceil(total / 10);

    if (sector === "price") {
      return c.html(
        <PriceIncomplete
          curr_page={page}
          total_pages={total_pages}
          incomplete_properties={table}
        />,
      );
    }

    if (sector === "style") {
      const all_styles = await db.select().from(style_lookup_table);
      return c.html(
        <StyleIncomplete
          curr_page={page}
          total_pages={total_pages}
          incomplete_properties={table}
          all_styles={all_styles}
        />,
      );
    }

    const [districts, municipalities] = await Promise.all([
      db.select().from(districts_table),
      db.query.concelhos_table.findMany({
        with: { distrito: { columns: { name: true } } },
      }),
    ]);

    return c.html(
      <MunicipalityIncomplete
        curr_page={page}
        total_pages={total_pages}
        incomplete_properties={table}
        municipalities={municipalities}
        districts={districts}
      />,
    );
  },
);

back_office_router.get("/manage-services", admin_logged_in_mw, async (c) => {
  const db = create_db(c.env);

  const list = await db
    .select({
      id: service_table.id,
      name: service_table.name,
      use: service_table.use,
      auction_count: count(properties_table.id),
    })
    .from(service_table)
    .leftJoin(
      properties_table,
      eq(service_table.id, properties_table.service_id),
    )
    .groupBy(service_table.id)
    .orderBy((fields) => desc(fields.auction_count));

  return c.html(<ManageWeb services={list} />);
});

back_office_router.post(
  "/save/municipality",
  admin_logged_in_mw,
  validator("form", (value) => {
    console.log({ value });
    return z.record(z.string(), z.string()).safeParse(value);
  }),
  async (c) => {
    const { success, data } = c.req.valid("form");
    const db = create_db(c.env);
    let districts = await db.select().from(districts_table);
    let concelhos = await db.query.concelhos_table.findMany({
      with: { distrito: { columns: { name: true } } },
    });
    let [{ count: municipalities_amount }] = await db
      .select({ count: count() })
      .from(properties_table)
      .where(
        and(
          isNull(properties_table.concelho_id),
          eq(properties_table.discarded, false),
        ),
      );

    let municipality_incomplete = await db
      .select()
      .from(properties_table)
      .where(
        and(
          isNull(properties_table.concelho_id),
          eq(properties_table.discarded, false),
        ),
      )
      .limit(10);

    if (!success) {
      return c.html(
        <MunicipalityIncomplete
          districts={districts}
          municipalities={concelhos}
          curr_page={1}
          total_pages={Math.ceil(municipalities_amount / 10)}
          incomplete_properties={municipality_incomplete}
        />,
      );
    }

    const entries = Object.entries(data)
      .filter(([, value]) => value)
      .map(([key, value]) => {
        return [Number(key.split("-")[1]), +value];
      });

    await db.transaction(async (tx) => {
      await Promise.all(
        entries.map(async ([id, municipality_id]) => {
          await tx
            .update(properties_table)
            .set({ concelho_id: municipality_id })
            .where(eq(properties_table.id, id));
        }),
      );
    });

    districts = await db.select().from(districts_table);
    concelhos = await db.query.concelhos_table.findMany({
      with: { distrito: { columns: { name: true } } },
    });
    [{ count: municipalities_amount }] = await db
      .select({ count: count() })
      .from(properties_table)
      .where(
        and(
          isNull(properties_table.concelho_id),
          eq(properties_table.discarded, false),
        ),
      );

    municipality_incomplete = await db
      .select()
      .from(properties_table)
      .where(
        and(
          isNull(properties_table.concelho_id),
          eq(properties_table.discarded, false),
        ),
      )
      .limit(10);

    return c.html(
      <MunicipalityIncomplete
        incomplete_properties={municipality_incomplete}
        total_pages={Math.ceil(municipalities_amount / 10)}
        curr_page={1}
        municipalities={concelhos}
        districts={districts}
      />,
    );
  },
);

back_office_router.post(
  "/save/stuff",
  admin_logged_in_mw,
  validator("form", (value) => {
    return z.record(z.string(), z.string()).safeParse(value);
  }),
  async (c) => {
    const { success, data } = c.req.valid("form");
    const db = create_db(c.env);

    if (!success) {
      const [style, all_styles, [{ count: style_amount }]] = await Promise.all([
        db
          .select()
          .from(properties_table)
          .where(
            and(
              isNull(properties_table.style_lookup_id),
              eq(properties_table.discarded, false),
            ),
          )
          .limit(10),
        db.select().from(style_lookup_table),
        db
          .select({ count: count() })
          .from(properties_table)
          .where(
            and(
              isNull(properties_table.style_lookup_id),
              eq(properties_table.discarded, false),
            ),
          ),
      ]);
      return c.html(
        <StyleIncomplete
          curr_page={1}
          total_pages={Math.ceil(style_amount / 10)}
          all_styles={all_styles}
          incomplete_properties={style}
        />,
      );
    }

    const entries = Object.entries(data)
      .filter(([, value]) => value)
      .map(([key, value]) => {
        return [Number(key.split("-")[1]), +value];
      });

    await db.transaction(async (tx) => {
      await Promise.all(
        entries.map(async ([id, real_estate]) => {
          await tx
            .update(properties_table)
            .set({ style_lookup_id: real_estate })
            .where(eq(properties_table.id, id));
        }),
      );
    });

    const [style, all_styles, [{ count: style_amount }]] = await Promise.all([
      db
        .select()
        .from(properties_table)
        .where(
          and(
            isNull(properties_table.style_lookup_id),
            eq(properties_table.discarded, false),
          ),
        )
        .limit(10),
      db.select().from(style_lookup_table),
      db
        .select({ count: count() })
        .from(properties_table)
        .where(
          and(
            isNull(properties_table.style_lookup_id),
            eq(properties_table.discarded, false),
          ),
        ),
    ]);

    return c.html(
      <StyleIncomplete
        curr_page={1}
        total_pages={Math.ceil(style_amount / 10)}
        all_styles={all_styles}
        incomplete_properties={style}
      />,
    );
  },
);

back_office_router.post(
  "/manual/discard/:param",
  admin_logged_in_mw,
  validator("param", (value) => {
    return z.object({ param: z.coerce.number() }).safeParse(value);
  }),
  async (c) => {
    const { success, data } = c.req.valid("param");
    const db = create_db(c.env);

    if (!success) {
      const [{ style_missing_properties_count, properties }, style] =
        await Promise.all([
          Properties.get_manual_and_style_list(db),
          Styles.get_styles(db),
        ]);

      return c.html(
        <StyleIncomplete
          curr_page={1}
          total_pages={Math.ceil(style_missing_properties_count / 10)}
          all_styles={style}
          incomplete_properties={properties}
        />,
      );
    }

    await Properties.discard(db, data.param);

    const [{ style_missing_properties_count, properties }, style] =
      await Promise.all([
        Properties.get_manual_and_style_list(db),
        Styles.get_styles(db),
      ]);

    return c.html(
      <StyleIncomplete
        curr_page={1}
        total_pages={Math.ceil(style_missing_properties_count / 10)}
        all_styles={style}
        incomplete_properties={properties}
      />,
    );
  },
);

export { back_office_router };
