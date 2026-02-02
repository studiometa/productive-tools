/**
 * Bookings command entry point
 */

import { OutputFormatter } from "../../output.js";
import type { OutputFormat } from "../../types.js";
import { createContext, type CommandOptions } from "../../context.js";
import { bookingsList, bookingsGet, bookingsAdd, bookingsUpdate } from "./handlers.js";

/**
 * Handle bookings command
 */
export async function handleBookingsCommand(
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
      await bookingsList(ctx);
      break;
    case "get":
      await bookingsGet(args, ctx);
      break;
    case "add":
    case "create":
      await bookingsAdd(ctx);
      break;
    case "update":
      await bookingsUpdate(args, ctx);
      break;
    default:
      formatter.error(`Unknown bookings subcommand: ${subcommand}`);
      process.exit(1);
  }
}
