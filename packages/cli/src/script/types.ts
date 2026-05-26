/**
 * Types for the productive run script context.
 *
 * Scripts receive a pre-configured SDK client and output utilities.
 * Import these types in your scripts with:
 *
 *   import type { ScriptContext } from '@studiometa/productive-cli/script';
 *
 * The `import type` statement is erased at runtime, so no module resolution
 * is needed for this import — it is safe to use in any script environment.
 */

import type { Productive } from '@studiometa/productive-sdk';

import type { FlagValue, ParsedFlags } from './args.js';

export type { Productive };
export type { FlagValue, ParsedFlags };

/**
 * Spinner handle returned by `output.spinner()`.
 */
export interface ScriptSpinner {
  /** Update the spinner message. */
  update(message: string): void;
  /** Stop the spinner with an optional success message. */
  stop(message?: string): void;
  /** Stop the spinner and show a failure message. */
  fail(message: string): void;
}

/**
 * Output utilities available inside scripts.
 *
 * All methods write directly to stdout/stderr — there is no buffering.
 */
export interface ScriptOutput {
  // ── data rendering ────────────────────────────────────────────────

  /** Render an array of objects as an ASCII table. */
  table(data: object[], opts?: { columns?: string[] }): void;

  /** Print data as formatted JSON. */
  json(data: unknown, opts?: { pretty?: boolean }): void;

  /** Print an array of objects as CSV. */
  csv(data: object[], opts?: { columns?: string[] }): void;

  // ── logging ───────────────────────────────────────────────────────

  /** Print plain text. */
  print(text: string): void;

  /** Print a success message (green ✓). */
  success(message: string): void;

  /** Print an error message (red ✗) to stderr. */
  error(message: string): void;

  /** Print a warning message (yellow ⚠). */
  warn(message: string): void;

  /** Print an info message (blue). */
  info(message: string): void;

  // ── interactive ───────────────────────────────────────────────────

  /**
   * Start a spinner for long-running operations (handle form).
   *
   * Returns a handle with `update`, `stop`, and `fail` methods.
   *
   * @example
   * ```ts
   * const spin = output.spinner('Loading projects…');
   * const projects = await client.projects.list().toArray();
   * spin.stop('Loaded.');
   * ```
   */
  spinner(message: string): ScriptSpinner;

  /**
   * Wrap-style spinner: start a spinner, run an async task, stop on
   * completion or show a failure message on error.
   *
   * The spinner is stopped automatically — no handle needed.
   * On success the task's return value is passed through.
   * On failure the spinner shows an error and re-throws.
   *
   * @example
   * ```ts
   * const projects = await output.spinner('Loading projects…', () =>
   *   client.projects.list().toArray(),
   * );
   * output.table(projects.map(p => ({ id: p.id, name: p.attributes.name })));
   * ```
   */
  spinner<T>(message: string, task: () => Promise<T>): Promise<T>;
}

/**
 * Context object passed to the default export of a script.
 *
 * @example
 * ```ts
 * import type { ScriptContext } from '@studiometa/productive-cli/script';
 *
 * export default async function ({ client, output, args, flags }: ScriptContext) {
 *   const from = flags.from as string | undefined;
 *   const projects = await client.projects.list().toArray();
 *   output.table(projects.map(p => ({ id: p.id, name: p.attributes.name })));
 * }
 * ```
 */
export interface ScriptContext {
  /** Pre-configured Productive SDK client. */
  client: Productive;
  /** Output utilities for rendering data and logging. */
  output: ScriptOutput;
  /** Positional arguments passed after the script path. */
  args: string[];
  /**
   * Named flags parsed from the script arguments.
   *
   * Supports `--flag`, `--flag value`, `--flag=value`, `--no-flag`, `-f`, `-f value`.
   * Repeated flags produce an array: `--tag a --tag b` → `{ tag: ['a', 'b'] }`.
   *
   * @example
   * ```ts
   * // productive run ./report.ts --from 2025-01-01 --mine
   * // → flags = { from: '2025-01-01', mine: true }
   * ```
   */
  flags: ParsedFlags;
}
