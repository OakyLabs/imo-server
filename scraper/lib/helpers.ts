import { URL } from "node:url";

export function resolve_url(from: string, to: string): string {
  return new URL(to, from).href;
}
