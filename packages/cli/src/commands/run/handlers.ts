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
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import type { CommandContext } from '../../context.js';

import { generateResolverHooks, generateWrapper } from '../../script/wrapper.js';

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
 * @param rawArgs   - [scriptPath, ...scriptArgs] — the script path followed by
 *                    the args to forward (everything after the CLI's `--`)
 * @param ctx       - Command context (config, formatter)
 * @param options   - Run options. `dryRun` intercepts mutating API calls
 *                    without executing them.
 * @param resolver  - Module resolver (defaults to import.meta.resolve)
 */
export async function scriptRun(
  rawArgs: string[],
  ctx: CommandContext,
  { dryRun = false }: { dryRun?: boolean } = {},
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

  // The wrapper imports these two from the CLI's own install. Resolve them
  // through `resolver` (import.meta.resolve) so the dist layout stays governed
  // by package.json `exports` instead of hardcoded filenames.
  const sdkUrl = String(await resolver('@studiometa/productive-sdk'));
  const scriptOutputUrl = String(await resolver('@studiometa/productive-cli/script'));

  // Public @studiometa/* specifiers a run-script may import directly, mapped to
  // the CLI's own installed copies so they resolve even when the script lives
  // outside any node_modules tree (e.g. ~/Downloads). Resolution happens here,
  // on the main thread, because `import.meta.resolve` is unavailable inside the
  // resolver-hooks worker; the absolute URLs are embedded into the hooks module.
  // Transitive @studiometa deps resolve on their own (the hook falls through to
  // default resolution relative to the already-resolved parent URL), so only
  // directly-importable packages need an entry. A specifier that does not
  // resolve in this install layout is skipped rather than aborting the run.
  const importMap: Record<string, string> = {
    '@studiometa/productive-sdk': sdkUrl,
    '@studiometa/productive-cli/script': scriptOutputUrl,
  };
  await Promise.all(
    ['@studiometa/productive-cli', '@studiometa/productive-api'].map(async (specifier) => {
      try {
        importMap[specifier] = String(await resolver(specifier));
      } catch {
        // Not resolvable in this install layout — leave it to default resolution.
      }
    }),
  );

  // Write wrapper to a temp directory
  const tmpDir = await mkdtemp(resolve(tmpdir(), 'productive-script-'));
  const wrapperPath = resolve(tmpDir, 'wrapper.mjs');
  const hooksPath = resolve(tmpDir, 'resolver-hooks.mjs');
  const hooksUrl = pathToFileURL(hooksPath).href;

  let exitCode = 0;

  try {
    await writeFile(hooksPath, generateResolverHooks(importMap), 'utf-8');

    const wrapperContent = generateWrapper({ scriptUrl, scriptOutputUrl, sdkUrl, hooksUrl });
    await writeFile(wrapperPath, wrapperContent, 'utf-8');

    // Build node args — add TS stripping flags for .ts/.mts files.
    // --enable-source-maps makes Node use the source maps produced by SWC
    // (via --experimental-strip-types) so stack traces point to the original
    // TypeScript line numbers rather than the stripped JS output.
    const isTs = isTypeScriptFile(scriptPath);
    const nodeArgs = [
      '--enable-source-maps',
      ...(isTs ? ['--experimental-strip-types', '--experimental-transform-types'] : []),
      wrapperPath,
      ...scriptArgs,
    ];

    // Forward credentials via env vars (already resolved by createContext)
    const env: Record<string, string | undefined> = {
      ...process.env,
      // Suppress Node.js ExperimentalWarning banners (e.g. from --experimental-transform-types).
      // Only affects the spawned child process — the parent CLI is unaffected.
      NODE_NO_WARNINGS: '1',
    };
    if (ctx.config.apiToken) env.PRODUCTIVE_API_TOKEN = ctx.config.apiToken;
    if (ctx.config.organizationId) env.PRODUCTIVE_ORG_ID = ctx.config.organizationId;
    if (ctx.config.userId) env.PRODUCTIVE_USER_ID = ctx.config.userId;
    if (ctx.config.baseUrl) env.PRODUCTIVE_BASE_URL = ctx.config.baseUrl;
    if (dryRun) env.PRODUCTIVE_DRY_RUN = '1';

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
