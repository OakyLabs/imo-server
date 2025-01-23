import pc from "picocolors";

export type Logger = Record<
  "info" | "error" | "warn" | "debug",
  (msg: string, metadata?: Record<string, unknown>) => void
>;

export const logger: Logger = {
  info(msg, metadata) {
    const initial_string = pc.bgGreen(` INFO: `);
    const rest_of_string = pc.green(" " + msg);
    const obj = metadata ? " " + pc.green(JSON.stringify(metadata)) : "";

    console.log(initial_string + rest_of_string + obj);
  },
  error(msg, metadata) {
    const initial_string = pc.bgRed(` ERROR: `);
    const rest_of_string = pc.red(" " + msg);
    const obj = metadata ? " " + pc.red(JSON.stringify(metadata)) : "";

    console.log(initial_string + rest_of_string + obj);
  },
  warn(msg, metadata) {
    const initial_string = pc.bgYellow(` WARN: `);
    const rest_of_string = pc.yellow(" " + msg);
    const obj = metadata ? " " + pc.yellow(JSON.stringify(metadata)) : "";

    console.log(initial_string + rest_of_string + obj);
  },
  debug(msg, metadata) {
    const initial_string = pc.bgBlue(` DEBUG: `);
    const rest_of_string = pc.blue(" " + msg);
    const obj = metadata ? " " + pc.blue(JSON.stringify(metadata)) : "";

    console.log(initial_string + rest_of_string + obj);
  },
};
