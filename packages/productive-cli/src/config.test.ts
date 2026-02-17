import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { getConfig, setConfig, clearConfig, showConfig, validateConfig } from './config.js';

// Mock keychain to avoid reading real keychain values in tests
vi.mock('../utils/keychain-store.js', () => ({
  isKeychainAvailable: vi.fn().mockReturnValue(false),
  getKeychainBackend: vi.fn().mockReturnValue('none'),
  getKeychainValue: vi.fn().mockReturnValue(null),
  setKeychainValue: vi.fn().mockReturnValue(false),
  deleteKeychainValue: vi.fn().mockReturnValue(false),
  isSecureKey: vi.fn().mockImplementation((key: string) => key === 'apiToken'),
  SECURE_KEYS: ['apiToken'],
}));

describe('config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear environment variables
    delete process.env.PRODUCTIVE_API_TOKEN;
    delete process.env.PRODUCTIVE_ORG_ID;
    delete process.env.PRODUCTIVE_USER_ID;
    delete process.env.PRODUCTIVE_BASE_URL;

    clearConfig();
  });

  afterEach(() => {
    // Restore environment
    process.env = { ...originalEnv };
  });

  it('should get empty config initially', () => {
    const config = getConfig();
    expect(config.apiToken).toBeUndefined();
    expect(config.organizationId).toBeUndefined();
    expect(config.userId).toBeUndefined();
  });

  it('should set and get config values', () => {
    setConfig('apiToken', 'test-token');
    const config = getConfig();
    expect(config.apiToken).toBe('test-token');
  });

  it('should prefer environment variables over stored config', () => {
    // Set stored config first
    setConfig('apiToken', 'stored-token');

    // Clear and set environment variable
    clearConfig();
    process.env.PRODUCTIVE_API_TOKEN = 'env-token';

    const config = getConfig();
    expect(config.apiToken).toBe('env-token');
  });

  it('should set organizationId', () => {
    setConfig('organizationId', '12345');
    const config = getConfig();
    expect(config.organizationId).toBe('12345');
  });

  it('should set userId', () => {
    setConfig('userId', '67890');
    const config = getConfig();
    expect(config.userId).toBe('67890');
  });

  it('should use default baseUrl', () => {
    const config = getConfig();
    expect(config.baseUrl).toBe('https://api.productive.io/api/v2');
  });

  it('should allow custom baseUrl', () => {
    setConfig('baseUrl', 'https://custom.api.com');
    const config = getConfig();
    expect(config.baseUrl).toBe('https://custom.api.com');
  });

  it('should clear all config', () => {
    setConfig('apiToken', 'test-token');
    setConfig('organizationId', '12345');
    clearConfig();

    const config = getConfig();
    expect(config.apiToken).toBeUndefined();
    expect(config.organizationId).toBeUndefined();
  });

  it('should show all config', () => {
    setConfig('apiToken', 'test-token');
    setConfig('organizationId', '12345');

    const config = showConfig();
    expect(config.apiToken).toBe('test-token');
    expect(config.organizationId).toBe('12345');
  });

  it('should validate complete config', () => {
    setConfig('apiToken', 'test-token');
    setConfig('organizationId', '12345');
    setConfig('userId', '67890');

    const validation = validateConfig();
    expect(validation.valid).toBe(true);
    expect(validation.missing).toEqual([]);
  });

  it('should validate incomplete config', () => {
    setConfig('apiToken', 'test-token');

    const validation = validateConfig();
    expect(validation.valid).toBe(false);
    expect(validation.missing).toContain('organizationId');
    expect(validation.missing).toContain('userId');
  });

  it('should validate empty config', () => {
    const validation = validateConfig();
    expect(validation.valid).toBe(false);
    expect(validation.missing).toEqual(['apiToken', 'organizationId', 'userId']);
  });

  it('should use environment variables for validation', () => {
    process.env.PRODUCTIVE_API_TOKEN = 'env-token';
    process.env.PRODUCTIVE_ORG_ID = '12345';
    process.env.PRODUCTIVE_USER_ID = '67890';

    const validation = validateConfig();
    expect(validation.valid).toBe(true);
    expect(validation.missing).toEqual([]);
  });
});
