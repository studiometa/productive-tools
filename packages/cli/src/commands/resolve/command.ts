/**
 * Resolve command entry point
 *
 * Handles command routing and dispatches to appropriate handlers.
 */

import type { OutputFormat } from '../../types.js';

import { createContext, type CommandOptions } from '../../context.js';
import { OutputFormatter } from '../../output.js';
import { resolveIdentifier, detectType } from './handlers.js';

/**
 * Handle resolve command
 */
export async function handleResolveCommand(
  subcommand: string | undefined,
  args: string[],
  options: Record<string, string | boolean | string[]>,
): Promise<void> {
  const format = (options.format || options.f || 'human') as OutputFormat;
  const formatter = new OutputFormatter(format, options['no-color'] === true);

  const ctx = createContext(options as CommandOptions);

  // Handle subcommands
  if (subcommand === 'detect') {
    await detectType(args, ctx);
    return;
  }

  // If subcommand is actually the query (no subcommand)
  const query = subcommand ? [subcommand, ...args] : args;

  if (query.length === 0) {
    formatter.error('Query argument is required');
    formatter.info('Usage: productive resolve <query> [options]');
    formatter.info('Run "productive resolve --help" for more information');
    process.exit(1);
  }

  await resolveIdentifier(query, ctx);
}
