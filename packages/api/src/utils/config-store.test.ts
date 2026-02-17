import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  existsSync: vi.fn(),
  unlinkSync: vi.fn(),
  rmdirSync: vi.fn(),
}));

vi.mock('node:os', () => ({
  homedir: vi.fn(() => '/home/test'),
}));

import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync, rmdirSync } from 'node:fs';

import { ConfigStore } from './config-store.js';

let origPlatform: PropertyDescriptor | undefined;
let origXdgConfigHome: string | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  origPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
  origXdgConfigHome = process.env.XDG_CONFIG_HOME;
  delete process.env.XDG_CONFIG_HOME;
  // Default to linux so macOS migration doesn't trigger in most tests
  Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
});

afterEach(() => {
  if (origPlatform) {
    Object.defineProperty(process, 'platform', origPlatform);
  }
  if (origXdgConfigHome !== undefined) {
    process.env.XDG_CONFIG_HOME = origXdgConfigHome;
  } else {
    delete process.env.XDG_CONFIG_HOME;
  }
});

describe('ConfigStore', () => {
  it('creates instance with config path', () => {
    const store = new ConfigStore('my-app');
    expect(store).toBeDefined();
  });

  describe('get', () => {
    it('reads from config file', () => {
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ apiToken: 'abc' }));
      const store = new ConfigStore('my-app');
      expect(store.get('apiToken')).toBe('abc');
    });

    it('returns undefined for missing key', () => {
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({}));
      const store = new ConfigStore('my-app');
      expect(store.get('apiToken')).toBeUndefined();
    });

    it('returns empty object when file does not exist', () => {
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('ENOENT');
      });
      const store = new ConfigStore('my-app');
      expect(store.get('apiToken')).toBeUndefined();
    });

    it('uses cache on second read', () => {
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ key: 'val' }));
      const store = new ConfigStore('my-app');
      store.get('key');
      store.get('key');
      expect(readFileSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('set', () => {
    it('writes to config file', () => {
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({}));
      vi.mocked(existsSync).mockReturnValue(true);
      const store = new ConfigStore('my-app');
      store.set('apiToken', 'new-token');
      expect(writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('my-app'),
        expect.stringContaining('new-token'),
        'utf-8',
      );
    });

    it('creates directory if missing', () => {
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({}));
      vi.mocked(existsSync).mockReturnValue(false);
      const store = new ConfigStore('my-app');
      store.set('key', 'value');
      expect(mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });
  });

  describe('delete', () => {
    it('removes key from config', () => {
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ a: '1', b: '2' }));
      vi.mocked(existsSync).mockReturnValue(true);
      const store = new ConfigStore('my-app');
      store.delete('a');
      const written = JSON.parse(vi.mocked(writeFileSync).mock.calls[0][1] as string);
      expect(written.a).toBeUndefined();
      expect(written.b).toBe('2');
    });
  });

  describe('clear', () => {
    it('clears all config', () => {
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ a: '1' }));
      vi.mocked(existsSync).mockReturnValue(true);
      const store = new ConfigStore('my-app');
      store.clear();
      const written = JSON.parse(vi.mocked(writeFileSync).mock.calls[0][1] as string);
      expect(written).toEqual({});
    });
  });

  describe('store getter', () => {
    it('returns the full config', () => {
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ a: '1', b: '2' }));
      const store = new ConfigStore('my-app');
      expect(store.store).toEqual({ a: '1', b: '2' });
    });
  });

  describe('platform-specific config dir', () => {
    it('uses XDG_CONFIG_HOME when set', () => {
      process.env.XDG_CONFIG_HOME = '/custom/config';
      vi.mocked(readFileSync).mockReturnValue('{}');
      const store = new ConfigStore('my-app');
      store.get('key');
      expect(readFileSync).toHaveBeenCalledWith(expect.stringContaining('/custom/config'), 'utf-8');
    });
  });

  describe('legacy config migration', () => {
    const legacyPath = '/home/test/.config/my-app/config.json';
    const nativePath = '/home/test/Library/Application Support/my-app/config.json';

    beforeEach(() => {
      Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    });

    it('migrates legacy config to macOS-native path', () => {
      const legacyData = { organizationId: '30059', userId: '500521' };

      vi.mocked(existsSync).mockImplementation((path) => {
        if (path === legacyPath) return true;
        return true; // ensureConfigDir
      });

      vi.mocked(readFileSync).mockImplementation((path) => {
        if (path === legacyPath) return JSON.stringify(legacyData);
        // Current config is empty (file not found or empty)
        throw new Error('ENOENT');
      });

      const store = new ConfigStore('my-app');

      // Should have written merged config to native path
      expect(writeFileSync).toHaveBeenCalledWith(
        nativePath,
        JSON.stringify(legacyData, null, 2),
        'utf-8',
      );

      // Should have cleaned up legacy file
      expect(unlinkSync).toHaveBeenCalledWith(legacyPath);
      expect(rmdirSync).toHaveBeenCalledWith('/home/test/.config/my-app');

      // Should report migration
      expect(store.didMigrate).toBe(true);

      // Should return migrated values
      expect(store.get('organizationId')).toBe('30059');
      expect(store.get('userId')).toBe('500521');
    });

    it('merges legacy config with existing native config (native takes precedence)', () => {
      const legacyData = { organizationId: '30059', userId: '500521', baseUrl: 'https://old.api' };
      const nativeData = { organizationId: '99999' };

      vi.mocked(existsSync).mockReturnValue(true);

      vi.mocked(readFileSync).mockImplementation((path) => {
        if (path === legacyPath) return JSON.stringify(legacyData);
        return JSON.stringify(nativeData);
      });

      const store = new ConfigStore('my-app');

      // Native value should win for organizationId
      expect(store.get('organizationId')).toBe('99999');
      // Legacy values should fill in missing keys
      expect(store.get('userId')).toBe('500521');
      expect(store.get('baseUrl')).toBe('https://old.api');
      expect(store.didMigrate).toBe(true);
    });

    it('does not migrate when legacy config is empty', () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        if (path === legacyPath) return true;
        return false;
      });

      vi.mocked(readFileSync).mockImplementation((path) => {
        if (path === legacyPath) return JSON.stringify({});
        throw new Error('ENOENT');
      });

      const store = new ConfigStore('my-app');

      // Should not have written anything (no save calls from migration)
      expect(writeFileSync).not.toHaveBeenCalled();
      expect(store.didMigrate).toBe(false);
    });

    it('does not migrate when legacy file does not exist', () => {
      vi.mocked(existsSync).mockReturnValue(false);
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('ENOENT');
      });

      const store = new ConfigStore('my-app');

      expect(writeFileSync).not.toHaveBeenCalled();
      expect(unlinkSync).not.toHaveBeenCalled();
      expect(store.didMigrate).toBe(false);
    });

    it('does not migrate when XDG_CONFIG_HOME is set', () => {
      process.env.XDG_CONFIG_HOME = '/custom/config';

      vi.mocked(readFileSync).mockReturnValue('{}');
      vi.mocked(existsSync).mockReturnValue(false);

      const store = new ConfigStore('my-app');

      expect(unlinkSync).not.toHaveBeenCalled();
      expect(store.didMigrate).toBe(false);
    });

    it('does not migrate on non-macOS platforms', () => {
      Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });

      vi.mocked(readFileSync).mockReturnValue('{}');
      vi.mocked(existsSync).mockReturnValue(false);

      const store = new ConfigStore('my-app');

      expect(unlinkSync).not.toHaveBeenCalled();
      expect(store.didMigrate).toBe(false);
    });

    it('does not migrate when native config already has all keys', () => {
      const legacyData = { organizationId: '30059' };
      const nativeData = { organizationId: '99999' };

      vi.mocked(existsSync).mockReturnValue(true);

      vi.mocked(readFileSync).mockImplementation((path) => {
        if (path === legacyPath) return JSON.stringify(legacyData);
        return JSON.stringify(nativeData);
      });

      const store = new ConfigStore('my-app');

      // No new keys to add, so no write from migration
      expect(writeFileSync).not.toHaveBeenCalled();
      expect(store.didMigrate).toBe(false);

      // Legacy file should still be cleaned up
      expect(unlinkSync).toHaveBeenCalledWith(legacyPath);
    });

    it('handles unreadable legacy file gracefully', () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        if (path === legacyPath) return true;
        return false;
      });

      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('EACCES');
      });

      // Should not throw
      const store = new ConfigStore('my-app');
      expect(store.didMigrate).toBe(false);
    });

    it('handles legacy cleanup errors gracefully', () => {
      const legacyData = { userId: '500521' };

      vi.mocked(existsSync).mockReturnValue(true);

      vi.mocked(readFileSync).mockImplementation((path) => {
        if (path === legacyPath) return JSON.stringify(legacyData);
        throw new Error('ENOENT');
      });

      vi.mocked(unlinkSync).mockImplementation(() => {
        throw new Error('EPERM');
      });

      // Should not throw even if cleanup fails
      const store = new ConfigStore('my-app');
      expect(store.didMigrate).toBe(true);
      expect(store.get('userId')).toBe('500521');
    });
  });
});
