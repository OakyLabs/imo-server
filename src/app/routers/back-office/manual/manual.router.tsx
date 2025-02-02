import { Hono } from "hono";
import { AppBindings } from "../../../../types";
import { admin_logged_in_mw } from "../../../middlewares/admin.middleware";
import { create_db } from "../../../../../db";
import { Locations } from "../../../../modules/db/location";
import { MunicipalityOptions } from "../../../pages/back-office/manual-edit/municipality/municipality-options";

const manual_router = new Hono<AppBindings>();

manual_router.get("/municipalities", admin_logged_in_mw, async (c) => {
  const db = create_db(c.env);

  const query = c.req.query("district");

  const all_municipalities = await Locations.municipalities(db, query);

  return c.html(<MunicipalityOptions municipalities={all_municipalities} />);
});

export { manual_router };
