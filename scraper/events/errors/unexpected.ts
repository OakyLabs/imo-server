import { RealEstate } from "../../../db/real-estate";
import { Service } from "../../../db/schema";
import { BaseEvent } from "../../scraper-types";

export type IParsingApiErrorV1 = BaseEvent<"UNEXPECTED_ERROR">;

type ParsingApiErrorProps = {
  where: Service["id"];
  message: string;
  error: unknown;
  url?: string;
};

export type ITimeoutErrorV1 = BaseEvent<"TIMEOUT_ERROR">;

type TimeoutErrorProps = {
  where: Service["id"];
  message: string;
  url?:
    | string
    | ((page?: number) => string)
    | [url: string, real_estate: RealEstate];
  key?: string;
};

export class TimeoutErrorV1 implements ITimeoutErrorV1 {
  readonly version = 1;
  readonly tag = "TIMEOUT_ERROR";
  readonly name = "TimeoutErrorV1" as const;
  readonly url?:
    | string
    | ((page?: number) => string)
    | [url: string, real_estate: RealEstate];
  readonly #service_id: Service["id"];
  readonly key?: string;
  readonly message: string;

  constructor(props: TimeoutErrorProps) {
    this.#service_id = props.where;
    this.url = props.url;
    this.message = props.message;
    this.key = props.key;
  }

  prepare_store() {
    return JSON.stringify({
      version: this.version,
      tag: this.tag,
      message: this.message,
      url: this.url,
    });
  }

  error() {
    return this.#service_id;
  }
}

export class UnexpectedErrorV1 implements IParsingApiErrorV1 {
  readonly version = 1;
  readonly tag = "UNEXPECTED_ERROR";
  readonly name = "UnexpectedErrorV1" as const;
  readonly message: string;
  readonly #service_id: Service["id"];
  readonly more_info?: string;
  readonly url?: string;

  constructor(props: ParsingApiErrorProps) {
    let message = props.message;

    if (props.error instanceof Error) {
      message += props.error.message;
    }

    this.message = message;
    this.#service_id = props.where;
    this.url = props.url;
  }

  prepare_store(): string {
    return JSON.stringify({
      version: this.version,
      tag: this.tag,
      message: this.message,
      more_info: this.more_info,
      url: this.url,
    });
  }

  error(): Service["id"] {
    return this.#service_id;
  }
}
