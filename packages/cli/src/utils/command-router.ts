/**
 * Generic command router factory for CLI commands.
 *
 * Eliminates boilerplate switch/case pattern in command routing.
 *
 * @example
 * ```typescript
 * import { createCommandRouter } from '../../utils/command-router.js';
 * import { tasksList, tasksGet, tasksAdd, tasksUpdate } from './handlers.js';
 *
 * export const handleTasksCommand = createCommandRouter({
 *   resource: 'tasks',
 *   handlers: {
 *     list: tasksList,
 *     ls: tasksList,           // alias
 *     get: [tasksGet, 'args'], // handler that receives args
 *     add: tasksAdd,
 *     create: tasksAdd,        // alias
 *     update: [tasksUpdate, 'args'],
 *   },
 * });
 * ```
 */

import type { CommandContext, CommandOptions } from '../context.js';
import type { OutputFormat } from '../types.js';

import { createContext } from '../context.js';
import { OutputFormatter } from '../output.js';

/**
 * Handler that only receives context (e.g., list commands)
 */
export type ListHandler = (ctx: CommandContext) => Promise<void>;

/**
 * Handler that receives args and context (e.g., get/update commands)
 */
export type ArgsHandler = (args: string[], ctx: CommandContext) => Promise<void>;

/**
 * Handler definition - either a ListHandler or an ArgsHandler marked with 'args'
 */
export type Handler = ListHandler | [ArgsHandler, 'args'];

/**
 * Configuration for the command router
 */
export interface CommandRouterConfig {
  /** Resource name for error messages (e.g., 'tasks', 'projects') */
  resource: string;
  /** Map of subcommand names to handlers */
  handlers: Record<string, Handler>;
}

/**
 * Creates a command router function that dispatches to the appropriate handler.
 *
 * This factory eliminates the repetitive switch/case pattern found in all
 * command.ts files, centralizing the routing logic.
 *
 * @param config - Router configuration with resource name and handlers
 * @returns Async function that routes subcommands to handlers
 */
export function createCommandRouter(config: CommandRouterConfig) {
  return async function (
    subcommand: string,
    args: string[],
    options: Record<string, string | boolean>,
  ): Promise<void> {
    const format = (options.format || options.f || 'human') as OutputFormat;
    const formatter = new OutputFormatter(format, options['no-color'] === true);

    const ctx = createContext(options as CommandOptions);

    const handler = config.handlers[subcommand];
    if (!handler) {
      formatter.error(`Unknown ${config.resource} subcommand: ${subcommand}`);
      process.exit(1);
      return; // Unreachable in production, but needed for tests where process.exit is mocked
    }

    if (Array.isArray(handler)) {
      // ArgsHandler - receives args and context
      await handler[0](args, ctx);
    } else {
      // ListHandler - receives only context
      await handler(ctx);
    }
  };
}
