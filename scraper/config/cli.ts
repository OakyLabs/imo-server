import { parse } from "path";
import { typeFlag } from "type-flag";

export const parsed_flags = typeFlag({
  headless: {
    type: Boolean,
    default: () => false,
  },
  all: {
    type: Boolean,
    default: () => false,
    alias: "a",
  },
});
