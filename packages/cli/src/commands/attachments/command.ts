/**
 * Attachments command entry point
 */

import type { OutputFormat } from '../../types.js';

import { createContext, type CommandOptions } from '../../context.js';
import { OutputFormatter } from '../../output.js';
import { attachmentsList, attachmentsGet, attachmentsDelete } from './handlers.js';

/**
 * Handle attachments command
 */
export async function handleAttachmentsCommand(
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
      await attachmentsList(ctx);
      break;
    case 'get':
      await attachmentsGet(args, ctx);
      break;
    case 'delete':
    case 'rm':
      await attachmentsDelete(args, ctx);
      break;
    default:
      formatter.error(`Unknown attachments subcommand: ${subcommand}`);
      process.exit(1);
  }
}
