/**
 * `productive run --list` — discover and list scripts in a directory.
 *
 * Lists all `.ts`, `.mts`, `.js`, `.mjs` files found in the target directory
 * (defaults to `./scripts`). If a script exports a `meta` object (via
 * `defineMeta()` or a plain object literal), its `name`, `description`, and
 * `usage` fields are shown alongside the path.
 *
 * Meta is loaded by dynamically importing each discovered script in a single
 * Node.js subprocess (with `--experimental-strip-types` so TypeScript files
 * are supported). Side effects are not a concern because the authoring
 * convention places all logic inside the default-export function — the
 * top-level `export const meta = ...` is always a pure, inert value.
 */

import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import type { ScriptMeta } from '../../script/meta.js';

import { colors } from '../../utils/colors.js';

/** A discovered script file with optional metadata. */
export interface DiscoveredScript {
  /** Absolute path to the script file. */
  path: string;
  /** Path relative to the base directory (for display). */
  relativePath: string;
  /** Metadata from the script's `export const meta` value, if present. */
  meta: ScriptMeta;
}

const SCRIPT_EXTENSIONS = new Set(['.ts', '.mts', '.js', '.mjs']);

/**
 * Import the `meta` export from a batch of script files in a single
 * subprocess.
 *
 * Spawns `node --experimental-strip-types --input-type=module` with an
 * inline ES-module script that imports each file, reads its `.meta` export,
 * and writes a JSON array to stdout. Using `--experimental-strip-types`
 * covers both `.ts` and `.js` files in a single pass.
 *
 * Returns a `ScriptMeta[]` parallel to `filePaths`. On any per-file import
 * error (syntax error, missing dependency, etc.) the corresponding entry is
 * `{}` — the listing degrades gracefully.
 *
 * @internal Exported for testing.
 */
export async function importScriptMetas(filePaths: string[]): Promise<ScriptMeta[]> {
  if (filePaths.length === 0) return [];

  const fileUrls = filePaths.map((p) => pathToFileURL(p).href);

  // Inline module: import each file URL, capture .meta, output JSON array.
  const code = `
const paths = ${JSON.stringify(fileUrls)};
const metas = [];
for (const p of paths) {
  try {
    const mod = await import(p);
    const m = mod.meta;
    metas.push(m !== null && typeof m === 'object' ? m : {});
  } catch {
    metas.push({});
  }
}
process.stdout.write(JSON.stringify(metas));
`;

  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ['--experimental-strip-types', '--experimental-transform-types', '--input-type=module'],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_NO_WARNINGS: '1' },
      },
    );

    let stdout = '';
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stdin.write(code, 'utf-8');
    child.stdin.end();

    child.on('close', () => {
      try {
        const parsed = JSON.parse(stdout) as ScriptMeta[];
        resolve(parsed.length === filePaths.length ? parsed : filePaths.map(() => ({})));
      } catch {
        resolve(filePaths.map(() => ({})));
      }
    });
  });
}

/**
 * Discover all script files in a directory (non-recursive).
 */
export async function discoverScripts(dir: string): Promise<DiscoveredScript[]> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return [];
  }

  const filePaths: string[] = [];

  for (const entry of entries.toSorted()) {
    const ext = entry.slice(entry.lastIndexOf('.'));
    if (!SCRIPT_EXTENSIONS.has(ext)) continue;
    filePaths.push(join(dir, entry));
  }

  const metas = await importScriptMetas(filePaths);

  return filePaths.map((filePath, i) => ({
    path: filePath,
    relativePath: relative(process.cwd(), filePath),
    meta: metas[i] ?? {},
  }));
}

/**
 * Print a formatted list of discovered scripts to stdout.
 */
export function printScriptList(scripts: DiscoveredScript[], dir: string): void {
  const relDir = relative(process.cwd(), dir) || '.';

  if (scripts.length === 0) {
    console.log(colors.yellow(`No scripts found in ${relDir}/`));
    console.log(
      `  Create a .ts or .js file there and run ${colors.cyan('productive run <script>')}`,
    );
    return;
  }

  console.log(colors.bold(`Scripts in ${relDir}/`) + ` (${scripts.length} found)\n`);

  for (const script of scripts) {
    const name = script.meta.name
      ? colors.bold(script.meta.name)
      : colors.cyan(script.relativePath);

    const pathLine = script.meta.name ? `  ${colors.cyan(script.relativePath)}` : '';

    console.log(`  ${name}`);
    if (pathLine) console.log(pathLine);
    if (script.meta.description) console.log(`  ${script.meta.description}`);
    if (script.meta.usage) {
      console.log(
        `  ${colors.dim('Usage:')} productive run ${script.relativePath} ${script.meta.usage}`,
      );
    } else {
      console.log(`  ${colors.dim('Usage:')} productive run ${script.relativePath}`);
    }
    console.log();
  }
}

/**
 * Run `productive run --list [dir]`.
 *
 * @param dir - Directory to scan (defaults to `./scripts`).
 */
export async function scriptList(dir?: string): Promise<void> {
  const targetDir = resolve(process.cwd(), dir ?? 'scripts');
  const scripts = await discoverScripts(targetDir);
  printScriptList(scripts, targetDir);
}
