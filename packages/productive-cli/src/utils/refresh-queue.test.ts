import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create mock cache object
const mockCache = {
  setOrgId: vi.fn(),
  getPendingRefreshJobsAsync: vi.fn(),
  dequeueRefreshAsync: vi.fn(),
  setAsync: vi.fn(),
  getRefreshQueueCountAsync: vi.fn(),
};

// Mock dependencies
vi.mock('../cache.js', () => ({
  getCache: vi.fn(() => mockCache),
}));

vi.mock('../../config.js', () => ({
  getConfig: vi.fn(),
}));

import { getConfig } from './../config.js';
import { processRefreshQueue, getRefreshQueueCount } from './refresh-queue.js';

describe('refresh-queue', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(getConfig).mockReturnValue({
      apiToken: 'test-token',
      organizationId: 'test-org',
      baseUrl: 'https://api.productive.io/api/v2',
    });
    mockCache.getPendingRefreshJobsAsync.mockResolvedValue([]);
    mockCache.getRefreshQueueCountAsync.mockResolvedValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('processRefreshQueue', () => {
    it('should return empty result when cache is disabled', async () => {
      const result = await processRefreshQueue({ 'no-cache': true });

      expect(result).toEqual({
        processed: 0,
        succeeded: 0,
        failed: 0,
        skipped: 0,
      });
      expect(mockCache.getPendingRefreshJobsAsync).not.toHaveBeenCalled();
    });

    it('should return empty result when config is invalid', async () => {
      vi.mocked(getConfig).mockImplementation(() => {
        throw new Error('Config not found');
      });

      const result = await processRefreshQueue({});

      expect(result).toEqual({
        processed: 0,
        succeeded: 0,
        failed: 0,
        skipped: 0,
      });
    });

    it('should return empty result when credentials are missing', async () => {
      vi.mocked(getConfig).mockReturnValue({});

      const result = await processRefreshQueue({});

      expect(result).toEqual({
        processed: 0,
        succeeded: 0,
        failed: 0,
        skipped: 0,
      });
    });

    it('should return empty result when apiToken is missing', async () => {
      vi.mocked(getConfig).mockReturnValue({
        organizationId: 'test-org',
      });

      const result = await processRefreshQueue({});

      expect(result).toEqual({
        processed: 0,
        succeeded: 0,
        failed: 0,
        skipped: 0,
      });
    });

    it('should return empty result when no pending jobs', async () => {
      mockCache.getPendingRefreshJobsAsync.mockResolvedValue([]);

      const result = await processRefreshQueue({});

      expect(result).toEqual({
        processed: 0,
        succeeded: 0,
        failed: 0,
        skipped: 0,
      });
      expect(mockCache.setOrgId).toHaveBeenCalledWith('test-org');
    });

    it('should process pending jobs successfully', async () => {
      const jobs = [
        { cacheKey: 'key1', endpoint: '/projects', params: { page: 1 } },
        { cacheKey: 'key2', endpoint: '/tasks', params: { filter: { project_id: '123' } } },
      ];
      mockCache.getPendingRefreshJobsAsync.mockResolvedValue(jobs);

      // Mock successful fetch
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await processRefreshQueue({});

      expect(result.processed).toBe(2);
      expect(result.succeeded).toBe(2);
      expect(result.failed).toBe(0);
      expect(mockCache.setAsync).toHaveBeenCalledTimes(2);

      vi.unstubAllGlobals();
    });

    it('should handle failed API requests', async () => {
      const jobs = [{ cacheKey: 'key1', endpoint: '/projects', params: {} }];
      mockCache.getPendingRefreshJobsAsync.mockResolvedValue(jobs);

      // Mock failed fetch
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await processRefreshQueue({});

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(0);
      expect(result.failed).toBe(1);
      expect(mockCache.dequeueRefreshAsync).toHaveBeenCalledWith('key1');

      vi.unstubAllGlobals();
    });

    it('should handle fetch exceptions', async () => {
      const jobs = [{ cacheKey: 'key1', endpoint: '/projects', params: {} }];
      mockCache.getPendingRefreshJobsAsync.mockResolvedValue(jobs);

      // Mock fetch that throws
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.stubGlobal('fetch', mockFetch);

      const result = await processRefreshQueue({});

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(0);
      expect(result.failed).toBe(1);
      expect(mockCache.dequeueRefreshAsync).toHaveBeenCalledWith('key1');

      vi.unstubAllGlobals();
    });

    it('should limit jobs to maxJobs parameter', async () => {
      const jobs = Array.from({ length: 20 }, (_, i) => ({
        cacheKey: `key${i}`,
        endpoint: '/projects',
        params: {},
      }));
      mockCache.getPendingRefreshJobsAsync.mockResolvedValue(jobs);

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await processRefreshQueue({}, 5);

      expect(result.processed).toBe(5);
      expect(result.skipped).toBe(15);

      vi.unstubAllGlobals();
    });

    it('should use default baseUrl when not configured', async () => {
      vi.mocked(getConfig).mockReturnValue({
        apiToken: 'test-token',
        organizationId: 'test-org',
        // No baseUrl
      });

      const jobs = [{ cacheKey: 'key1', endpoint: '/projects', params: {} }];
      mockCache.getPendingRefreshJobsAsync.mockResolvedValue(jobs);

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await processRefreshQueue({});

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.productive.io/api/v2/projects'),
        expect.any(Object),
      );

      vi.unstubAllGlobals();
    });

    it('should include query params in request URL', async () => {
      const jobs = [
        {
          cacheKey: 'key1',
          endpoint: '/projects',
          params: { page: 2, per_page: 50, 'filter[status]': 'active' },
        },
      ];
      mockCache.getPendingRefreshJobsAsync.mockResolvedValue(jobs);

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await processRefreshQueue({});

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('page=2');
      expect(calledUrl).toContain('per_page=50');
      expect(calledUrl).toContain('filter%5Bstatus%5D=active');

      vi.unstubAllGlobals();
    });

    it('should skip undefined/null params', async () => {
      const jobs = [
        {
          cacheKey: 'key1',
          endpoint: '/projects',
          params: { page: 1, filter: undefined, sort: null },
        },
      ];
      mockCache.getPendingRefreshJobsAsync.mockResolvedValue(jobs);

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await processRefreshQueue({});

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('page=1');
      expect(calledUrl).not.toContain('filter');
      expect(calledUrl).not.toContain('sort');

      vi.unstubAllGlobals();
    });
  });

  describe('getRefreshQueueCount', () => {
    it('should return 0 when cache is disabled', async () => {
      const count = await getRefreshQueueCount({ 'no-cache': true });

      expect(count).toBe(0);
      expect(mockCache.getRefreshQueueCountAsync).not.toHaveBeenCalled();
    });

    it('should return 0 when config is invalid', async () => {
      vi.mocked(getConfig).mockImplementation(() => {
        throw new Error('Config not found');
      });

      const count = await getRefreshQueueCount({});

      expect(count).toBe(0);
    });

    it('should return 0 when organizationId is missing', async () => {
      vi.mocked(getConfig).mockReturnValue({
        apiToken: 'test-token',
      });

      const count = await getRefreshQueueCount({});

      expect(count).toBe(0);
    });

    it('should return queue count from cache', async () => {
      mockCache.getRefreshQueueCountAsync.mockResolvedValue(5);

      const count = await getRefreshQueueCount({});

      expect(count).toBe(5);
      expect(mockCache.setOrgId).toHaveBeenCalledWith('test-org');
    });
  });
});
