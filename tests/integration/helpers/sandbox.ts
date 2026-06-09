/**
 * Filesystem sandbox for integration tests.
 *
 * Creates a temp directory tree with fake HOME, XDG_CONFIG_HOME, and
 * XDG_CACHE_HOME so the spawned child processes never touch the real
 * user's config or cache.
 */

import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface Sandbox {
  /** Root temp directory */
  dir: string;
  /** Fake HOME */
  homeDir: string;
  /** Fake XDG_CONFIG_HOME */
  configDir: string;
  /** Fake XDG_CACHE_HOME */
  cacheDir: string;
  /** Locked-down env for child processes */
  env: Record<string, string>;
  /** Remove the sandbox directory */
  cleanup(): Promise<void>;
}

export interface CreateSandboxOptions {
  apiToken?: string;
  orgId?: string;
  userId?: string;
  mockApiUrl: string;
  /** Extra environment variables merged into the locked-down child env. */
  extraEnv?: Record<string, string>;
}

/**
 * Create a sandboxed environment for a single test run.
 *
 * The child process env is intentionally minimal — NO ...process.env spread.
 * Credentials are injected via env vars, which take highest priority in the
 * CLI config resolution chain (above keychain and config file).
 */
export async function createSandbox(options: CreateSandboxOptions): Promise<Sandbox> {
  const {
    apiToken = 'test-token-123',
    orgId = 'test-org-456',
    userId = 'test-user-789',
    mockApiUrl,
    extraEnv = {},
  } = options;

  const dir = await mkdtemp(join(tmpdir(), 'productive-test-'));
  const homeDir = join(dir, 'home');
  const configDir = join(dir, 'config');
  const cacheDir = join(dir, 'cache');

  await mkdir(homeDir, { recursive: true });
  await mkdir(join(configDir, 'productive-cli'), { recursive: true });
  await mkdir(join(cacheDir, 'productive-cli'), { recursive: true });

  // Pre-seed config file as secondary fallback (env vars take priority)
  await writeFile(
    join(configDir, 'productive-cli', 'config.json'),
    JSON.stringify({
      apiToken,
      organizationId: orgId,
      userId,
      baseUrl: mockApiUrl,
    }),
  );

  // Locked-down environment — no ...process.env spread
  const env: Record<string, string> = {
    PATH: process.env.PATH!,
    HOME: homeDir,
    XDG_CONFIG_HOME: configDir,
    XDG_CACHE_HOME: cacheDir,
    // Credentials via env vars short-circuit keychain lookup
    PRODUCTIVE_API_TOKEN: apiToken,
    PRODUCTIVE_ORG_ID: orgId,
    PRODUCTIVE_USER_ID: userId,
    PRODUCTIVE_BASE_URL: mockApiUrl,
    // Deterministic output
    NO_COLOR: '1',
    FORCE_COLOR: '0',
    NODE_NO_WARNINGS: '1',
    ...extraEnv,
  };

  async function cleanup() {
    await rm(dir, { recursive: true, force: true });
  }

  return { dir, homeDir, configDir, cacheDir, env, cleanup };
}
