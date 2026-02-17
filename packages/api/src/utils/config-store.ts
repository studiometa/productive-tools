/**
 * Simple configuration storage using native Node.js fs
 * Respects XDG Base Directory specification
 *
 * On macOS, uses ~/Library/Application Support by default.
 * If a legacy config exists at ~/.config (from older versions),
 * it is automatically migrated on first access.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync, rmdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';

export class ConfigStore<T extends Record<string, unknown>> {
  private configPath: string;
  private cache: T | null = null;
  private migrated = false;

  constructor(projectName: string) {
    const configDir = this.getConfigDir();
    this.configPath = join(configDir, projectName, 'config.json');
    this.migrateFromLegacyPath(projectName);
  }

  private getConfigDir(): string {
    const platform = process.platform;

    // Respect XDG Base Directory specification
    if (platform === 'win32') {
      // Windows: use APPDATA or fallback
      return process.env.APPDATA || join(homedir(), 'AppData', 'Roaming');
    } else if (platform === 'darwin') {
      // macOS: respect XDG_CONFIG_HOME or use standard location
      return process.env.XDG_CONFIG_HOME || join(homedir(), 'Library', 'Application Support');
    } else {
      // Linux/Unix: respect XDG_CONFIG_HOME or fallback to ~/.config
      return process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
    }
  }

  /**
   * Migrate config from legacy ~/.config path to the macOS-native path.
   *
   * Earlier versions used ~/.config on all platforms. On macOS (without
   * XDG_CONFIG_HOME set), the correct path is ~/Library/Application Support.
   * This migrates data automatically and removes the legacy file.
   */
  private migrateFromLegacyPath(projectName: string): void {
    // Only migrate on macOS when XDG_CONFIG_HOME is not set
    if (process.platform !== 'darwin' || process.env.XDG_CONFIG_HOME) {
      return;
    }

    const legacyPath = join(homedir(), '.config', projectName, 'config.json');

    // No legacy file to migrate from
    if (!existsSync(legacyPath)) {
      return;
    }

    // Read legacy config
    let legacyData: T;
    try {
      const raw = readFileSync(legacyPath, 'utf-8');
      legacyData = JSON.parse(raw) as T;
    } catch {
      return;
    }

    // Nothing to migrate if legacy config is empty
    if (Object.keys(legacyData).length === 0) {
      return;
    }

    // Load current config (may be empty or have some values)
    const currentData = this.load();

    // Merge: legacy values fill in missing keys, current values take precedence
    const merged = { ...legacyData, ...currentData } as T;

    // Only write if there's actually something new to add
    const currentKeys = Object.keys(currentData);
    const legacyKeys = Object.keys(legacyData);
    const hasNewKeys = legacyKeys.some((key) => !currentKeys.includes(key));

    if (hasNewKeys) {
      this.save(merged);
      this.migrated = true;
    }

    // Clean up legacy file
    try {
      unlinkSync(legacyPath);
      // Remove directory if empty
      const legacyDir = dirname(legacyPath);
      rmdirSync(legacyDir);
    } catch {
      // Ignore errors (directory not empty, permissions, etc.)
    }
  }

  /**
   * Whether a migration from legacy config path occurred.
   */
  get didMigrate(): boolean {
    return this.migrated;
  }

  private ensureConfigDir(): void {
    const dir = this.configPath.substring(0, this.configPath.lastIndexOf('/'));
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  get<K extends keyof T>(key: K): T[K] | undefined {
    const config = this.load();
    return config[key];
  }

  set<K extends keyof T>(key: K, value: T[K]): void {
    const config = this.load();
    config[key] = value;
    this.save(config);
  }

  delete<K extends keyof T>(key: K): void {
    const config = this.load();
    delete config[key];
    this.save(config);
  }

  clear(): void {
    this.cache = {} as T;
    this.save({} as T);
  }

  get store(): T {
    return this.load();
  }

  private load(): T {
    if (this.cache) {
      return this.cache;
    }

    try {
      const data = readFileSync(this.configPath, 'utf-8');
      this.cache = JSON.parse(data) as T;
      return this.cache;
    } catch {
      this.cache = {} as T;
      return this.cache;
    }
  }

  private save(config: T): void {
    this.ensureConfigDir();
    writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
    this.cache = config;
  }
}
