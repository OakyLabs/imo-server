import { Queue } from "async-await-queue";
import { type Page, errors } from "playwright";
import { Service } from "../../db/schema";
import { logger, Logger } from "../../src/logger";
import { fromAsyncThrowable, Result } from "neverthrow";
import { get_ctx, get_on_methods, is_property_taken } from "./local-storage";
import { TimeoutErrorV1, UnexpectedErrorV1 } from "../events/errors/unexpected";
import { ParsingApiErrorV1 } from "../events/errors/api-error";
import { tuple } from "../lib/object-keys";
import { RealEstate } from "../../db/real-estate";

const queue = new Queue(3);

export async function wait_for_execution() {
  await queue.flush();
}

type ScrapeCallbackProps<ExtraProps = {}> = {
  page: Page;
  service: Service;
  logger: Logger;
  enqueue_links: Handlers.EnqueueLinks;
  on_pagination: Handlers.OnPagination;
  on_api: Handlers.OnApi;
} & ExtraProps;

type SingleWrapper = (cb: Callback) => ScrapeFunc;

type MultipleWrapper = <
  T extends Record<
    string,
    | string
    | ((page?: number) => string)
    | [url: string, real_estate: RealEstate]
  >
>(
  URLS: T,
  cb: Callback<{ single: [key: keyof T, url: T[keyof T]] }>
) => ScrapeFunc;

type Callback<ExtraProps = {}> = (
  props: ScrapeCallbackProps<ExtraProps>
) => Promise<void>;

export type ScrapeFunc = (
  props: Omit<
    ScrapeCallbackProps,
    "page" | "enqueue_links" | "on_pagination" | "on_api"
  >
) => Promise<void>;

type EnqueueHandlerArgs = {
  link: string;
  service: Service;
  page: Page;
  logger: Logger;
};

export type EnqueueHandler = (props: EnqueueHandlerArgs) => Promise<void>;

namespace Handlers {
  export type EnqueueLinks = (
    args: Enqueue.Args,
    should_wait_network_idle?: boolean
  ) => Promise<void>;

  namespace Enqueue {
    export type Args = {
      link: string;
      service: Service;
      handler: EnqueueHandler;
    };
  }

  export type OnPagination = (
    args: OnPagination.Args,
    handler: OnPagination.Handler
  ) => Promise<void>;

  namespace OnPagination {
    export type Handler = (props: {
      url: string;
      current_page: number;
      service: Service;
      logger: Logger;
      page: Omit<Page, "close">;
    }) => Promise<void>;

    export type Args = {
      pages: number;
      url_func: (page?: number) => string;
      service: Service;
      should_wait_network_idle?: boolean;
    };
  }

  export type OnApi = (
    args: OnApi.Args,
    handler: (data: unknown) => void | Promise<void>
  ) => void;

  namespace OnApi {
    export type Args = {
      url: string;
      service: Service;
    };
  }
}

type UnifiedErrorHandlerProps = {
  service: Service;
  url?: string;
  message: string;
  result: Result<void, unknown>;
};

function unified_error_handler(props: UnifiedErrorHandlerProps) {
  const on = get_on_methods();
  if (props.result.isErr()) {
    logger.error(`Unresolved error on ${props.service.name}`, {
      url: props.url,
      err: props.result.error,
    });

    if (props.result.error instanceof errors.TimeoutError) {
      on.error({
        service: props.service,
        error: new TimeoutErrorV1({
          message: "Timeout error",
          where: props.service.id,
          url: props.url,
        }),
      });

      return;
    }

    on.error({
      error: new UnexpectedErrorV1({
        message: props.message,
        where: props.service.id,
        error: props.result.error,
        url: props.url,
      }),
      service: props.service,
    });

    return;
  }
}

export const scrape_main: SingleWrapper = (cb: Callback) => {
  return async function scrape(props) {
    const ctx = get_ctx();

    await queue.run(async () => {
      const page = await ctx.newPage();
      try {
        const safe_cb = fromAsyncThrowable(cb);

        const result = await safe_cb({
          ...props,
          page,
          enqueue_links,
          on_pagination,
          on_api,
        });

        unified_error_handler({
          message: "Unexpected error",
          result,
          service: props.service,
        });
      } finally {
        await page.close();
      }
    });
  };
};

export const scrape_many: MultipleWrapper = (urls, cb) => {
  return async function (props) {
    const ctx = get_ctx();

    for (const [key, value] of tuple(urls)) {
      queue.run(async () => {
        const page = await ctx.newPage();
        try {
          const safe_cb = fromAsyncThrowable(cb);

          const result = await safe_cb({
            ...props,
            page,
            enqueue_links,
            single: [key, value],
            on_pagination,
            on_api,
          });

          unified_error_handler({
            message: "Unexpected error",
            result,
            service: props.service,
            url: value as string,
          });
        } finally {
          await page.close();
        }
      });
    }
  };
};

const on_pagination: Handlers.OnPagination = async (args, handler) => {
  const ctx = get_ctx();

  for (let i = 1; i <= args.pages; ++i) {
    queue.run(async () => {
      const page = await ctx.newPage();

      try {
        const url = args.url_func(i);
        await page.goto(url);
        if (args.should_wait_network_idle) {
          await page.waitForLoadState("networkidle");
        }

        const safe_cb = fromAsyncThrowable(handler);

        const result = await safe_cb({
          current_page: i,
          url,
          service: args.service,
          logger,
          page,
        });

        unified_error_handler({
          message: "Unexpected pagination error",
          result,
          service: args.service,
          url,
        });
      } finally {
        await page.close();
      }
    });
  }
};

const on_api: Handlers.OnApi = (
  args,
  /**
   * API Call is already handled here
   */
  handler
) => {
  const on = get_on_methods();

  queue.run(async () => {
    const safe_api_call = fromAsyncThrowable(async () => {
      const base_response = await fetch(args.url);

      if (!base_response.ok) {
        on.error({
          error: new ParsingApiErrorV1({
            message: base_response.statusText,
            status_code: base_response.status,
            url: args.url,
            where: args.service.id,
          }),
          service: args.service,
        });

        return;
      }

      const body = await base_response.json();

      await handler(body);
    });

    const result = await safe_api_call();

    unified_error_handler({
      message: "Unexpected API error",
      url: args.url,
      result,
      service: args.service,
    });
  }, 100);
};

const enqueue_links: Handlers.EnqueueLinks = async (
  args,
  should_wait_network_idle
) => {
  const is_property_visited = is_property_taken(args.link);

  if (is_property_visited) {
    logger.info(`Skipping ${args.link} because it has already been visited`);

    return;
  }

  const ctx = get_ctx();

  queue.run(async () => {
    const page = await ctx.newPage();
    try {
      await page.goto(args.link);
      if (should_wait_network_idle) {
        await page.waitForLoadState("networkidle");
      }

      const safe_cb = fromAsyncThrowable(async (props: EnqueueHandlerArgs) => {
        await page.goto(args.link);

        if (should_wait_network_idle) {
          await page.waitForLoadState("networkidle");
        }

        await args.handler(props);
      });

      const result = await safe_cb({ ...args, page: page, logger });

      return unified_error_handler({
        service: args.service,
        url: args.link,
        message: "Unexpected error doing enqueue_links",
        result,
      });
    } finally {
      await page.close();
    }
  });
};
