import { ConfigStore } from "./utils/config-store.js";
import {
  getKeychainValue,
  setKeychainValue,
  deleteKeychainValue,
  isSecureKey,
  isKeychainAvailable,
  getKeychainBackend,
} from "./utils/keychain-store.js";
import type { ProductiveConfig } from "./types.js";

const config = new ConfigStore<ProductiveConfig>("productive-cli");

/**
 * Get a config value, checking keychain first for secure keys
 */
function getConfigValue(key: keyof ProductiveConfig): string | undefined {
  const keyStr = String(key);
  // For secure keys, try keychain first
  if (isSecureKey(keyStr)) {
    const keychainValue = getKeychainValue(keyStr);
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
  cliOptions?: Record<string, string | boolean>,
): ProductiveConfig {
  return {
    apiToken:
      (cliOptions?.["api-token"] as string) ||
      (cliOptions?.token as string) ||
      process.env.PRODUCTIVE_API_TOKEN ||
      getConfigValue("apiToken"),
    organizationId:
      (cliOptions?.["org-id"] as string) ||
      (cliOptions?.["organization-id"] as string) ||
      process.env.PRODUCTIVE_ORG_ID ||
      getConfigValue("organizationId"),
    userId:
      (cliOptions?.["user-id"] as string) ||
      process.env.PRODUCTIVE_USER_ID ||
      getConfigValue("userId"),
    baseUrl:
      (cliOptions?.["base-url"] as string) ||
      process.env.PRODUCTIVE_BASE_URL ||
      getConfigValue("baseUrl") ||
      "https://api.productive.io/api/v2",
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
  const useKeychain = options?.useKeychain ?? isSecureKey(keyStr);

  if (useKeychain && isKeychainAvailable()) {
    const success = setKeychainValue(keyStr, value);
    if (success) {
      // Remove from config file if it exists there
      if (config.get(key)) {
        config.delete(key);
      }
      return { stored: true, location: getKeychainBackend() };
    }
  }

  // Fall back to config file
  config.set(key, value);
  return { stored: true, location: "config file" };
}

/**
 * Delete a config value from both keychain and config file
 */
export function deleteConfigValue(key: keyof ProductiveConfig): void {
  const keyStr = String(key);
  // Try to delete from keychain
  if (isSecureKey(keyStr)) {
    deleteKeychainValue(keyStr);
  }
  // Also delete from config file
  config.delete(key);
}

export function clearConfig(): void {
  // Clear secure keys from keychain
  if (isKeychainAvailable()) {
    deleteKeychainValue("apiToken");
  }
  config.clear();
}

export function showConfig(): ProductiveConfig {
  return config.store;
}

// Re-export keychain utilities for use in commands
export {
  isKeychainAvailable,
  getKeychainBackend,
} from "./utils/keychain-store.js";

export function validateConfig(): { valid: boolean; missing: string[] } {
  const cfg = getConfig();
  const missing: string[] = [];

  if (!cfg.apiToken) missing.push("apiToken");
  if (!cfg.organizationId) missing.push("organizationId");
  if (!cfg.userId) missing.push("userId");

  return {
    valid: missing.length === 0,
    missing,
  };
}
