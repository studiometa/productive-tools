/**
 * Tasks command entry point
 */

import type { OutputFormat } from '../../types.js';

import { createContext, type CommandOptions } from '../../context.js';
import { OutputFormatter } from '../../output.js';
import { tasksList, tasksGet, tasksAdd, tasksUpdate } from './handlers.js';

/**
 * Handle tasks command
 */
export async function handleTasksCommand(
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
      await tasksList(ctx);
      break;
    case 'get':
      await tasksGet(args, ctx);
      break;
    case 'add':
    case 'create':
      await tasksAdd(ctx);
      break;
    case 'update':
      await tasksUpdate(args, ctx);
      break;
    default:
      formatter.error(`Unknown tasks subcommand: ${subcommand}`);
      process.exit(1);
  }
}
