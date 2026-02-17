import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { handleAttachmentsCommand } from './command.js';

// Mock the handlers to avoid needing real API
vi.mock('./handlers.js', () => ({
  attachmentsList: vi.fn().mockResolvedValue(undefined),
  attachmentsGet: vi.fn().mockResolvedValue(undefined),
  attachmentsDelete: vi.fn().mockResolvedValue(undefined),
}));

// Mock config to avoid file system access
vi.mock('../../config.js', () => ({
  getConfig: vi.fn().mockReturnValue({
    apiToken: 'test-token',
    organizationId: 'test-org',
    baseUrl: 'https://api.productive.io/api/v2',
  }),
}));

// Mock cache with full interface - factory must be inline
vi.mock('../../utils/cache.js', () => {
  const mockCacheObj = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    setOrgId: vi.fn(),
    getCachedPeople: vi.fn(),
    getCachedProjects: vi.fn(),
    getCachedTaskLists: vi.fn(),
    findCachedPersonByEmail: vi.fn(),
    findCachedProjectByNumber: vi.fn(),
    findCachedTaskListByName: vi.fn(),
  };
  return {
    getCache: vi.fn().mockReturnValue(mockCacheObj),
    CacheStore: vi.fn().mockImplementation(() => mockCacheObj),
  };
});

describe('attachments command routing', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    // Reset mocks before each test
    const handlers = await import('./handlers.js');
    vi.mocked(handlers.attachmentsList).mockClear();
    vi.mocked(handlers.attachmentsGet).mockClear();
    vi.mocked(handlers.attachmentsDelete).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should route "list" subcommand to attachmentsList', async () => {
    const handlers = await import('./handlers.js');

    await handleAttachmentsCommand('list', [], {
      format: 'json',
      token: 'test-token',
      'org-id': 'test-org',
    });

    expect(handlers.attachmentsList).toHaveBeenCalled();
  });

  it('should route "ls" alias to attachmentsList', async () => {
    const handlers = await import('./handlers.js');

    await handleAttachmentsCommand('ls', [], {
      format: 'json',
      token: 'test-token',
      'org-id': 'test-org',
    });

    expect(handlers.attachmentsList).toHaveBeenCalled();
  });

  it('should route "get" subcommand to attachmentsGet', async () => {
    const handlers = await import('./handlers.js');

    await handleAttachmentsCommand('get', ['123'], {
      format: 'json',
      token: 'test-token',
      'org-id': 'test-org',
    });

    expect(handlers.attachmentsGet).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('should route "delete" subcommand to attachmentsDelete', async () => {
    const handlers = await import('./handlers.js');

    await handleAttachmentsCommand('delete', ['456'], {
      format: 'json',
      token: 'test-token',
      'org-id': 'test-org',
    });

    expect(handlers.attachmentsDelete).toHaveBeenCalledWith(['456'], expect.anything());
  });

  it('should route "rm" alias to attachmentsDelete', async () => {
    const handlers = await import('./handlers.js');

    await handleAttachmentsCommand('rm', ['789'], {
      format: 'json',
      token: 'test-token',
      'org-id': 'test-org',
    });

    expect(handlers.attachmentsDelete).toHaveBeenCalledWith(['789'], expect.anything());
  });

  it('should exit with error for unknown subcommand', async () => {
    await handleAttachmentsCommand('unknown', [], {
      format: 'json',
      token: 'test-token',
      'org-id': 'test-org',
    });

    expect(processExitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown attachments subcommand: unknown'),
    );
  });

  it('should use format option from -f shorthand', async () => {
    const handlers = await import('./handlers.js');

    await handleAttachmentsCommand('list', [], {
      f: 'table',
      token: 'test-token',
      'org-id': 'test-org',
    });

    expect(handlers.attachmentsList).toHaveBeenCalled();
  });

  it('should use default human format when no format specified', async () => {
    const handlers = await import('./handlers.js');

    await handleAttachmentsCommand('list', [], {
      token: 'test-token',
      'org-id': 'test-org',
    });

    expect(handlers.attachmentsList).toHaveBeenCalled();
  });

  it('should handle no-color option', async () => {
    const handlers = await import('./handlers.js');

    await handleAttachmentsCommand('list', [], {
      format: 'json',
      'no-color': true,
      token: 'test-token',
      'org-id': 'test-org',
    });

    expect(handlers.attachmentsList).toHaveBeenCalled();
  });
});
