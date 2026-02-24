import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ConfigSource } from './config.js';

// Mock child_process (for keychain access)
vi.mock('node:child_process', () => ({
  spawnSync: vi.fn(() => ({ status: 1, stdout: '' })),
}));

// Mock ConfigStore (for config file access)
vi.mock('@studiometa/productive-api', () => {
  const store = new Map<string, string>();

  class MockConfigStore {
    store = store;
    didMigrate = false;
    get(key: string) {
      return store.get(key);
    }
  }

  return {
    ConfigStore: MockConfigStore,
    // Expose the store map for test manipulation
    __testStore: store,
  };
});

import { spawnSync } from 'node:child_process';

import { loadConfig, ConfigurationError, resetPlatformCache } from './config.js';

// biome-ignore lint: test helper
const { __testStore: configStore } = (await import('@studiometa/productive-api')) as any;

describe('loadConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetPlatformCache();
    configStore.clear();
    // Reset spawnSync to always fail (no keychain available)
    vi.mocked(spawnSync).mockReturnValue({ status: 1, stdout: '' } as ReturnType<typeof spawnSync>);
    // Clean env vars
    delete process.env.PRODUCTIVE_API_TOKEN;
    delete process.env.PRODUCTIVE_ORG_ID;
    delete process.env.PRODUCTIVE_USER_ID;
  });

  afterEach(() => {
    delete process.env.PRODUCTIVE_API_TOKEN;
    delete process.env.PRODUCTIVE_ORG_ID;
    delete process.env.PRODUCTIVE_USER_ID;
  });

  describe('environment variables', () => {
    it('loads all credentials from env vars', () => {
      process.env.PRODUCTIVE_API_TOKEN = 'env-token';
      process.env.PRODUCTIVE_ORG_ID = 'env-org';
      process.env.PRODUCTIVE_USER_ID = 'env-user';

      const result = loadConfig();

      expect(result.token).toBe('env-token');
      expect(result.organizationId).toBe('env-org');
      expect(result.userId).toBe('env-user');
      expect(result._sources.token).toBe('env');
      expect(result._sources.organizationId).toBe('env');
      expect(result._sources.userId).toBe('env');
    });

    it('env vars take priority over config file', () => {
      process.env.PRODUCTIVE_API_TOKEN = 'env-token';
      process.env.PRODUCTIVE_ORG_ID = 'env-org';
      configStore.set('apiToken', 'file-token');
      configStore.set('organizationId', 'file-org');

      const result = loadConfig();

      expect(result.token).toBe('env-token');
      expect(result.organizationId).toBe('env-org');
    });
  });

  describe('config file', () => {
    it('loads credentials from config file', () => {
      configStore.set('apiToken', 'file-token');
      configStore.set('organizationId', 'file-org');
      configStore.set('userId', 'file-user');

      const result = loadConfig();

      expect(result.token).toBe('file-token');
      expect(result.organizationId).toBe('file-org');
      expect(result.userId).toBe('file-user');
      expect(result._sources.token).toBe('config');
      expect(result._sources.organizationId).toBe('config');
      expect(result._sources.userId).toBe('config');
    });
  });

  describe('keychain (macOS)', () => {
    it('loads token from macOS keychain', () => {
      // Simulate macOS
      Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
      resetPlatformCache();

      // Mock spawnSync for keychain lookup
      vi.mocked(spawnSync).mockImplementation((cmd, args) => {
        // security find-generic-password
        if (
          cmd === 'security' &&
          args?.includes('find-generic-password') &&
          args?.includes('apiToken')
        ) {
          return { status: 0, stdout: 'keychain-token\n' } as ReturnType<typeof spawnSync>;
        }
        return { status: 1, stdout: '' } as ReturnType<typeof spawnSync>;
      });

      configStore.set('organizationId', 'file-org');

      const result = loadConfig();

      expect(result.token).toBe('keychain-token');
      expect(result._sources.token).toBe('keychain');

      // Restore
      Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    });

    it('keychain has priority over config file for token', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
      resetPlatformCache();

      vi.mocked(spawnSync).mockImplementation((cmd, args) => {
        if (
          cmd === 'security' &&
          args?.includes('find-generic-password') &&
          args?.includes('apiToken')
        ) {
          return { status: 0, stdout: 'keychain-token\n' } as ReturnType<typeof spawnSync>;
        }
        return { status: 1, stdout: '' } as ReturnType<typeof spawnSync>;
      });

      configStore.set('apiToken', 'file-token');
      configStore.set('organizationId', 'file-org');

      const result = loadConfig();

      expect(result.token).toBe('keychain-token');
      expect(result._sources.token).toBe('keychain');

      Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    });
  });

  describe('keychain (Linux)', () => {
    it('loads token from libsecret', () => {
      Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
      resetPlatformCache();

      vi.mocked(spawnSync).mockImplementation((cmd, args) => {
        // `which secret-tool` check
        if (cmd === 'which' && args?.includes('secret-tool')) {
          return { status: 0 } as ReturnType<typeof spawnSync>;
        }
        // secret-tool lookup
        if (cmd === 'secret-tool' && args?.includes('lookup') && args?.includes('apiToken')) {
          return { status: 0, stdout: 'secret-token\n' } as ReturnType<typeof spawnSync>;
        }
        return { status: 1, stdout: '' } as ReturnType<typeof spawnSync>;
      });

      configStore.set('organizationId', 'file-org');

      const result = loadConfig();

      expect(result.token).toBe('secret-token');
      expect(result._sources.token).toBe('keychain');
    });
  });

  describe('mixed sources', () => {
    it('can load from different sources for different credentials', () => {
      process.env.PRODUCTIVE_API_TOKEN = 'env-token';
      configStore.set('organizationId', 'file-org');

      const result = loadConfig();

      expect(result.token).toBe('env-token');
      expect(result.organizationId).toBe('file-org');
      expect(result._sources.token).toBe('env');
      expect(result._sources.organizationId).toBe('config');
      expect(result.userId).toBeUndefined();
      expect(result._sources.userId).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('throws ConfigurationError when token is missing', () => {
      configStore.set('organizationId', 'file-org');

      expect(() => loadConfig()).toThrow(ConfigurationError);
      try {
        loadConfig();
      } catch (err) {
        const error = err as ConfigurationError;
        expect(error.missing).toContain('apiToken (PRODUCTIVE_API_TOKEN)');
        expect(error.checked).toContain('env vars');
        expect(error.checked).toContain('config file');
      }
    });

    it('throws ConfigurationError when organizationId is missing', () => {
      process.env.PRODUCTIVE_API_TOKEN = 'env-token';

      expect(() => loadConfig()).toThrow(ConfigurationError);
      try {
        loadConfig();
      } catch (err) {
        const error = err as ConfigurationError;
        expect(error.missing).toContain('organizationId (PRODUCTIVE_ORG_ID)');
      }
    });

    it('throws ConfigurationError when both are missing', () => {
      expect(() => loadConfig()).toThrow(ConfigurationError);
      try {
        loadConfig();
      } catch (err) {
        const error = err as ConfigurationError;
        expect(error.missing).toHaveLength(2);
        expect(error.message).toContain('productive config setup');
      }
    });

    it('does NOT throw when userId is missing (optional)', () => {
      process.env.PRODUCTIVE_API_TOKEN = 'token';
      process.env.PRODUCTIVE_ORG_ID = 'org';

      const result = loadConfig();
      expect(result.userId).toBeUndefined();
    });
  });

  describe('_sources provenance', () => {
    it('tracks each source correctly', () => {
      process.env.PRODUCTIVE_API_TOKEN = 'env-token';
      configStore.set('organizationId', 'file-org');
      configStore.set('userId', 'file-user');

      const result = loadConfig();
      const sources: Record<string, ConfigSource | undefined> = result._sources;

      expect(sources.token).toBe('env');
      expect(sources.organizationId).toBe('config');
      expect(sources.userId).toBe('config');
    });
  });
});

describe('ConfigurationError', () => {
  it('has correct name', () => {
    const err = new ConfigurationError(['token'], ['env vars']);
    expect(err.name).toBe('ConfigurationError');
  });

  it('contains missing fields and checked sources', () => {
    const err = new ConfigurationError(['token', 'orgId'], ['env vars', 'config file']);
    expect(err.missing).toEqual(['token', 'orgId']);
    expect(err.checked).toEqual(['env vars', 'config file']);
    expect(err.message).toContain('token, orgId');
    expect(err.message).toContain('env vars, config file');
  });

  it('is an instance of Error', () => {
    const err = new ConfigurationError([], []);
    expect(err).toBeInstanceOf(Error);
  });
});
