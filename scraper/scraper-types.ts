import { DbProperty, Service } from "../db/schema";

export type BaseEvent<Tag extends string = string> = {
  version: number;
  tag: Tag;
  name: string;
  prepare_store(): string;
  message: string;
  error(): Service["id"];
};

type OnErrorProps = {
  error: BaseEvent;
  service: Service;
};

export type ScrapedData = Pick<
  DbProperty,
  "concelho_id" | "price" | "style_lookup_id" | "url" | "title"
> & {
  description?: string | null;
};

export type ScrapedAuction = ScrapedData & {
  service_id: number;
  description: string | null;
};

export type OnMethods = {
  error: (props: OnErrorProps) => void;
  property: (props: ScrapedData, service: Service) => void;
};

export type ScrapingError<Tag extends string = string> = BaseEvent<Tag> & {
  html?: string;
  url: string;
};
