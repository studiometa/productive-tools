/**
 * Projects command entry point
 *
 * Handles command routing and dispatches to appropriate handlers.
 */

import { OutputFormatter } from '../../output.js';
import type { OutputFormat } from '../../types.js';
import { createContext, type CommandOptions } from '../../context.js';
import { projectsList, projectsGet } from './handlers.js';

/**
 * Handle projects command
 */
export async function handleProjectsCommand(
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
      await projectsList(ctx);
      break;
    case 'get':
      await projectsGet(args, ctx);
      break;
    default:
      formatter.error(`Unknown projects subcommand: ${subcommand}`);
      process.exit(1);
  }
}
