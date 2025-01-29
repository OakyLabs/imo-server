import { Service } from "../../../db/schema";
import { ScrapingError } from "../../scraper-types";

export type IParsingErrorV1 = ScrapingError<"PARSING_ERROR">;

type ParsingErrorProps = {
  html: string;
  url: string;
  where: Service["id"];
  message: string;
  more_info?: string;
};

export class ParsingErrorV1 implements IParsingErrorV1 {
  readonly version = 1;
  readonly tag = "PARSING_ERROR";
  #service_id: Service["id"];
  name = "ParsingErrorV1" as const;
  readonly url: string;
  readonly html: string;
  readonly message: string;
  readonly more_info?: string;

  constructor(props: ParsingErrorProps) {
    this.html = props.html;
    this.url = props.url;
    this.#service_id = props.where;
    this.message = props.message;
    this.more_info = props.more_info;
  }

  error(): Service["id"] {
    console.log("Being called");
    return this.#service_id;
  }

  prepare_store(with_html = false): string {
    const obj: Record<string, unknown> = {
      version: this.version,
      tag: this.tag,
      // html: this.html,
      url: this.url,
      message: this.message,
      more_info: this.more_info,
    };

    if (with_html) {
      obj.html = this.html;
    }

    return JSON.stringify(obj);
  }
}

export namespace common_parsing_errors {
  type NoHrefProps = Omit<ParsingErrorProps, "message">;
  export function no_href({ html, url, where, more_info }: NoHrefProps) {
    return new ParsingErrorV1({
      html,
      url,
      where,
      more_info,
      message: "No Href found. Structure might have changed",
    });
  }

  export function no_title({
    html,
    url,
    where,
    more_info,
  }: Omit<ParsingErrorProps, "message">) {
    return new ParsingErrorV1({
      html,
      message: "No title found. Perhaps the strucutre has changed?",
      url,
      where,
      more_info,
    });
  }
}
