/**
 * Deals command entry point
 */

import type { OutputFormat } from '../../types.js';

import { createContext, type CommandOptions } from '../../context.js';
import { OutputFormatter } from '../../output.js';
import { dealsList, dealsGet, dealsAdd, dealsUpdate } from './handlers.js';

/**
 * Handle deals command
 */
export async function handleDealsCommand(
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
      await dealsList(ctx);
      break;
    case 'get':
      await dealsGet(args, ctx);
      break;
    case 'add':
    case 'create':
      await dealsAdd(ctx);
      break;
    case 'update':
      await dealsUpdate(args, ctx);
      break;
    default:
      formatter.error(`Unknown deals subcommand: ${subcommand}`);
      process.exit(1);
  }
}
