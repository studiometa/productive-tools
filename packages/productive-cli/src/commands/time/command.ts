/**
 * Time command entry point
 *
 * Handles command routing and dispatches to appropriate handlers.
 */

import type { OutputFormat } from '../../types.js';

import { createContext, type CommandOptions } from '../../context.js';
import { OutputFormatter } from '../../output.js';
import { timeList, timeGet, timeAdd, timeUpdate, timeDelete } from './handlers.js';

/**
 * Handle time command
 */
export async function handleTimeCommand(
  subcommand: string,
  args: string[],
  options: Record<string, string | boolean>,
): Promise<void> {
  const format = (options.format || options.f || 'human') as OutputFormat;
  const formatter = new OutputFormatter(format, options['no-color'] === true);

  const ctx = createContext(options as CommandOptions);

  switch (subcommand) {
    case 'list':
    case 'ls':
      await timeList(ctx);
      break;
    case 'get':
      await timeGet(args, ctx);
      break;
    case 'add':
      await timeAdd(ctx);
      break;
    case 'update':
      await timeUpdate(args, ctx);
      break;
    case 'delete':
    case 'rm':
      await timeDelete(args, ctx);
      break;
    default:
      formatter.error(`Unknown time subcommand: ${subcommand}`);
      process.exit(1);
  }
}
