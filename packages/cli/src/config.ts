import { ConfigStore } from '@studiometa/productive-api';

import type { ProductiveConfig } from './types.js';

import {
  getKeychainValue as defaultGetKeychainValue,
  setKeychainValue as defaultSetKeychainValue,
  deleteKeychainValue as defaultDeleteKeychainValue,
  isSecureKey as defaultIsSecureKey,
  isKeychainAvailable as defaultIsKeychainAvailable,
  getKeychainBackend as defaultGetKeychainBackend,
} from './utils/keychain-store.js';

/**
 * Keychain adapter interface for dependency injection.
 * Enables testing config without mocking the keychain module.
 */
export interface KeychainAdapter {
  isKeychainAvailable: () => boolean;
  getKeychainBackend: () => string;
  getKeychainValue: (key: string) => string | null;
  setKeychainValue: (key: string, value: string) => boolean;
  deleteKeychainValue: (key: string) => boolean;
  isSecureKey: (key: string) => boolean;
}

/** Default keychain adapter using real keychain-store */
const defaultKeychain: KeychainAdapter = {
  isKeychainAvailable: defaultIsKeychainAvailable,
  getKeychainBackend: defaultGetKeychainBackend,
  getKeychainValue: defaultGetKeychainValue,
  setKeychainValue: defaultSetKeychainValue,
  deleteKeychainValue: defaultDeleteKeychainValue,
  isSecureKey: defaultIsSecureKey,
};

/** Current keychain adapter (overridable for tests) */
let keychain: KeychainAdapter = defaultKeychain;

/**
 * Override the keychain adapter (for testing without vi.mock).
 * Call with no argument to restore the default.
 */
export function setKeychainAdapter(adapter?: KeychainAdapter): void {
  keychain = adapter ?? defaultKeychain;
}

const config = new ConfigStore<ProductiveConfig>('productive-cli');

/**
 * Get a config value, checking keychain first for secure keys
 */
function getConfigValue(key: keyof ProductiveConfig): string | undefined {
  const keyStr = String(key);
  // For secure keys, try keychain first
  if (keychain.isSecureKey(keyStr)) {
    const keychainValue = keychain.getKeychainValue(keyStr);
    if (keychainValue) {
      return keychainValue;
    }
  }
  // Fall back to config file
  return config.get(key);
}

/**
 * Get configuration from multiple sources with priority:
 * 1. CLI arguments (highest priority)
 * 2. Environment variables
 * 3. Keychain (for secure keys)
 * 4. Config file (lowest priority)
 */
export function getConfig(
  cliOptions?: Record<string, string | boolean | string[]>,
): ProductiveConfig {
  return {
    apiToken:
      (cliOptions?.['api-token'] as string) ||
      (cliOptions?.token as string) ||
      process.env.PRODUCTIVE_API_TOKEN ||
      getConfigValue('apiToken'),
    organizationId:
      (cliOptions?.['org-id'] as string) ||
      (cliOptions?.['organization-id'] as string) ||
      process.env.PRODUCTIVE_ORG_ID ||
      getConfigValue('organizationId'),
    userId:
      (cliOptions?.['user-id'] as string) ||
      process.env.PRODUCTIVE_USER_ID ||
      getConfigValue('userId'),
    baseUrl:
      (cliOptions?.['base-url'] as string) ||
      process.env.PRODUCTIVE_BASE_URL ||
      getConfigValue('baseUrl') ||
      'https://api.productive.io/api/v2',
  };
}

/**
 * Set a config value, using keychain for secure keys if available
 * @returns Object with storage location info
 */
export function setConfig(
  key: keyof ProductiveConfig,
  value: string,
  options?: { useKeychain?: boolean },
): { stored: boolean; location: string } {
  const keyStr = String(key);
  const useKeychain = options?.useKeychain ?? keychain.isSecureKey(keyStr);

  if (useKeychain && keychain.isKeychainAvailable()) {
    const success = keychain.setKeychainValue(keyStr, value);
    if (success) {
      // Remove from config file if it exists there
      if (config.get(key)) {
        config.delete(key);
      }
      return { stored: true, location: keychain.getKeychainBackend() };
    }
  }

  // Fall back to config file
  config.set(key, value);
  return { stored: true, location: 'config file' };
}

/**
 * Delete a config value from both keychain and config file
 */
export function deleteConfigValue(key: keyof ProductiveConfig): void {
  const keyStr = String(key);
  // Try to delete from keychain
  if (keychain.isSecureKey(keyStr)) {
    keychain.deleteKeychainValue(keyStr);
  }
  // Also delete from config file
  config.delete(key);
}

export function clearConfig(): void {
  // Clear secure keys from keychain
  if (keychain.isKeychainAvailable()) {
    keychain.deleteKeychainValue('apiToken');
  }
  config.clear();
}

export function showConfig(): ProductiveConfig {
  return config.store;
}

// Re-export keychain utilities for use in commands
export { isKeychainAvailable, getKeychainBackend } from './utils/keychain-store.js';
export { SECURE_KEYS } from './utils/keychain-store.js';

export function validateConfig(): { valid: boolean; missing: string[] } {
  const cfg = getConfig();
  const missing: string[] = [];

  if (!cfg.apiToken) missing.push('apiToken');
  if (!cfg.organizationId) missing.push('organizationId');
  if (!cfg.userId) missing.push('userId');

  return {
    valid: missing.length === 0,
    missing,
  };
}
