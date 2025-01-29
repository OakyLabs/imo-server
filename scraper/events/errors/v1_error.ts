import { err, ok, Result } from "neverthrow";
import { Service } from "../../../db/schema";
import { BaseEvent } from "../../scraper-types";

export type ErrorCaseV1 = BaseEvent<"ERROR">;

export class ErrorV1 implements ErrorCaseV1 {
  readonly version = 1;
  readonly tag = "ERROR";
  readonly message: string;
  readonly stack: string = "";
  readonly name = "ErrorV1" as const;
  readonly #service_id: Service["id"];

  constructor(message: string, stack = "", where: Service["id"]) {
    this.message = message;
    this.stack = stack;
    this.#service_id = where;
  }

  error(): Service["id"] {
    return this.#service_id;
  }

  decode(evt: unknown): Result<ErrorV1, string> {
    if (!evt) {
      return err("No evt passed");
    }

    if (typeof evt !== "object") {
      return err("Not an object");
    }

    if (!("tag" in evt)) {
      return err("Not an error case");
    }
    if (evt.tag !== this.tag) {
      return err("Not this error case");
    }

    if (!("version" in evt)) {
      return err("No version defined");
    }

    let msg = "";
    if (!("message" in evt)) {
      msg = "No message passed";
    } else {
      msg = evt.message as string;
    }

    let stack = "";
    if ("stack" in evt) {
      stack = evt.stack as string;
    }

    return ok(new ErrorV1(msg, stack, 69));
  }

  prepare_store(): string {
    return JSON.stringify({
      version: this.version,
      tag: this.tag,
      message: this.message,
    });
  }
}

export function isV1Error(evt: unknown): evt is ErrorCaseV1 {
  if (!evt) {
    return false;
  }

  if (typeof evt !== "object") {
    return false;
  }

  if (!("version" in evt)) {
    return false;
  }

  if (!("tag" in evt)) {
    return false;
  }

  if (evt.tag !== "ERROR") {
    return false;
  }

  if (evt.version !== 1) {
    return false;
  }

  return true;
}
