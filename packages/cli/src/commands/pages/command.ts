/**
 * Pages command entry point
 */

import type { OutputFormat } from '../../types.js';

import { createContext, type CommandOptions } from '../../context.js';
import { OutputFormatter } from '../../output.js';
import { pagesList, pagesGet, pagesAdd, pagesUpdate, pagesDelete } from './handlers.js';

/**
 * Handle pages command
 */
export async function handlePagesCommand(
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
      await pagesList(ctx);
      break;
    case 'get':
      await pagesGet(args, ctx);
      break;
    case 'add':
    case 'create':
      await pagesAdd(ctx);
      break;
    case 'update':
      await pagesUpdate(args, ctx);
      break;
    case 'delete':
    case 'rm':
      await pagesDelete(args, ctx);
      break;
    default:
      formatter.error(`Unknown pages subcommand: ${subcommand}`);
      process.exit(1);
  }
}
