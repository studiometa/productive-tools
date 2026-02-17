/**
 * Shared configuration for Productive.io tools.
 *
 * Reads from environment variables and a JSON config file.
 * Does NOT support keychain — CLI wraps this with keychain support.
 */

import type { ProductiveConfig } from './types.js';

import { ConfigStore } from './utils/config-store.js';

const config = new ConfigStore<ProductiveConfig>('productive-cli');

/**
 * Get configuration from multiple sources with priority:
 * 1. Environment variables (highest priority)
 * 2. Config file (lowest priority)
 */
export function getConfig(): ProductiveConfig {
  return {
    apiToken: process.env.PRODUCTIVE_API_TOKEN || config.get('apiToken'),
    organizationId: process.env.PRODUCTIVE_ORG_ID || config.get('organizationId'),
    userId: process.env.PRODUCTIVE_USER_ID || config.get('userId'),
    baseUrl:
      process.env.PRODUCTIVE_BASE_URL ||
      config.get('baseUrl') ||
      'https://api.productive.io/api/v2',
  };
}

/**
 * Set a config value in the JSON config file.
 */
export function setConfig(key: keyof ProductiveConfig, value: string): void {
  config.set(key, value);
}

/**
 * Delete a config value.
 */
export function deleteConfig(key: keyof ProductiveConfig): void {
  config.delete(key);
}

/**
 * Clear all config values.
 */
export function clearConfig(): void {
  config.clear();
}
