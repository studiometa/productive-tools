/**
 * Resolve command entry point
 *
 * Handles command routing and dispatches to appropriate handlers.
 */

import type { CommandContext, CommandOptions } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { createContext } from '../../context.js';
import { OutputFormatter } from '../../output.js';
import { resolveIdentifier, detectType } from './handlers.js';

/**
 * Options for dependency injection in resolve command
 */
export interface ResolveCommandDeps {
  contextFactory?: (options: CommandOptions) => CommandContext;
  resolveIdentifier?: typeof resolveIdentifier;
  detectType?: typeof detectType;
}

/**
 * Handle resolve command
 */
export async function handleResolveCommand(
  subcommand: string | undefined,
  args: string[],
  options: Record<string, string | boolean | string[]>,
  deps: ResolveCommandDeps = {},
): Promise<void> {
  const format = (options.format || options.f || 'human') as OutputFormat;
  const formatter = new OutputFormatter(format, options['no-color'] === true);

  const createCtx = deps.contextFactory ?? createContext;
  const ctx = createCtx(options as CommandOptions);

  const resolveFn = deps.resolveIdentifier ?? resolveIdentifier;
  const detectFn = deps.detectType ?? detectType;

  // Handle subcommands
  if (subcommand === 'detect') {
    await detectFn(args, ctx);
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

  await resolveFn(query, ctx);
}
