/**
 * Public API for the `@studiometa/productive-cli/script` subpath.
 *
 * Consumers import this module to access the TypeScript types that describe
 * the context injected by `productive run`, and the `createScriptOutput`
 * factory for unit-testing scripts.
 *
 * @example
 * ```ts
 * // In a script file — types only, no runtime dep:
 * import type { ScriptContext } from '@studiometa/productive-cli/script';
 *
 * export default async function ({ client, output }: ScriptContext) { ... }
 * ```
 *
 * @example
 * ```ts
 * // In a test file — test your script in isolation:
 * import { createScriptOutput } from '@studiometa/productive-cli/script';
 *
 * const output = createScriptOutput();
 * ```
 */

export type { ScriptContext, ScriptOutput, ScriptSpinner, Productive } from './types.js';
export { createScriptOutput } from './output.js';
export { generateWrapper } from './wrapper.js';
export type { WrapperOptions } from './wrapper.js';
