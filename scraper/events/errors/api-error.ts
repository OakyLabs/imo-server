import { Service } from "../../../db/schema";
import { ScrapingError } from "../../scraper-types";

export type IParsingAPIErrorV1 = ScrapingError<"PARSING_API_ERROR">;

type ParsingErrorProps = {
  url: string;
  where: Service["id"];
  message: string;
  status_code: number;
};

export class ParsingApiErrorV1 implements IParsingAPIErrorV1 {
  readonly version = 1;
  readonly tag = "PARSING_API_ERROR";
  #service_id: Service["id"];
  name = "ParsingErrorV1" as const;
  readonly url: string;
  readonly message: string;
  readonly #status_code: number;

  constructor(props: ParsingErrorProps) {
    this.url = props.url;
    this.#service_id = props.where;
    this.message = props.message;
    this.#status_code = props.status_code;
  }

  error(): Service["id"] {
    return this.#service_id;
  }

  prepare_store(): string {
    const obj: Record<string, unknown> = {
      version: this.version,
      tag: this.tag,
      url: this.url,
      message: this.message,
      status_code: this.#status_code,
    };

    return JSON.stringify(obj);
  }
}
