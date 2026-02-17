import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fs to prevent real file operations
vi.mock('node:fs', () => ({
  readFileSync: vi.fn(() => '{}'),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  existsSync: vi.fn(() => true),
}));

vi.mock('node:os', () => ({
  homedir: vi.fn(() => '/home/test'),
}));

import { writeFileSync } from 'node:fs';

import { getConfig, setConfig, deleteConfig, clearConfig } from './config.js';

describe('config', () => {
  const envBackup: Record<string, string | undefined> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    // Backup and clear env vars
    for (const key of [
      'PRODUCTIVE_API_TOKEN',
      'PRODUCTIVE_ORG_ID',
      'PRODUCTIVE_USER_ID',
      'PRODUCTIVE_BASE_URL',
    ]) {
      envBackup[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    // Restore env vars
    for (const [key, val] of Object.entries(envBackup)) {
      if (val === undefined) delete process.env[key];
      else process.env[key] = val;
    }
  });

  describe('getConfig', () => {
    it('returns defaults when nothing is set', () => {
      const config = getConfig();
      expect(config.baseUrl).toBe('https://api.productive.io/api/v2');
    });

    it('reads from env vars with priority', () => {
      process.env.PRODUCTIVE_API_TOKEN = 'env-token';
      process.env.PRODUCTIVE_ORG_ID = 'env-org';
      process.env.PRODUCTIVE_USER_ID = 'env-user';
      process.env.PRODUCTIVE_BASE_URL = 'https://custom.api';

      const config = getConfig();
      expect(config.apiToken).toBe('env-token');
      expect(config.organizationId).toBe('env-org');
      expect(config.userId).toBe('env-user');
      expect(config.baseUrl).toBe('https://custom.api');
    });
  });

  describe('setConfig', () => {
    it('writes to config file', () => {
      setConfig('apiToken', 'new-token');
      expect(writeFileSync).toHaveBeenCalled();
    });
  });

  describe('deleteConfig', () => {
    it('deletes a key', () => {
      deleteConfig('apiToken');
      expect(writeFileSync).toHaveBeenCalled();
    });
  });

  describe('clearConfig', () => {
    it('clears all config', () => {
      clearConfig();
      expect(writeFileSync).toHaveBeenCalled();
    });
  });
});
