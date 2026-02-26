import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { formatBytes, formatDuration, showCacheHelp, handleCacheCommand } from './cache.js';

// Mock dependencies before imports
const mockSqliteCache = {
  cacheStats: vi.fn(),
  getStats: vi.fn(),
  getRefreshQueueCount: vi.fn(),
  cacheInvalidate: vi.fn(),
  clear: vi.fn(),
  upsertProjects: vi.fn(),
  upsertPeople: vi.fn(),
  upsertServices: vi.fn(),
  close: vi.fn(),
};

vi.mock('../utils/sqlite-cache.js', () => ({
  getSqliteCache: vi.fn(() => mockSqliteCache),
}));

const mockCacheStore = {
  setOrgId: vi.fn(),
  getPendingRefreshJobsAsync: vi.fn(),
  clearRefreshQueueAsync: vi.fn(),
};

vi.mock('../utils/cache.js', () => ({
  getCache: vi.fn(() => mockCacheStore),
}));

const mockApi = {
  getProjects: vi.fn(),
  getPeople: vi.fn(),
  getServices: vi.fn(),
};

vi.mock('../api.js', () => {
  class MockProductiveApiError extends Error {
    statusCode: number;
    constructor(message: string, statusCode = 500) {
      super(message);
      this.name = 'ProductiveApiError';
      this.statusCode = statusCode;
    }
  }

  return {
    ProductiveApi: vi.fn().mockImplementation(function () {
      return mockApi;
    }),
    ProductiveApiError: MockProductiveApiError,
  };
});

vi.mock('../utils/spinner.js', () => ({
  Spinner: vi.fn().mockImplementation(function () {
    return {
      start: vi.fn(),
      stop: vi.fn(),
      succeed: vi.fn(),
      fail: vi.fn(),
      setText: vi.fn(),
    };
  }),
}));

