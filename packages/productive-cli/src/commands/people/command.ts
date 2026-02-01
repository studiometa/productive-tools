/**
 * People command entry point
 */

import { OutputFormatter } from '../../output.js';
import type { OutputFormat } from '../../types.js';
import { createContext, type CommandOptions } from '../../context.js';
import { peopleList, peopleGet } from './handlers.js';

/**
 * Handle people command
 */
export async function handlePeopleCommand(
  subcommand: string,
  args: string[],
  options: Record<string, string | boolean>
): Promise<void> {
  const format = (options.format || options.f || 'human') as OutputFormat;
  const formatter = new OutputFormatter(format, options['no-color'] === true);

  const ctx = createContext(options as CommandOptions);

  switch (subcommand) {
    case 'list':
    case 'ls':
      await peopleList(ctx);
      break;
    case 'get':
      await peopleGet(args, ctx);
      break;
    default:
      formatter.error(`Unknown people subcommand: ${subcommand}`);
      process.exit(1);
  }
}
