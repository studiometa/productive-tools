import { execSync, spawnSync } from 'node:child_process';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock child_process before importing the module
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
  spawnSync: vi.fn(),
}));

// Import after mocking
import {
  isKeychainAvailable,
  getKeychainBackend,
  getKeychainValue,
  setKeychainValue,
  deleteKeychainValue,
  isSecureKey,
  SECURE_KEYS,
  resetPlatformCache,
} from '../keychain-store.js';

describe('keychain-store', () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the cached platform detection before each test
    resetPlatformCache();
  });

  afterEach(() => {
    // Restore platform
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
    });
    resetPlatformCache();
  });

  describe('isSecureKey', () => {
    it('should return true for apiToken', () => {
      expect(isSecureKey('apiToken')).toBe(true);
    });

    it('should return false for non-secure keys', () => {
      expect(isSecureKey('organizationId')).toBe(false);
      expect(isSecureKey('userId')).toBe(false);
      expect(isSecureKey('baseUrl')).toBe(false);
    });
  });

  describe('SECURE_KEYS', () => {
    it('should contain apiToken', () => {
      expect(SECURE_KEYS).toContain('apiToken');
    });
  });

  describe('macOS (darwin)', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
      });
      resetPlatformCache();
    });

    describe('isKeychainAvailable', () => {
      it('should return true on macOS', () => {
        expect(isKeychainAvailable()).toBe(true);
      });
    });

    describe('getKeychainBackend', () => {
      it("should return 'macOS Keychain' on darwin", () => {
        expect(getKeychainBackend()).toBe('macOS Keychain');
      });
    });

    describe('getKeychainValue', () => {
      it('should return value from keychain', () => {
        (spawnSync as any).mockReturnValueOnce({
          status: 0,
          stdout: 'secret-value\n',
        });
        const result = getKeychainValue('apiToken');
        expect(result).toBe('secret-value');
        expect(spawnSync).toHaveBeenCalledWith(
          'security',
          ['find-generic-password', '-s', 'productive-cli', '-a', 'apiToken', '-w'],
          expect.any(Object),
        );
      });

      it('should return null when key not found', () => {
        (spawnSync as any).mockReturnValueOnce({
          status: 44, // security command returns non-zero when not found
          stdout: '',
        });
        const result = getKeychainValue('apiToken');
        expect(result).toBeNull();
      });

      it('should return null when stdout is empty', () => {
        (spawnSync as any).mockReturnValueOnce({
          status: 0,
          stdout: '',
        });
        const result = getKeychainValue('apiToken');
        expect(result).toBeNull();
      });
    });

    describe('setKeychainValue', () => {
      it('should store value in keychain', () => {
        // First call is delete (ignore result), second is add
        (spawnSync as any)
          .mockReturnValueOnce({ status: 0 }) // delete
          .mockReturnValueOnce({ status: 0 }); // add
        const result = setKeychainValue('apiToken', 'new-secret');
        expect(result).toBe(true);
        expect(spawnSync).toHaveBeenCalledWith(
          'security',
          [
            'add-generic-password',
            '-s',
            'productive-cli',
            '-a',
            'apiToken',
            '-w',
            'new-secret',
            '-U',
          ],
          expect.any(Object),
        );
      });

      it('should return false when add fails', () => {
        (spawnSync as any)
          .mockReturnValueOnce({ status: 0 }) // delete
          .mockReturnValueOnce({ status: 1 }); // add fails
        const result = setKeychainValue('apiToken', 'new-secret');
        expect(result).toBe(false);
      });
    });

    describe('deleteKeychainValue', () => {
      it('should delete value from keychain', () => {
        (spawnSync as any).mockReturnValueOnce({ status: 0 });
        const result = deleteKeychainValue('apiToken');
        expect(result).toBe(true);
        expect(spawnSync).toHaveBeenCalledWith(
          'security',
          ['delete-generic-password', '-s', 'productive-cli', '-a', 'apiToken'],
          expect.any(Object),
        );
      });

      it('should return false when key not found', () => {
        (spawnSync as any).mockReturnValueOnce({ status: 44 });
        const result = deleteKeychainValue('apiToken');
        expect(result).toBe(false);
      });
    });
  });

  describe('Linux with secret-tool', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
      });
      // Mock execSync to indicate secret-tool is available
      (execSync as any).mockReturnValue(Buffer.from('/usr/bin/secret-tool'));
      resetPlatformCache();
    });

    describe('isKeychainAvailable', () => {
      it('should return true when secret-tool is available', () => {
        expect(isKeychainAvailable()).toBe(true);
      });
    });

    describe('getKeychainBackend', () => {
      it("should return 'libsecret (Secret Service)' on linux", () => {
        expect(getKeychainBackend()).toBe('libsecret (Secret Service)');
      });
    });

    describe('getKeychainValue', () => {
      it('should return value from secret-tool', () => {
        (spawnSync as any).mockReturnValueOnce({
          status: 0,
          stdout: 'linux-secret\n',
        });
        const result = getKeychainValue('apiToken');
        expect(result).toBe('linux-secret');
        expect(spawnSync).toHaveBeenCalledWith(
          'secret-tool',
          ['lookup', 'service', 'productive-cli', 'account', 'apiToken'],
          expect.any(Object),
        );
      });

      it('should return null when key not found', () => {
        (spawnSync as any).mockReturnValueOnce({
          status: 1,
          stdout: '',
        });
        const result = getKeychainValue('apiToken');
        expect(result).toBeNull();
      });
    });

    describe('setKeychainValue', () => {
      it('should store value using secret-tool', () => {
        (spawnSync as any).mockReturnValue({ status: 0 });
        const result = setKeychainValue('apiToken', 'linux-new-secret');
        expect(result).toBe(true);
        expect(spawnSync).toHaveBeenCalledWith(
          'secret-tool',
          [
            'store',
            '--label',
            'productive-cli apiToken',
            'service',
            'productive-cli',
            'account',
            'apiToken',
          ],
          expect.objectContaining({
            input: 'linux-new-secret',
          }),
        );
      });

      it('should return false on error', () => {
        (spawnSync as any).mockReturnValue({ status: 1 });
        const result = setKeychainValue('apiToken', 'new-secret');
        expect(result).toBe(false);
      });
    });

    describe('deleteKeychainValue', () => {
      it('should delete value using secret-tool', () => {
        (spawnSync as any).mockReturnValueOnce({ status: 0 });
        const result = deleteKeychainValue('apiToken');
        expect(result).toBe(true);
        expect(spawnSync).toHaveBeenCalledWith(
          'secret-tool',
          ['clear', 'service', 'productive-cli', 'account', 'apiToken'],
          expect.any(Object),
        );
      });

      it('should return false when delete fails', () => {
        (spawnSync as any).mockReturnValueOnce({ status: 1 });
        const result = deleteKeychainValue('apiToken');
        expect(result).toBe(false);
      });
    });
  });

  describe('Linux without secret-tool', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
      });
      // Mock execSync to throw (secret-tool not found)
      (execSync as any).mockImplementation(() => {
        throw new Error('command not found');
      });
      resetPlatformCache();
    });

    describe('isKeychainAvailable', () => {
      it('should return false when secret-tool is not available', () => {
        expect(isKeychainAvailable()).toBe(false);
      });
    });

    describe('getKeychainBackend', () => {
      it("should return 'none' when secret-tool is not available", () => {
        expect(getKeychainBackend()).toBe('none');
      });
    });

    describe('operations', () => {
      it('getKeychainValue should return null', () => {
        expect(getKeychainValue('apiToken')).toBeNull();
      });

      it('setKeychainValue should return false', () => {
        expect(setKeychainValue('apiToken', 'value')).toBe(false);
      });

      it('deleteKeychainValue should return false', () => {
        expect(deleteKeychainValue('apiToken')).toBe(false);
      });
    });
  });

  describe('Unsupported platform (Windows)', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });
      resetPlatformCache();
    });

    describe('isKeychainAvailable', () => {
      it('should return false on unsupported platform', () => {
        expect(isKeychainAvailable()).toBe(false);
      });
    });

    describe('getKeychainBackend', () => {
      it("should return 'none' on unsupported platform", () => {
        expect(getKeychainBackend()).toBe('none');
      });
    });

    describe('operations', () => {
      it('getKeychainValue should return null on unsupported platform', () => {
        const result = getKeychainValue('apiToken');
        expect(result).toBeNull();
      });

      it('setKeychainValue should return false on unsupported platform', () => {
        const result = setKeychainValue('apiToken', 'value');
        expect(result).toBe(false);
      });

      it('deleteKeychainValue should return false on unsupported platform', () => {
        const result = deleteKeychainValue('apiToken');
        expect(result).toBe(false);
      });
    });
  });
});
