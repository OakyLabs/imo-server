import { is_all_request, is_headless_request } from "./config/opts";
import playwright from "playwright";
import {
  BaseEvent,
  OnMethods,
  ScrapedAuction,
  ScrapedData,
} from "./scraper-types";
import { Database } from "../db/memory";
import { create_db } from "../db";
import { env } from "./env";
import { logger } from "../src/logger";
import * as Schema from "../db/schema";
import { async_storage } from "./config/local-storage";
import { wait_for_execution } from "./config/wrapper";
import { SCRAPERS } from "./scrapers";
import { parsed_flags } from "./config/cli";
import { attempt_ai } from "./lib/ai";
import { fromAsyncThrowable } from "neverthrow";
import { Queue } from "async-await-queue";

const user_agent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36";

async function main() {
  const is_all = is_all_request();

  const is_headless = is_headless_request();

  const browser = await playwright.chromium.launch({
    headless: is_headless,
  });

  const ctx = await browser.newContext({ userAgent: user_agent });

  const results: Array<ScrapedAuction> = [];

  const errors: Array<BaseEvent> = [];

  const db = create_db(env);

  const database = new Database(db);

  const [property_urls, concelhos, services_array] = await Promise.all([
    database.get_services(),
    database.get_municipalities(),
    database.services(),
  ]);

  const on_methods: OnMethods = {
    error(props) {
      logger.error("ERROR WHEN PARSING", {
        name: props.service.name,
        message: props.error.message,
        err: "url" in props.error && props.error.url,
      });

      errors.push(props.error);
    },
    property(property_props, service) {
      // TODO: still much to do
      if (property_urls.has(property_props.url)) {
        logger.info(`Skipping ${property_props.url} because it already exists`);

        return;
      }

      logger.info("Property created", property_props);
      results.push({ ...property_props, service_id: service!.id });
    },
  };

  const all_services = services_array.reduce<Record<string, Schema.Service>>(
    (acc, val) => {
      acc[val.name] = val;

      return acc;
    },
    {},
  );

  await async_storage.run(
    { ctx, on: on_methods, concelhos, property_urls },
    async () => {
      if (is_all) {
        await all(services_array, database);
      } else if (parsed_flags._.length === 1) {
        await single(all_services, parsed_flags._[0]);
      }
    },
  );

  await wait_for_execution();
  await ctx.close();
  await browser.close();

  if (errors.length) {
    logger.error(`Stopping ${errors.length} services`);

    const err_ids = errors.map((e) => e.error());

    await database.stop_services(err_ids);
  }

  if (results.length) {
    logger.debug(`Storing ${results.length} results`);

    const split = results.reduce<{
      without_location: Array<ScrapedAuction>;
      with_location: Array<ScrapedAuction>;
    }>(
      (acc, val) => {
        if (val.concelho_id == null) {
          acc.without_location.push(val);
        } else {
          acc.with_location.push(val);
        }

        return acc;
      },
      {
        without_location: [],
        with_location: [],
      },
    );

    logger.debug(`AIing ${split.without_location.length}`);
    const arr: Array<ScrapedAuction> = [];

    const ai_queue = new Queue(5);
    for (let i = 0; i < split.without_location.length; ++i) {
      ai_queue.run(async () => {
        const e = split.without_location[i];

        const attempt_safe = fromAsyncThrowable(attempt_ai);

        const data = await attempt_safe(e);

        if (data.isErr()) {
          return;
        }

        const result = data.value;

        if (result.success) {
          arr.push({
            ...e,
            concelho_id: concelhos[result.municipality ?? ""] ?? null,
          });
        }
      });
    }

    await ai_queue.flush();

    const final = [...split.with_location, ...arr];
    await database.store(final);

    //await database.store(results);
    // const new_ones = await database.store(results);
  }
}

main().catch(console.error);

async function all(services_arr: Array<Schema.Service>, database: Database) {
  const is_in_use = await database.check_is_in_use();

  if (is_in_use) {
    console.log("Scraping in session, exiting");

    return;
  }

  const filtered = services_arr.filter(
    (e): e is Omit<Schema.Service, "name" & { name: keyof typeof SCRAPERS }> =>
      e.use && e.name in SCRAPERS,
  );

  logger.debug(`Starting scraping`);

  for (const service of filtered) {
    logger.info(`About to start scraping ${service.name}`);
    SCRAPERS[service.name]({
      logger,
      service,
    });
  }
  // console.log(filtered.length);
}

async function single(
  services: Record<string, Schema.Service>,
  website: string,
) {
  if (!(website in SCRAPERS)) {
    logger.error(`Key not defined in scrapers. Exiting`);

    return;
  }

  if (!(website in services)) {
    logger.error(`Key not defined in services or service not enabled. Exiting`);

    return;
  }

  const service = services[website];

  const func = SCRAPERS[website];

  logger.info(`Starting scraping on ${service.name}`);

  await func({
    logger,
    service,
  });
}
