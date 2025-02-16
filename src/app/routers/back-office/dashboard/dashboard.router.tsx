import { Hono } from "hono";
import { AppBindings } from "../../../../types";
import { admin_logged_in_mw } from "../../../middlewares/admin.middleware";
import { create_db } from "../../../../../db";
import * as Services from "../../../../modules/db/services";
import * as Properties from "../../../../modules/db/properties";
import * as Caches from "../../../../modules/db/caches";
import { Layout } from "../../../components/Layout";
import { Dashboard } from "../../../pages/back-office/dashboard/dashboard";

const dashboard_router = new Hono<AppBindings>();

dashboard_router.get("/", admin_logged_in_mw, async (c) => {
  const db = create_db(c.env);

  const [
    offline,
    online,
    services,
    properties_count,
    incomplete_count,
    scraper_info,
  ] = await Promise.all([
    Services.count_offline(db),
    Services.count_online(db),
    Services.get_services(db, { limit: 3 }),
    Properties.count_good(db),
    Properties.count_incomplete(db),
    Caches.scraper_info(db),
  ]);

  return c.html(
    <Layout>
      <Dashboard
        insuficient_data_count={incomplete_count}
        services={services}
        active_user_count={0 /* LOL */}
        total_correct_count={properties_count}
        total_services={offline + online}
        up_services={online}
        down_services={offline}
        is_on={scraper_info?.value === "true"}
        last_changed={scraper_info?.updated_at}
      />
    </Layout>
  );
});

export { dashboard_router };
