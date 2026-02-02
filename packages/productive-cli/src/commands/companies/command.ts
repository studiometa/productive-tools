/**
 * Companies command entry point
 */

import type { OutputFormat } from '../../types.js';

import { createContext, type CommandOptions } from '../../context.js';
import { OutputFormatter } from '../../output.js';
import { companiesList, companiesGet, companiesAdd, companiesUpdate } from './handlers.js';

/**
 * Handle companies command
 */
export async function handleCompaniesCommand(
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
      await companiesList(ctx);
      break;
    case 'get':
      await companiesGet(args, ctx);
      break;
    case 'add':
    case 'create':
      await companiesAdd(ctx);
      break;
    case 'update':
      await companiesUpdate(args, ctx);
      break;
    default:
      formatter.error(`Unknown companies subcommand: ${subcommand}`);
      process.exit(1);
  }
}
