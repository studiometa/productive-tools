import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  existsSync: vi.fn(),
}));

vi.mock('node:os', () => ({
  homedir: vi.fn(() => '/home/test'),
}));

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

import { ConfigStore } from './config-store.js';

beforeEach(() => {
  vi.clearAllMocks();
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
      const orig = process.env.XDG_CONFIG_HOME;
      process.env.XDG_CONFIG_HOME = '/custom/config';
      vi.mocked(readFileSync).mockReturnValue('{}');
      const store = new ConfigStore('my-app');
      store.get('key');
      expect(readFileSync).toHaveBeenCalledWith(expect.stringContaining('/custom/config'), 'utf-8');
      process.env.XDG_CONFIG_HOME = orig;
    });
  });
});
