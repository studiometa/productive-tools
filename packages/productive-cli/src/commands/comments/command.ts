/**
 * Comments command entry point
 */

import { OutputFormatter } from "../../output.js";
import type { OutputFormat } from "../../types.js";
import { createContext, type CommandOptions } from "../../context.js";
import { commentsList, commentsGet, commentsAdd, commentsUpdate } from "./handlers.js";

/**
 * Handle comments command
 */
export async function handleCommentsCommand(
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
      await commentsList(ctx);
      break;
    case "get":
      await commentsGet(args, ctx);
      break;
    case "add":
    case "create":
      await commentsAdd(ctx);
      break;
    case "update":
      await commentsUpdate(args, ctx);
      break;
    default:
      formatter.error(`Unknown comments subcommand: ${subcommand}`);
      process.exit(1);
  }
}
