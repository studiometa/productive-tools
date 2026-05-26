/**
 * Handler for `productive run <script> [args...]`.
 *
 * Resolves credentials from CLI config (keychain / config file / env / flags),
 * writes a temporary bootstrap wrapper, and spawns a Node.js subprocess that
 * runs the user's script with a pre-configured Productive SDK client.
 */

import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type { CommandContext } from '../../context.js';

import { generateWrapper } from '../../script/wrapper.js';

/**
 * Resolve the absolute path to a module entry point.
 *
 * Extracted for testability — tests can supply a mock resolver instead of
 * relying on `import.meta.resolve`.
 */
export type ModuleResolver = (specifier: string) => string | Promise<string>;

/**
 * Default module resolver using ESM-native `import.meta.resolve`.
 */
export function createDefaultResolver(metaUrl: string): ModuleResolver {
  // import.meta.resolve is relative to metaUrl
  return (specifier: string) => import.meta.resolve(specifier, metaUrl);
}

/**
 * Determine whether a script path requires TypeScript stripping flags.
 */
export function isTypeScriptFile(scriptPath: string): boolean {
  return (
    /\.m?tsx?$/.test(scriptPath) && !scriptPath.endsWith('.js') && !scriptPath.endsWith('.mjs')
  );
}

/**
 * Spawn a child process and return its exit code.
 */
export function waitForProcess(child: ReturnType<typeof spawn>): Promise<number> {
  return new Promise((res) => {
    child.on('close', (code) => res(code ?? 1));
  });
}

/**
 * Run a script with `productive run`.
 *
 * @param rawArgs   - Positional args from the CLI: [scriptPath, ...scriptArgs]
 * @param ctx       - Command context (config, formatter)
 * @param resolver  - Module resolver (defaults to import.meta.resolve)
 */
export async function scriptRun(
  rawArgs: string[],
  ctx: CommandContext,
  resolver: ModuleResolver = createDefaultResolver(import.meta.url),
): Promise<void> {
  const [rawScriptPath, ...scriptArgs] = rawArgs;

  if (!rawScriptPath) {
    ctx.formatter.error('Usage: productive run <script.[ts|js|mjs]> [args...]');
    process.exit(1);
    return; // for tests where process.exit is mocked — keeps TypeScript happy
  }

  const scriptPath = resolve(process.cwd(), rawScriptPath);
  const scriptUrl = pathToFileURL(scriptPath).href;

  // Resolve paths for wrapper imports
  const cliDir = dirname(fileURLToPath(import.meta.url));
  const scriptOutputPath = resolve(cliDir, 'script.js');
  const scriptOutputUrl = pathToFileURL(scriptOutputPath).href;

  const sdkUrl = String(await resolver('@studiometa/productive-sdk'));

  // Write wrapper to a temp directory
  const tmpDir = await mkdtemp(resolve(tmpdir(), 'productive-script-'));
  const wrapperPath = resolve(tmpDir, 'wrapper.mjs');

  let exitCode = 0;

  try {
    const wrapperContent = generateWrapper({ scriptUrl, scriptOutputUrl, sdkUrl });
    await writeFile(wrapperPath, wrapperContent, 'utf-8');

    // Build node args — add TS stripping flags for .ts/.mts files
    const isTs = isTypeScriptFile(scriptPath);
    const nodeArgs = [
      ...(isTs ? ['--experimental-strip-types', '--experimental-transform-types'] : []),
      wrapperPath,
      ...scriptArgs,
    ];

    // Forward credentials via env vars (already resolved by createContext)
    const env: Record<string, string | undefined> = { ...process.env };
    if (ctx.config.apiToken) env.PRODUCTIVE_API_TOKEN = ctx.config.apiToken;
    if (ctx.config.organizationId) env.PRODUCTIVE_ORG_ID = ctx.config.organizationId;
    if (ctx.config.userId) env.PRODUCTIVE_USER_ID = ctx.config.userId;
    if (ctx.config.baseUrl) env.PRODUCTIVE_BASE_URL = ctx.config.baseUrl;

    const child = spawn(process.execPath, nodeArgs, {
      stdio: 'inherit',
      env: env as NodeJS.ProcessEnv,
    });

    exitCode = await waitForProcess(child);
  } finally {
    // Best-effort cleanup — ignore errors (e.g. already removed)
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }

  process.exit(exitCode);
}
