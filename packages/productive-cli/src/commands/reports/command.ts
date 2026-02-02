/**
 * Reports command entry point
 */

import type { OutputFormat } from '../../types.js';

import { createContext, type CommandOptions } from '../../context.js';
import { OutputFormatter } from '../../output.js';
import { reportsTime, reportsProject, reportsBudget, reportsPerson } from './handlers.js';

/**
 * Handle reports command
 */
export async function handleReportsCommand(
  subcommand: string,
  args: string[],
  options: Record<string, string | boolean>,
): Promise<void> {
  const format = (options.format || options.f || 'human') as OutputFormat;
  const formatter = new OutputFormatter(format, options['no-color'] === true);

  const ctx = createContext(options as CommandOptions);

  switch (subcommand) {
    case 'time':
      await reportsTime(ctx);
      break;
    case 'project':
    case 'projects':
      await reportsProject(ctx);
      break;
    case 'budget':
    case 'budgets':
      await reportsBudget(ctx);
      break;
    case 'person':
    case 'people':
      await reportsPerson(ctx);
      break;
    default:
      formatter.error(`Unknown reports subcommand: ${subcommand}`);
      console.log('Available report types: time, project, budget, person');
      process.exit(1);
  }
}
