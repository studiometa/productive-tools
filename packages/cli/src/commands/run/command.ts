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
import { scriptList } from './list.js';

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

  // --list discovers scripts in a directory without running any.
  //
  // Two sources to check:
  //   1. `options.list` — set by the global CLI arg parser when the flag is
  //      encountered before any positional (e.g. `productive run --list ./dir`
  //      is parsed as options.list = './dir' or options.list = true)
  //   2. `allArgs` — raw forwarded args for the unusual case where --list
  //      appears after a positional (e.g. `productive run ./script --list`)
  if ('list' in options || allArgs.includes('--list')) {
    const dir =
      typeof options.list === 'string'
        ? options.list
        : (() => {
            const listIndex = allArgs.indexOf('--list');
            const next = allArgs[listIndex + 1];
            return next && !next.startsWith('-') ? next : undefined;
          })();
    await scriptList(dir);
    return;
  }

  await scriptRun(allArgs, ctx);
}
