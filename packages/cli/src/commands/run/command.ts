/**
 * `productive run` command entry point.
 *
 * Unlike other commands, `run` does not use `createCommandRouter` because it
 * forwards all positional arguments — including the script path — directly to
 * the handler rather than treating the first positional as a subcommand.
 */

import type { CommandOptions } from '../../context.js';

import { createContext } from '../../context.js';
import { scriptRun } from './handlers.js';

/**
 * Handle the `productive run` (and `productive script`) command.
 *
 * @param _subcommand - Ignored; the script path is taken from `positional`.
 * @param positional  - [scriptPath, ...scriptArgs]
 * @param options     - Global CLI options (auth, format, etc.)
 */
export async function handleRunCommand(
  _subcommand: string | undefined,
  positional: string[],
  options: Record<string, string | boolean | string[]>,
): Promise<void> {
  const ctx = createContext(options as CommandOptions);

  // If called as `productive run list.ts`, the subcommand IS the script path.
  // Merge subcommand back into positional if it looks like a file.
  const allArgs = _subcommand ? [_subcommand, ...positional] : positional;

  await scriptRun(allArgs, ctx);
}
