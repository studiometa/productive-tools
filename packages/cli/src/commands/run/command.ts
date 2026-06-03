/**
 * `productive run` command entry point.
 *
 * Unlike other commands, `run` cannot rely on the global CLI arg parser: that
 * parser strips every `--flag` into `options` and routes slash-less tokens into
 * `command`, so a script's own flags and positionals never survive the trip to
 * the handler. Instead, the script invocation is recovered straight from the
 * raw argv by {@link extractRunArgs}, which forwards everything from the script
 * path onward to the script verbatim.
 */

import type { CommandOptions } from '../../context.js';
import type { OptionValue } from '../../utils/args.js';

import { createContext } from '../../context.js';
import { scriptRun } from './handlers.js';
import { scriptList } from './list.js';

/**
 * A runnable script file: `.js`, `.mjs`, `.cjs`, `.jsx`, `.ts`, `.mts`,
 * `.cts`, or `.tsx` (case-insensitive). Used to locate the script path within
 * the raw argv. Flag values (`json`, `2025-01-01`, `app.json`, a base URL, …)
 * never match, so they are not mistaken for the script.
 */
const SCRIPT_FILE = /\.[cm]?[jt]sx?$/i;

/** The CLI-level flags and the script args recovered from a raw argv. */
export interface RunArgs {
  /** Flags for `run` itself — everything before the script path. */
  cliArgs: string[];
  /** The script path plus everything after it, forwarded to the script verbatim. */
  scriptArgs: string[];
}

/**
 * Split a raw argv (`process.argv.slice(2)`) into the CLI-level flags for
 * `run` and the script args to forward.
 *
 * The script path is the first token that looks like a runnable JS/TS file;
 * everything from there onward is forwarded untouched. Tokens before it
 * (credentials, `--dry-run`, `--list`, `--format`, …) configure `run` itself.
 *
 * When no script file is present (e.g. `--list` or a bare `run`), every
 * post-command token is treated as a CLI flag and `scriptArgs` is empty.
 *
 * @example
 * ```ts
 * extractRunArgs(['run', './report.mjs', '--from', 'x'])
 * // → { cliArgs: [], scriptArgs: ['./report.mjs', '--from', 'x'] }
 *
 * extractRunArgs(['run', '--dry-run', './report.mjs', '--from', 'x'])
 * // → { cliArgs: ['--dry-run'], scriptArgs: ['./report.mjs', '--from', 'x'] }
 * ```
 */
export function extractRunArgs(argv: string[]): RunArgs {
  // Locate the `run` / `script` command token; forward only what follows it.
  const commandIndex = argv.findIndex((arg) => arg === 'run' || arg === 'script');
  const post = commandIndex === -1 ? argv : argv.slice(commandIndex + 1);

  const scriptIndex = post.findIndex((arg) => SCRIPT_FILE.test(arg));
  if (scriptIndex === -1) {
    return { cliArgs: post, scriptArgs: [] };
  }

  return { cliArgs: post.slice(0, scriptIndex), scriptArgs: post.slice(scriptIndex) };
}

/**
 * Handle the `productive run` (and `productive script`) command.
 *
 * @param scriptArgs - [scriptPath, ...scriptArgs] recovered by {@link extractRunArgs}
 * @param options    - CLI-level options parsed from the flags before the script
 *                     path (credentials, format, `--dry-run`, `--list`)
 */
export async function handleRunCommand(
  scriptArgs: string[],
  options: Record<string, OptionValue>,
): Promise<void> {
  const ctx = createContext(options as CommandOptions);

  // --list discovers scripts in a directory without running any. It only
  // applies when it precedes the script path (so it lands in `options`); a
  // `--list` after the script path stays in `scriptArgs` and is forwarded.
  if ('list' in options) {
    const dir = typeof options.list === 'string' ? options.list : undefined;
    await scriptList(dir);
    return;
  }

  // --dry-run is a CLI-level flag (before the script path). scriptRun reads it
  // back off its arg list, so re-inject it ahead of the forwarded script args.
  const dryRun = 'dry-run' in options;
  await scriptRun(dryRun ? ['--dry-run', ...scriptArgs] : scriptArgs, ctx);
}
