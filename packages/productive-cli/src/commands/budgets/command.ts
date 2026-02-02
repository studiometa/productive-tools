/**
 * Budgets command entry point
 */

import type { OutputFormat } from '../../types.js';

import { createContext, type CommandOptions } from '../../context.js';
import { OutputFormatter } from '../../output.js';
import { budgetsList } from './handlers.js';

/**
 * Handle budgets command
 */
export async function handleBudgetsCommand(
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
      await budgetsList(ctx);
      break;
    default:
      formatter.error(`Unknown budgets subcommand: ${subcommand}`);
      process.exit(1);
  }
}
