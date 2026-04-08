import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import type { KeychainAdapter } from './config.js';

import {
  getConfig,
  setConfig,
  clearConfig,
  showConfig,
  validateConfig,
  deleteConfigValue,
  setKeychainAdapter,
} from './config.js';

/** Create a mock keychain adapter for testing */
function createMockKeychain(): KeychainAdapter & {
  getKeychainValue: ReturnType<typeof vi.fn>;
  setKeychainValue: ReturnType<typeof vi.fn>;
  deleteKeychainValue: ReturnType<typeof vi.fn>;
  isKeychainAvailable: ReturnType<typeof vi.fn>;
  getKeychainBackend: ReturnType<typeof vi.fn>;
  isSecureKey: ReturnType<typeof vi.fn>;
} {
  return {
    isKeychainAvailable: vi.fn().mockReturnValue(false),
    getKeychainBackend: vi.fn().mockReturnValue('none'),
    getKeychainValue: vi.fn().mockReturnValue(null),
    setKeychainValue: vi.fn().mockReturnValue(false),
    deleteKeychainValue: vi.fn().mockReturnValue(false),
    isSecureKey: vi.fn().mockImplementation((key: string) => key === 'apiToken'),
  };
}

let mockKeychain: ReturnType<typeof createMockKeychain>;

describe('config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    mockKeychain = createMockKeychain();
    setKeychainAdapter(mockKeychain);

    // Clear environment variables
    delete process.env.PRODUCTIVE_API_TOKEN;
    delete process.env.PRODUCTIVE_ORG_ID;
    delete process.env.PRODUCTIVE_USER_ID;
    delete process.env.PRODUCTIVE_BASE_URL;

    clearConfig();
  });

  afterEach(() => {
    setKeychainAdapter();
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

describe('config with keychain available', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.PRODUCTIVE_API_TOKEN;
    delete process.env.PRODUCTIVE_ORG_ID;
    delete process.env.PRODUCTIVE_USER_ID;
    delete process.env.PRODUCTIVE_BASE_URL;

    mockKeychain = createMockKeychain();
    setKeychainAdapter(mockKeychain);

    clearConfig();
    // Clear call history after clearConfig
    mockKeychain.deleteKeychainValue.mockClear();
  });

  afterEach(() => {
    setKeychainAdapter();
    process.env = { ...originalEnv };
  });

  it('should save secure key to keychain when available', () => {
    mockKeychain.isKeychainAvailable.mockReturnValue(true);
    mockKeychain.setKeychainValue.mockReturnValue(true);
    mockKeychain.getKeychainBackend.mockReturnValue('macOS Keychain');

    const result = setConfig('apiToken', 'my-secret-token');

    expect(mockKeychain.setKeychainValue).toHaveBeenCalledWith('apiToken', 'my-secret-token');
    expect(result.stored).toBe(true);
    expect(result.location).toBe('macOS Keychain');
  });

  it('should fall back to config file when keychain save fails', () => {
    mockKeychain.isKeychainAvailable.mockReturnValue(true);
    mockKeychain.setKeychainValue.mockReturnValue(false);

    const result = setConfig('apiToken', 'my-secret-token');

    expect(result.location).toBe('config file');
  });

  it('should delete existing config file value when saving to keychain succeeds', () => {
    // First, store value in config file (keychain not available)
    mockKeychain.isKeychainAvailable.mockReturnValue(false);
    setConfig('apiToken', 'old-config-file-token');

    // Now enable keychain and store new value
    mockKeychain.isKeychainAvailable.mockReturnValue(true);
    mockKeychain.setKeychainValue.mockReturnValue(true);
    mockKeychain.getKeychainBackend.mockReturnValue('macOS Keychain');

    const result = setConfig('apiToken', 'new-keychain-token');

    expect(result.location).toBe('macOS Keychain');
  });

  it('should read secure key from keychain when available', () => {
    mockKeychain.getKeychainValue.mockImplementation((key: string) => {
      if (key === 'apiToken') return 'keychain-token';
      return null;
    });

    const config = getConfig();

    expect(config.apiToken).toBe('keychain-token');
    expect(mockKeychain.getKeychainValue).toHaveBeenCalledWith('apiToken');
  });

  it('should clear keychain value when clearConfig is called with keychain available', () => {
    mockKeychain.isKeychainAvailable.mockReturnValue(true);

    clearConfig();

    expect(mockKeychain.deleteKeychainValue).toHaveBeenCalledWith('apiToken');
  });

  it('should not call keychain when clearConfig is called and keychain not available', () => {
    mockKeychain.isKeychainAvailable.mockReturnValue(false);

    clearConfig();

    expect(mockKeychain.deleteKeychainValue).not.toHaveBeenCalled();
  });

  it('should delete from both keychain and config file via deleteConfigValue', () => {
    mockKeychain.isSecureKey.mockReturnValue(true);

    deleteConfigValue('apiToken');

    expect(mockKeychain.deleteKeychainValue).toHaveBeenCalledWith('apiToken');
  });

  it('should only delete from config file for non-secure keys via deleteConfigValue', () => {
    mockKeychain.isSecureKey.mockReturnValue(false);

    deleteConfigValue('organizationId');

    expect(mockKeychain.deleteKeychainValue).not.toHaveBeenCalled();
  });

  it('should use explicit useKeychain: false option to avoid keychain', () => {
    mockKeychain.isKeychainAvailable.mockReturnValue(true);
    mockKeychain.setKeychainValue.mockReturnValue(true);

    const result = setConfig('apiToken', 'test-token', { useKeychain: false });

    expect(mockKeychain.setKeychainValue).not.toHaveBeenCalled();
    expect(result.location).toBe('config file');
  });

  it('should read from config file when keychain has no value for secure key', () => {
    // Keychain returns null
    mockKeychain.getKeychainValue.mockReturnValue(null);

    // Store in config file
    setConfig('apiToken', 'config-file-token');

    const config = getConfig();

    expect(config.apiToken).toBe('config-file-token');
  });

  it('should prioritize CLI options over all other sources', () => {
    process.env.PRODUCTIVE_API_TOKEN = 'env-token';
    mockKeychain.getKeychainValue.mockReturnValue('keychain-token');

    const config = getConfig({ 'api-token': 'cli-token' });

    expect(config.apiToken).toBe('cli-token');
  });

  it('should use token CLI alias for api-token', () => {
    const config = getConfig({ token: 'token-alias-value' });

    expect(config.apiToken).toBe('token-alias-value');
  });

  it('should handle CLI options for org-id and user-id', () => {
    const config = getConfig({
      'org-id': 'cli-org',
      'user-id': 'cli-user',
      'base-url': 'https://custom.api.io',
    });

    expect(config.organizationId).toBe('cli-org');
    expect(config.userId).toBe('cli-user');
    expect(config.baseUrl).toBe('https://custom.api.io');
  });

  it('should use organization-id CLI alias', () => {
    const config = getConfig({ 'organization-id': 'org-alias-id' });

    expect(config.organizationId).toBe('org-alias-id');
  });
});
