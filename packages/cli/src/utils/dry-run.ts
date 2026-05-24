/**
 * Dry-run utilities for CLI commands
 *
 * When --dry-run is passed, validate all inputs normally but skip the API call
 * and instead show what would happen.
 */

import type { CommandContext } from '../context.js';
import type { OutputFormat } from '../types.js';

import { colors } from './colors.js';

export interface DryRunInfo {
  action: string;
  resource: string;
  resourceId?: string;
  payload?: Record<string, unknown>;
  description?: string;
}

/**
 * Check if dry-run mode is enabled
 */
export function isDryRun(ctx: CommandContext): boolean {
  return ctx.options['dry-run'] === true;
}

/**
 * Handle dry-run output - show what would happen without making changes
 */
export function handleDryRunOutput(
  info: DryRunInfo,
  ctx: CommandContext,
  spinner: { succeed: () => void; fail: () => void },
): void {
  spinner.succeed();

  const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;

  if (format === 'json') {
    ctx.formatter.output({
      dry_run: true,
      action: info.action,
      resource: info.resource,
      resource_id: info.resourceId,
      payload: info.payload || {},
    });
  } else {
    const actionText = getActionText(info.action);
    console.log(colors.yellow('DRY RUN MODE'));
    console.log();

    if (info.resourceId) {
      console.log(colors.cyan('Action:'), `${actionText} ${info.resource} ${info.resourceId}`);
    } else {
      console.log(colors.cyan('Action:'), `${actionText} ${info.resource}`);
    }

    if (info.payload && Object.keys(info.payload).length > 0) {
      console.log(colors.cyan('Payload:'), JSON.stringify(info.payload, null, 2));
    }

    if (info.description) {
      console.log(colors.cyan('Description:'), info.description);
    }

    console.log();
    console.log(colors.gray('No changes made.'));
  }
}

/**
 * Get human-readable action text
 */
function getActionText(action: string): string {
  switch (action) {
    case 'create':
      return 'Create';
    case 'update':
      return 'Update';
    case 'delete':
      return 'Delete';
    case 'start':
      return 'Start';
    case 'stop':
      return 'Stop';
    case 'resolve':
      return 'Resolve';
    case 'reopen':
      return 'Reopen';
    default:
      return action.charAt(0).toUpperCase() + action.slice(1);
  }
}
