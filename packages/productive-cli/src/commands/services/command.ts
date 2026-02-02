/**
 * Services command entry point
 */

import type { OutputFormat } from '../../types.js';

import { createContext, type CommandOptions } from '../../context.js';
import { OutputFormatter } from '../../output.js';
import { servicesList } from './handlers.js';

/**
 * Handle services command
 */
export async function handleServicesCommand(
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
      await servicesList(ctx);
      break;
    default:
      formatter.error(`Unknown services subcommand: ${subcommand}`);
      process.exit(1);
  }
}
