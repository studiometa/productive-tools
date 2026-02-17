/**
 * Simple configuration storage using native Node.js fs
 * Respects XDG Base Directory specification
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export class ConfigStore<T extends Record<string, unknown>> {
  private configPath: string;
  private cache: T | null = null;

  constructor(projectName: string) {
    const configDir = this.getConfigDir();
    this.configPath = join(configDir, projectName, 'config.json');
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
