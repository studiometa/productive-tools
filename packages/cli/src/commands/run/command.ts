/**
 * `productive run` command entry point.
 *
 * Argument contract:
 *
 *   productive run [run-options] <script> [run-options] -- [script args...]
 *
 * Everything BEFORE the `--` separator configures `run` itself (the script
 * path plus credentials, `--dry-run`, `--list`, `--format`, `--help`,
 * `--version`). Everything AFTER `--` is forwarded to the script verbatim and
 * parsed inside the script into `args` (positionals) and `flags` (named).
 *
 * The explicit `--` boundary makes forwarding predictable: the global CLI arg
 * parser can keep owning the run-options without ever swallowing a flag the
 * script meant to receive, and a script's flags can never collide with `run`'s.
 */

import type { CommandOptions } from '../../context.js';
import type { OptionValue } from '../../utils/args.js';

import { createContext } from '../../context.js';
import { scriptRun } from './handlers.js';
import { scriptList } from './list.js';

/**
 * A runnable script file: `.js`, `.mjs`, `.cjs`, `.jsx`, `.ts`, `.mts`,
 * `.cts`, or `.tsx` (case-insensitive). Used to locate the script path among
 * the run-options. Run-option values (`json`, an org ID, a base URL, …) never
 * match, so they are not mistaken for the script.
 */
const SCRIPT_FILE = /\.[cm]?[jt]sx?$/i;

/** The pieces of a `productive run` invocation recovered from a raw argv. */
export interface RunArgs {
  /** Run-option tokens (everything before `--`); parsed for credentials, `--dry-run`, `--list`, … */
  cliArgs: string[];
  /** The script path — the first JS/TS file token before `--`, or undefined. */
  scriptPath: string | undefined;
  /** Tokens after `--`, forwarded to the script verbatim. */
  scriptArgs: string[];
}

/**
 * Split a raw argv (`process.argv.slice(2)`) into the run-options, the script
 * path, and the script args to forward.
 *
 * The `--` separator divides run-options (left) from script args (right). The
 * script path is the first JS/TS file token on the left, so the run-options may
 * appear in any order around it.
 *
 * @example
 * ```ts
 * extractRunArgs(['run', './report.mjs', '--dry-run', '--', '--from', 'x'])
 * // → { cliArgs: ['./report.mjs', '--dry-run'], scriptPath: './report.mjs', scriptArgs: ['--from', 'x'] }
 *
 * extractRunArgs(['run', '--list'])
 * // → { cliArgs: ['--list'], scriptPath: undefined, scriptArgs: [] }
 * ```
 */
export function extractRunArgs(argv: string[]): RunArgs {
  // Locate the `run` / `script` command token; consider only what follows it.
  const commandIndex = argv.findIndex((arg) => arg === 'run' || arg === 'script');
  const post = commandIndex === -1 ? argv : argv.slice(commandIndex + 1);

  // Everything after the first `--` is forwarded to the script untouched.
  const separatorIndex = post.indexOf('--');
  const cliArgs = separatorIndex === -1 ? post : post.slice(0, separatorIndex);
  const scriptArgs = separatorIndex === -1 ? [] : post.slice(separatorIndex + 1);

  const scriptPath = cliArgs.find((arg) => SCRIPT_FILE.test(arg));

  return { cliArgs, scriptPath, scriptArgs };
}

/**
 * Handle the `productive run` (and `productive script`) command.
 *
 * @param scriptPath - The script path resolved by {@link extractRunArgs}
 * @param scriptArgs - Args after `--`, forwarded to the script verbatim
 * @param options    - Run-options parsed from the flags before `--`
 *                     (credentials, format, `--dry-run`, `--list`)
 */
export async function handleRunCommand(
  scriptPath: string | undefined,
  scriptArgs: string[],
  options: Record<string, OptionValue>,
): Promise<void> {
  // --list discovers scripts in a directory without running any. It needs no
  // API client or credentials, so handle it before building a context.
  if ('list' in options) {
    const dir = typeof options.list === 'string' ? options.list : undefined;
    await scriptList(dir);
    return;
  }

  const ctx = createContext(options as CommandOptions);

  // --dry-run is a run-option; pass it through explicitly rather than smuggling
  // it back into the script's arg list.
  const dryRun = 'dry-run' in options;
  await scriptRun(scriptPath ? [scriptPath, ...scriptArgs] : [], ctx, { dryRun });
}