describe('cache command', () => {
  describe('formatBytes', () => {
    it('should format 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    it('should format bytes', () => {
      expect(formatBytes(500)).toBe('500 B');
    });

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(2048)).toBe('2 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1024 * 1024 * 5.5)).toBe('5.5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatBytes(1024 * 1024 * 1024 * 2.5)).toBe('2.5 GB');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds', () => {
      expect(formatDuration(0)).toBe('0s');
      expect(formatDuration(30)).toBe('30s');
      expect(formatDuration(59)).toBe('59s');
    });

    it('should format minutes', () => {
      expect(formatDuration(60)).toBe('1m');
      expect(formatDuration(120)).toBe('2m');
      expect(formatDuration(3599)).toBe('59m');
    });

    it('should format hours', () => {
      expect(formatDuration(3600)).toBe('1h');
      expect(formatDuration(7200)).toBe('2h');
      expect(formatDuration(86399)).toBe('23h');
    });

    it('should format days', () => {
      expect(formatDuration(86400)).toBe('1d');
      expect(formatDuration(172800)).toBe('2d');
      expect(formatDuration(604800)).toBe('7d');
    });
  });

  describe('showCacheHelp', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should show general help without subcommand', () => {
      showCacheHelp();
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.flat().join('');
      expect(output).toContain('productive cache');
      expect(output).toContain('status');
      expect(output).toContain('clear');
      expect(output).toContain('sync');
      expect(output).toContain('queue');
    });

    it('should show status subcommand help', () => {
      showCacheHelp('status');
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.flat().join('');
      expect(output).toContain('cache status');
      expect(output).toContain('Show cache statistics');
    });

    it('should show clear subcommand help', () => {
      showCacheHelp('clear');
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.flat().join('');
      expect(output).toContain('cache clear');
      expect(output).toContain('Clear cached data');
    });

    it('should show sync subcommand help', () => {
      showCacheHelp('sync');
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.flat().join('');
      expect(output).toContain('cache sync');
      expect(output).toContain('Sync reference data');
    });

    it('should show queue subcommand help', () => {
      showCacheHelp('queue');
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.flat().join('');
      expect(output).toContain('cache queue');
      expect(output).toContain('background refresh queue');
    });
  });

  describe('handleCacheCommand', () => {
    const originalEnv = { ...process.env };
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let processExitSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      process.env.PRODUCTIVE_ORG_ID = 'test-org-123';
      // Reset call history on all mock functions (but not implementations)
      Object.values(mockSqliteCache).forEach((fn) =>
        (fn as ReturnType<typeof vi.fn>).mockReset?.(),
      );
      Object.values(mockCacheStore).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockReset?.());
      Object.values(mockApi).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockReset?.());
    });

    afterEach(() => {
      process.env = { ...originalEnv };
      vi.restoreAllMocks();
    });

    describe('unknown subcommand', () => {
      it('should exit with error for unknown subcommand', async () => {
        await handleCacheCommand('unknown', [], { 'org-id': 'test-org' });
        expect(processExitSpy).toHaveBeenCalledWith(1);
      });
    });

    describe('status subcommand', () => {
      beforeEach(() => {
        mockSqliteCache.cacheStats.mockResolvedValue({
          entries: 42,
          size: 1024 * 512,
          oldestAge: 300,
        });
        mockSqliteCache.getStats.mockResolvedValue({
          projects: 150,
          people: 85,
          services: 30,
          dbSize: 1024 * 1024 * 2,
        });
        mockSqliteCache.getRefreshQueueCount.mockResolvedValue(3);
        mockSqliteCache.close.mockReturnValue(undefined);
      });

      it('should show cache status in human format', async () => {
        await handleCacheCommand('status', [], { 'org-id': 'test-org' });

        expect(mockSqliteCache.cacheStats).toHaveBeenCalled();
        expect(mockSqliteCache.getStats).toHaveBeenCalled();
        expect(mockSqliteCache.getRefreshQueueCount).toHaveBeenCalled();
        expect(mockSqliteCache.close).toHaveBeenCalled();
        expect(consoleLogSpy).toHaveBeenCalled();
        const output = consoleLogSpy.mock.calls.flat().join('');
        expect(output).toContain('Cache Statistics');
      });

      it('should show cache status in json format', async () => {
        await handleCacheCommand('status', [], { 'org-id': 'test-org', format: 'json' });

        expect(mockSqliteCache.cacheStats).toHaveBeenCalled();
        expect(consoleLogSpy).toHaveBeenCalled();
        const output = consoleLogSpy.mock.calls.flat().join('');
        const parsed = JSON.parse(output);
        expect(parsed).toHaveProperty('query_cache');
        expect(parsed).toHaveProperty('reference_cache');
        expect(parsed).toHaveProperty('refresh_queue');
        expect(parsed).toHaveProperty('database');
        expect(parsed.query_cache.entries).toBe(42);
        expect(parsed.reference_cache.projects).toBe(150);
        expect(parsed.refresh_queue.pending_jobs).toBe(3);
      });

      it('should use env var for org-id', async () => {
        await handleCacheCommand('status', [], {});

        expect(mockSqliteCache.cacheStats).toHaveBeenCalled();
      });

      it('should throw error when org-id is missing', async () => {
        delete process.env.PRODUCTIVE_ORG_ID;
        await handleCacheCommand('status', [], {});
        expect(processExitSpy).toHaveBeenCalledWith(4);
      });

      it('should close db even when stats throws', async () => {
        mockSqliteCache.cacheStats.mockRejectedValue(new Error('DB error'));

        await handleCacheCommand('status', [], { 'org-id': 'test-org' });
        expect(mockSqliteCache.close).toHaveBeenCalled();
      });

      it('should show 0 entries without "oldest entry" line', async () => {
        mockSqliteCache.cacheStats.mockResolvedValue({
          entries: 0,
          size: 0,
          oldestAge: 0,
        });

        await handleCacheCommand('status', [], { 'org-id': 'test-org' });

        const output = consoleLogSpy.mock.calls.flat().join('');
        expect(output).not.toContain('Oldest entry:');
      });

      it('should show oldest entry when entries > 0', async () => {
        mockSqliteCache.cacheStats.mockResolvedValue({
          entries: 5,
          size: 2048,
          oldestAge: 600,
        });

        await handleCacheCommand('status', [], { 'org-id': 'test-org' });

        const output = consoleLogSpy.mock.calls.flat().join('');
        expect(output).toContain('Oldest entry:');
      });

      it('should show queue hint when pending jobs > 0', async () => {
        mockSqliteCache.getRefreshQueueCount.mockResolvedValue(5);

        await handleCacheCommand('status', [], { 'org-id': 'test-org' });

        const output = consoleLogSpy.mock.calls.flat().join('');
        expect(output).toContain('will be processed');
      });
    });

    describe('clear subcommand', () => {
      beforeEach(() => {
        mockSqliteCache.cacheInvalidate.mockResolvedValue(10);
        mockSqliteCache.clear.mockResolvedValue(undefined);
        mockSqliteCache.close.mockReturnValue(undefined);
      });

      it('should clear all cache when no pattern', async () => {
        await handleCacheCommand('clear', [], { 'org-id': 'test-org' });

        expect(mockSqliteCache.clear).toHaveBeenCalled();
        expect(mockSqliteCache.close).toHaveBeenCalled();
      });

      it('should clear cache with pattern', async () => {
        await handleCacheCommand('clear', ['projects'], { 'org-id': 'test-org' });

        expect(mockSqliteCache.cacheInvalidate).toHaveBeenCalledWith('projects');
        expect(mockSqliteCache.close).toHaveBeenCalled();
      });

      it('should clear cache with time pattern', async () => {
        await handleCacheCommand('clear', ['time'], { 'org-id': 'test-org' });

        expect(mockSqliteCache.cacheInvalidate).toHaveBeenCalledWith('time');
      });

      it('should throw error when org-id is missing', async () => {
        delete process.env.PRODUCTIVE_ORG_ID;
        await handleCacheCommand('clear', [], {});
        expect(processExitSpy).toHaveBeenCalledWith(4);
      });

      it('should close db even when clear throws', async () => {
        mockSqliteCache.clear.mockRejectedValue(new Error('DB error'));

        await handleCacheCommand('clear', [], { 'org-id': 'test-org' });
        expect(mockSqliteCache.close).toHaveBeenCalled();
      });
    });

    describe('sync subcommand', () => {
      beforeEach(() => {
        mockApi.getProjects.mockResolvedValue({
          data: [
            {
              id: '1',
              attributes: { name: 'Proj 1', project_number: 'PRJ-001', archived: false },
              relationships: {},
            },
          ],
          meta: { total_pages: 1 },
        });
        mockApi.getPeople.mockResolvedValue({
          data: [
            {
              id: '1',
              attributes: {
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                active: true,
              },
              relationships: {},
            },
          ],
          meta: { total_pages: 1 },
        });
        mockApi.getServices.mockResolvedValue({
          data: [{ id: '1', attributes: { name: 'Service 1' }, relationships: {} }],
          meta: { total_pages: 1 },
        });
        mockSqliteCache.upsertProjects.mockResolvedValue(undefined);
        mockSqliteCache.upsertPeople.mockResolvedValue(undefined);
        mockSqliteCache.upsertServices.mockResolvedValue(undefined);
        mockSqliteCache.getStats.mockResolvedValue({
          projects: 1,
          people: 1,
          services: 1,
          dbSize: 1024,
        });
        mockSqliteCache.close.mockReturnValue(undefined);
      });

      it('should sync all reference data in human format', async () => {
        await handleCacheCommand('sync', [], { 'org-id': 'test-org' });

        expect(mockApi.getProjects).toHaveBeenCalled();
        expect(mockApi.getPeople).toHaveBeenCalled();
        expect(mockApi.getServices).toHaveBeenCalled();
        expect(mockSqliteCache.upsertProjects).toHaveBeenCalled();
        expect(mockSqliteCache.upsertPeople).toHaveBeenCalled();
        expect(mockSqliteCache.upsertServices).toHaveBeenCalled();
        expect(mockSqliteCache.close).toHaveBeenCalled();
      });

      it('should sync all reference data in json format', async () => {
        await handleCacheCommand('sync', [], { 'org-id': 'test-org', format: 'json' });

        expect(consoleLogSpy).toHaveBeenCalled();
        const output = consoleLogSpy.mock.calls.flat().join('');
        const parsed = JSON.parse(output);
        expect(parsed.success).toBe(true);
        expect(parsed.synced).toHaveProperty('projects');
        expect(parsed.synced).toHaveProperty('people');
        expect(parsed.synced).toHaveProperty('services');
      });

      it('should throw error when org-id is missing', async () => {
        delete process.env.PRODUCTIVE_ORG_ID;
        await handleCacheCommand('sync', [], {});
        expect(processExitSpy).toHaveBeenCalledWith(4);
      });

      it('should handle pagination for projects (multiple pages)', async () => {
        let projectsPage = 0;
        mockApi.getProjects.mockImplementation(() => {
          projectsPage++;
          return Promise.resolve({
            data: [
              {
                id: String(projectsPage),
                attributes: { name: `Proj ${projectsPage}` },
                relationships: {},
              },
            ],
            meta: { total_pages: 2 },
          });
        });

        await handleCacheCommand('sync', [], { 'org-id': 'test-org' });

        expect(mockApi.getProjects).toHaveBeenCalledTimes(2);
      });

      it('should handle pagination for people (multiple pages)', async () => {
        let peoplePage = 0;
        mockApi.getPeople.mockImplementation(() => {
          peoplePage++;
          return Promise.resolve({
            data: [
              {
                id: String(peoplePage),
                attributes: {
                  first_name: `Person ${peoplePage}`,
                  last_name: 'X',
                  email: null,
                  active: true,
                },
                relationships: {},
              },
            ],
            meta: { total_pages: 2 },
          });
        });

        await handleCacheCommand('sync', [], { 'org-id': 'test-org' });

        expect(mockApi.getPeople).toHaveBeenCalledTimes(2);
      });

      it('should handle pagination for services (multiple pages)', async () => {
        let servicesPage = 0;
        mockApi.getServices.mockImplementation(() => {
          servicesPage++;
          return Promise.resolve({
            data: [
              {
                id: String(servicesPage),
                attributes: { name: `Svc ${servicesPage}` },
                relationships: {},
              },
            ],
            meta: { total_pages: 2 },
          });
        });

        await handleCacheCommand('sync', [], { 'org-id': 'test-org' });

        expect(mockApi.getServices).toHaveBeenCalledTimes(2);
      });

      it('should handle API errors during sync', async () => {
        mockApi.getProjects.mockRejectedValue(new Error('API error'));

        await handleCacheCommand('sync', [], { 'org-id': 'test-org' });
        expect(processExitSpy).toHaveBeenCalled();
      });

      it('should handle missing total_pages in meta', async () => {
        mockApi.getProjects.mockResolvedValue({
          data: [{ id: '1', attributes: { name: 'Proj 1' }, relationships: {} }],
          meta: {}, // no total_pages
        });

        await handleCacheCommand('sync', [], { 'org-id': 'test-org' });

        // Should only call once (defaults to 1 page)
        expect(mockApi.getProjects).toHaveBeenCalledTimes(1);
      });
    });

    describe('queue subcommand', () => {
      beforeEach(() => {
        mockCacheStore.setOrgId.mockReturnValue(undefined);
        mockCacheStore.getPendingRefreshJobsAsync.mockResolvedValue([]);
        mockCacheStore.clearRefreshQueueAsync.mockResolvedValue(0);
      });

      it('should show empty queue in human format', async () => {
        await handleCacheCommand('queue', [], { 'org-id': 'test-org' });

        expect(mockCacheStore.setOrgId).toHaveBeenCalledWith('test-org');
        expect(mockCacheStore.getPendingRefreshJobsAsync).toHaveBeenCalled();
        const output = consoleLogSpy.mock.calls.flat().join('');
        expect(output).toContain('Refresh Queue');
        expect(output).toContain('No pending refresh jobs');
      });

      it('should show queue with pending jobs in human format', async () => {
        const now = Date.now();
        mockCacheStore.getPendingRefreshJobsAsync.mockResolvedValue([
          {
            cacheKey: 'key-1',
            endpoint: '/projects',
            params: { page: 1 },
            queuedAt: now - 60000,
          },
          {
            cacheKey: 'key-2',
            endpoint: '/time_entries',
            params: {},
            queuedAt: now - 120000,
          },
        ]);

        await handleCacheCommand('queue', [], { 'org-id': 'test-org' });

        const output = consoleLogSpy.mock.calls.flat().join('');
        expect(output).toContain('/projects');
        expect(output).toContain('/time_entries');
        expect(output).toContain('pending job');
      });

      it('should show queue in json format', async () => {
        const now = Date.now();
        mockCacheStore.getPendingRefreshJobsAsync.mockResolvedValue([
          {
            cacheKey: 'key-1',
            endpoint: '/projects',
            params: { page: 1 },
            queuedAt: now - 30000,
          },
        ]);

        await handleCacheCommand('queue', [], { 'org-id': 'test-org', format: 'json' });

        const output = consoleLogSpy.mock.calls.flat().join('');
        const parsed = JSON.parse(output);
        expect(parsed).toHaveProperty('pending_jobs', 1);
        expect(parsed.jobs).toHaveLength(1);
        expect(parsed.jobs[0].endpoint).toBe('/projects');
        expect(parsed.jobs[0]).toHaveProperty('age_seconds');
        expect(parsed.jobs[0]).toHaveProperty('queued_at');
      });

      it('should clear queue with --clear flag in human format', async () => {
        mockCacheStore.clearRefreshQueueAsync.mockResolvedValue(5);

        await handleCacheCommand('queue', [], { 'org-id': 'test-org', clear: true });

        expect(mockCacheStore.clearRefreshQueueAsync).toHaveBeenCalled();
        expect(mockCacheStore.getPendingRefreshJobsAsync).not.toHaveBeenCalled();
      });

      it('should clear queue with --clear flag in json format', async () => {
        mockCacheStore.clearRefreshQueueAsync.mockResolvedValue(3);

        await handleCacheCommand('queue', [], {
          'org-id': 'test-org',
          clear: true,
          format: 'json',
        });

        const output = consoleLogSpy.mock.calls.flat().join('');
        const parsed = JSON.parse(output);
        expect(parsed.success).toBe(true);
        expect(parsed.cleared).toBe(3);
      });

      it('should throw error when org-id is missing', async () => {
        delete process.env.PRODUCTIVE_ORG_ID;
        await handleCacheCommand('queue', [], {});
        expect(processExitSpy).toHaveBeenCalledWith(4);
      });

      it('should show job params when non-empty', async () => {
        const now = Date.now();
        mockCacheStore.getPendingRefreshJobsAsync.mockResolvedValue([
          {
            cacheKey: 'key-1',
            endpoint: '/projects',
            params: { filter: { company_id: '123' } },
            queuedAt: now - 10000,
          },
        ]);

        await handleCacheCommand('queue', [], { 'org-id': 'test-org' });

        const output = consoleLogSpy.mock.calls.flat().join('');
        expect(output).toContain('Params:');
      });
    });
  });
});
