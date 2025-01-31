import { URL } from "node:url";
import { ElementHandle, Locator } from "playwright";

export function resolve_url(from: string, to: string): string {
  return new URL(to, from).href;
}

export async function get_text(
  el: ElementHandle | Locator,
): Promise<string | null> {
  return await el.textContent().then((e) => e?.trim() ?? null);
}
