import assert from "node:assert";
import { AsyncLocalStorage } from "node:async_hooks";
import type { BrowserContext } from "playwright";
import { OnMethods } from "../scraper-types";

export const async_storage = new AsyncLocalStorage<{
  ctx: BrowserContext;
  on: OnMethods;
  concelhos: Record<string, number>;
  property_urls: Set<string>;
}>();

function get_store() {
  const store = async_storage.getStore();

  assert(store, "Store must be wrapped in a async storage");

  return store;
}

export function get_ctx() {
  const store = get_store();

  return store.ctx;
}

export function get_on_methods() {
  const store = get_store();

  return store.on;
}

export function get_concelhos() {
  const store = get_store();

  return store.concelhos;
}

export function is_property_taken(url: string) {
  const store = get_store();

  const set = store.property_urls;

  return set.has(url);
}
