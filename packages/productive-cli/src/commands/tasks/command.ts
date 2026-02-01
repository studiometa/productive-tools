/**
 * Tasks command entry point
 */

import { OutputFormatter } from "../../output.js";
import type { OutputFormat } from "../../types.js";
import { createContext, type CommandOptions } from "../../context.js";
import { tasksList, tasksGet } from "./handlers.js";

/**
 * Handle tasks command
 */
export async function handleTasksCommand(
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
      await tasksList(ctx);
      break;
    case "get":
      await tasksGet(args, ctx);
      break;
    default:
      formatter.error(`Unknown tasks subcommand: ${subcommand}`);
      process.exit(1);
  }
}
