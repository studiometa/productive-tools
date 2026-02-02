/**
 * Timers command entry point
 */

import { OutputFormatter } from "../../output.js";
import type { OutputFormat } from "../../types.js";
import { createContext, type CommandOptions } from "../../context.js";
import { timersList, timersGet, timersStart, timersStop } from "./handlers.js";

/**
 * Handle timers command
 */
export async function handleTimersCommand(
  subcommand: string,
  args: string[],
  options: Record<string, string | boolean>,
): Promise<void> {
  const format = (options.format || options.f || "human") as OutputFormat;
  const formatter = new OutputFormatter(format, options["no-color"] === true);

  const ctx = createContext(options as CommandOptions);

  switch (subcommand) {
    case "list":
    case "ls":
      await timersList(ctx);
      break;
    case "get":
      await timersGet(args, ctx);
      break;
    case "start":
      await timersStart(ctx);
      break;
    case "stop":
      await timersStop(args, ctx);
      break;
    default:
      formatter.error(`Unknown timers subcommand: ${subcommand}`);
      process.exit(1);
  }
}
