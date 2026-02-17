/**
 * Discussions command entry point
 */

import type { OutputFormat } from '../../types.js';

import { createContext, type CommandOptions } from '../../context.js';
import { OutputFormatter } from '../../output.js';
import {
  discussionsList,
  discussionsGet,
  discussionsAdd,
  discussionsUpdate,
  discussionsDelete,
  discussionsResolve,
  discussionsReopen,
} from './handlers.js';

/**
 * Handle discussions command
 */
export async function handleDiscussionsCommand(
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
      await discussionsList(ctx);
      break;
    case 'get':
      await discussionsGet(args, ctx);
      break;
    case 'add':
    case 'create':
      await discussionsAdd(ctx);
      break;
    case 'update':
      await discussionsUpdate(args, ctx);
      break;
    case 'delete':
    case 'rm':
      await discussionsDelete(args, ctx);
      break;
    case 'resolve':
      await discussionsResolve(args, ctx);
      break;
    case 'reopen':
      await discussionsReopen(args, ctx);
      break;
    default:
      formatter.error(`Unknown discussions subcommand: ${subcommand}`);
      process.exit(1);
  }
}
