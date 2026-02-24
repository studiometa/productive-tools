/**
 * Configuration loader for the Productive SDK.
 *
 * Reads credentials from multiple sources in priority order:
 * 1. Environment variables (highest priority)
 * 2. System keychain (macOS Keychain / Linux libsecret)
 * 3. Config file (~/.config/productive-cli or ~/Library/Application Support/productive-cli)
 *
 * This enables zero-config usage for anyone who already has the CLI configured:
 * ```ts
 * import { Productive } from '@studiometa/productive-sdk';
 * const p = Productive.fromEnv();
 * ```
 */

import { ConfigStore } from '@studiometa/productive-api';
import { spawnSync } from 'node:child_process';

import type { ProductiveOptions } from './productive.js';

/** Source where a credential was resolved from */
export type ConfigSource = 'env' | 'keychain' | 'config';

/** Result of loadConfig with provenance tracking */
export interface LoadConfigResult extends ProductiveOptions {
  /** Where each credential was resolved from */
  _sources: {
    token: ConfigSource;
    organizationId: ConfigSource;
    userId?: ConfigSource;
  };
}

/** Keychain service name (matches the CLI) */
const SERVICE_NAME = 'productive-cli';

// ---------------------------------------------------------------------------
// Keychain access (read-only, ported from CLI's keychain-store.ts)
// ---------------------------------------------------------------------------

type Platform = 'darwin' | 'linux' | 'unsupported';

function detectPlatform(): Platform {
  if (process.platform === 'darwin') return 'darwin';
  if (process.platform === 'linux') {
    try {
      const { status } = spawnSync('which', ['secret-tool'], { stdio: 'ignore' });
      return status === 0 ? 'linux' : 'unsupported';
    } catch {
      return 'unsupported';
    }
  }
  return 'unsupported';
}

let cachedPlatform: Platform | null = null;
function getPlatform(): Platform {
  return (cachedPlatform ??= detectPlatform());
}

/** @internal Exported only for testing */
export function resetPlatformCache(): void {
  cachedPlatform = null;
}

function getKeychainValue(key: string): string | null {
  const platform = getPlatform();

  if (platform === 'darwin') {
    try {
      const result = spawnSync(
        'security',
        ['find-generic-password', '-s', SERVICE_NAME, '-a', key, '-w'],
        { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] },
      );
      return result.status === 0 && result.stdout ? result.stdout.trim() : null;
    } catch {
      return null;
    }
  }

  if (platform === 'linux') {
    try {
      const result = spawnSync('secret-tool', ['lookup', 'service', SERVICE_NAME, 'account', key], {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      return result.status === 0 && result.stdout ? result.stdout.trim() : null;
    } catch {
      return null;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Config file access (reuses the API's ConfigStore)
// ---------------------------------------------------------------------------

interface CliConfig extends Record<string, unknown> {
  apiToken?: string;
  organizationId?: string;
  userId?: string;
  baseUrl?: string;
}

function getConfigStore(): ConfigStore<CliConfig> {
  return new ConfigStore<CliConfig>('productive-cli');
}

// ---------------------------------------------------------------------------
// Credential resolution
// ---------------------------------------------------------------------------

interface ResolvedCredential {
  value: string;
  source: ConfigSource;
}

function resolveCredential(
  envVar: string,
  keychainKey: string | null,
  configKey: keyof CliConfig,
  store: ConfigStore<CliConfig>,
): ResolvedCredential | null {
  // 1. Environment variable
  const envValue = process.env[envVar];
  if (envValue) return { value: envValue, source: 'env' };

  // 2. System keychain
  if (keychainKey) {
    const keychainValue = getKeychainValue(keychainKey);
    if (keychainValue) return { value: keychainValue, source: 'keychain' };
  }

  // 3. Config file
  const configValue = store.get(configKey);
  if (configValue) return { value: String(configValue), source: 'config' };

  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Error thrown when required configuration is missing */
export class ConfigurationError extends Error {
  readonly missing: string[];
  readonly checked: string[];

  constructor(missing: string[], checked: string[]) {
    const lines = [
      `Missing required configuration: ${missing.join(', ')}`,
      `Checked: ${checked.join(', ')}`,
      'Run "productive config setup" to configure credentials.',
    ];
    super(lines.join('\n'));
    this.name = 'ConfigurationError';
    this.missing = missing;
    this.checked = checked;
  }
}

/**
 * Load Productive.io credentials from environment, keychain, and config file.
 *
 * Priority order for each credential:
 * 1. Environment variables: `PRODUCTIVE_API_TOKEN`, `PRODUCTIVE_ORG_ID`, `PRODUCTIVE_USER_ID`
 * 2. System keychain (macOS Keychain / Linux libsecret)
 * 3. Config file (`~/.config/productive-cli/config.json` or macOS equivalent)
 *
 * @throws {ConfigurationError} When required credentials (token, organizationId) are missing
 *
 * @example
 * ```ts
 * import { loadConfig, Productive } from '@studiometa/productive-sdk';
 *
 * const config = loadConfig();
 * const p = new Productive(config);
 * ```
 */
export function loadConfig(): LoadConfigResult {
  const store = getConfigStore();
  const platform = getPlatform();

  const token = resolveCredential('PRODUCTIVE_API_TOKEN', 'apiToken', 'apiToken', store);
  const orgId = resolveCredential('PRODUCTIVE_ORG_ID', null, 'organizationId', store);
  const userId = resolveCredential('PRODUCTIVE_USER_ID', null, 'userId', store);

  // Build list of checked sources for error messages
  const checkedSources: string[] = ['env vars'];
  if (platform !== 'unsupported') {
    const backend = platform === 'darwin' ? 'macOS Keychain' : 'libsecret';
    checkedSources.push(backend);
  }
  checkedSources.push('config file');

  // Validate required credentials
  const missing: string[] = [];
  if (!token) missing.push('apiToken (PRODUCTIVE_API_TOKEN)');
  if (!orgId) missing.push('organizationId (PRODUCTIVE_ORG_ID)');

  if (missing.length > 0) {
    throw new ConfigurationError(missing, checkedSources);
  }

  return {
    token: token!.value,
    organizationId: orgId!.value,
    userId: userId?.value,
    _sources: {
      token: token!.source,
      organizationId: orgId!.source,
      userId: userId?.source,
    },
  };
}
