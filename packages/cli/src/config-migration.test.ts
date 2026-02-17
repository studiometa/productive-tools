import { describe, it, expect, vi } from 'vitest';

// Use vi.hoisted so the spy is created before any module evaluation
const { stderrSpy } = vi.hoisted(() => ({
  stderrSpy: vi.spyOn(console, 'error').mockImplementation(() => {}),
}));

// Mock ConfigStore to simulate a migration scenario (no real FS access)
vi.mock('@studiometa/productive-api', () => {
  class MockConfigStore {
    didMigrate = true;
    get = vi.fn();
    set = vi.fn();
    delete = vi.fn();
    clear = vi.fn();
    store = {};
  }
  return {
    ConfigStore: MockConfigStore,
  };
});

vi.mock('./utils/keychain-store.js', () => ({
  isKeychainAvailable: vi.fn().mockReturnValue(false),
  getKeychainBackend: vi.fn().mockReturnValue('none'),
  getKeychainValue: vi.fn().mockReturnValue(null),
  setKeychainValue: vi.fn().mockReturnValue(false),
  deleteKeychainValue: vi.fn().mockReturnValue(false),
  isSecureKey: vi.fn().mockReturnValue(false),
  SECURE_KEYS: ['apiToken'],
}));

describe('config migration notice', () => {
  it('prints migration notice to stderr when config was migrated', async () => {
    // Import triggers module evaluation, which checks config.didMigrate
    await import('./config.js');

    expect(stderrSpy).toHaveBeenCalledWith(
      expect.stringContaining('Config migrated from ~/.config/productive-cli/'),
    );

    stderrSpy.mockRestore();
  });
});
