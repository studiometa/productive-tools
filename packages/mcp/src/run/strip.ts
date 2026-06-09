/**
 * TypeScript type-stripping for submitted scripts.
 *
 * QuickJS executes JavaScript, so any TypeScript syntax in a submitted script
 * must be transformed away first. We use Node's built-in
 * {@link stripTypeScriptTypes} in `transform` mode, which also lowers `enum`
 * and parameter properties (not just erasing annotations).
 *
 * Plain JavaScript passes through unchanged. If the source cannot be parsed as
 * TypeScript at all, the original is returned untouched so the sandbox can
 * surface the real syntax error to the caller.
 */

import { stripTypeScriptTypes } from 'node:module';

/**
 * Strip TypeScript types from a script, returning runnable JavaScript.
 *
 * @param code - The submitted script source (TypeScript or JavaScript).
 * @returns JavaScript with type syntax removed.
 */
export function stripTypes(code: string): string {
  try {
    return stripTypeScriptTypes(code, { mode: 'transform' });
  } catch {
    // Not parseable as TypeScript — hand it to the sandbox as-is so the
    // engine reports the genuine error rather than a stripping error.
    return code;
  }
}
