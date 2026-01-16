import { ConfigStore } from './utils/config-store.js';
import type { ProductiveConfig } from './types.js';

const config = new ConfigStore<ProductiveConfig>('productive-cli');

/**
 * Get configuration from multiple sources with priority:
 * 1. CLI arguments (highest priority)
 * 2. Environment variables
 * 3. Config file (lowest priority)
 */
export function getConfig(cliOptions?: Record<string, string | boolean>): ProductiveConfig {
  return {
    apiToken: 
      (cliOptions?.['api-token'] as string) ||
      (cliOptions?.token as string) ||
      config.get('apiToken') || 
      process.env.PRODUCTIVE_API_TOKEN,
    organizationId: 
      (cliOptions?.['org-id'] as string) ||
      (cliOptions?.['organization-id'] as string) ||
      config.get('organizationId') || 
      process.env.PRODUCTIVE_ORG_ID,
    userId: 
      (cliOptions?.['user-id'] as string) ||
      config.get('userId') || 
      process.env.PRODUCTIVE_USER_ID,
    baseUrl: 
      (cliOptions?.['base-url'] as string) ||
      config.get('baseUrl') || 
      process.env.PRODUCTIVE_BASE_URL || 
      'https://api.productive.io/api/v2',
  };
}

export function setConfig(key: keyof ProductiveConfig, value: string): void {
  config.set(key, value);
}

export function clearConfig(): void {
  config.clear();
}

export function showConfig(): ProductiveConfig {
  return config.store;
}

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
