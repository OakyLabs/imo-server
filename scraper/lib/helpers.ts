import { URL } from "node:url";
import { ElementHandle } from "playwright";

export function resolve_url(from: string, to: string): string {
  return new URL(to, from).href;
}

export async function get_text(el: ElementHandle): Promise<string | null> {
  return await el.textContent().then((e) => e?.trim() ?? null);
}
