import { typeFlag } from "type-flag";

const parsed_flags = typeFlag({
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

export function is_headless_request() {
  return parsed_flags.flags.headless;
}

export function is_all_request() {
  return parsed_flags.flags.all;
}
