import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CacheStore, getCache, resetCache, disableCache } from "../cache.js";

// Mock the sqlite-cache module
const mockCacheGet = vi.fn();
const mockCacheSet = vi.fn();
const mockCacheInvalidate = vi.fn();
const mockCacheCleanup = vi.fn();
const mockCacheStats = vi.fn();

vi.mock("../sqlite-cache.js", () => ({
  getSqliteCache: vi.fn(() => ({
    cacheGet: mockCacheGet,
    cacheSet: mockCacheSet,
    cacheInvalidate: mockCacheInvalidate,
    cacheCleanup: mockCacheCleanup,
    cacheStats: mockCacheStats,
  })),
}));

describe("CacheStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCache();
    mockCacheGet.mockResolvedValue(null);
    mockCacheSet.mockResolvedValue(undefined);
    mockCacheInvalidate.mockResolvedValue(0);
    mockCacheCleanup.mockResolvedValue(0);
    mockCacheStats.mockResolvedValue({ entries: 0, size: 0, oldestAge: 0 });
  });

  afterEach(() => {
    resetCache();
  });

  it("should store and retrieve data (async)", async () => {
    const cache = new CacheStore(true);
    cache.setOrgId("org-1");
    const testData = { items: [1, 2, 3] };

    mockCacheGet.mockResolvedValue(testData);

    await cache.setAsync("/projects", { page: 1 }, "org-1", testData);
    const retrieved = await cache.getAsync("/projects", { page: 1 }, "org-1");

    expect(mockCacheSet).toHaveBeenCalled();
    expect(retrieved).toEqual(testData);
  });

  it("should return null for non-existent cache", async () => {
    const cache = new CacheStore(true);
    cache.setOrgId("org-1");

    mockCacheGet.mockResolvedValue(null);

    const result = await cache.getAsync("/projects", {}, "org-1");
    expect(result).toBeNull();
  });

  it("should generate different keys for different params", async () => {
    const cache = new CacheStore(true);
    cache.setOrgId("org-1");

    const data1 = { page: 1 };
    const data2 = { page: 2 };

    await cache.setAsync("/projects", { page: "1" }, "org-1", data1);
    await cache.setAsync("/projects", { page: "2" }, "org-1", data2);

    // Check that cacheSet was called with different keys
    const calls = mockCacheSet.mock.calls;
    expect(calls.length).toBe(2);
    expect(calls[0][0]).not.toBe(calls[1][0]); // Different keys
  });

  it("should generate different keys for different orgs", async () => {
    const cache = new CacheStore(true);

    const data1 = { org: 1 };
    const data2 = { org: 2 };

    cache.setOrgId("org-1");
    await cache.setAsync("/projects", {}, "org-1", data1);

    cache.setOrgId("org-2");
    await cache.setAsync("/projects", {}, "org-2", data2);

    // Check that cacheSet was called with different keys
    const calls = mockCacheSet.mock.calls;
    expect(calls.length).toBe(2);
    expect(calls[0][0]).not.toBe(calls[1][0]); // Different keys
  });

  it("should invalidate by pattern (async)", async () => {
    const cache = new CacheStore(true);
    cache.setOrgId("org-1");

    mockCacheInvalidate.mockResolvedValue(1);

    const deleted = await cache.invalidateAsync("projects");

    expect(mockCacheInvalidate).toHaveBeenCalledWith("projects");
    expect(deleted).toBe(1);
  });

  it("should clear all cache", async () => {
    const cache = new CacheStore(true);
    cache.setOrgId("org-1");

    await cache.invalidateAsync();

    expect(mockCacheInvalidate).toHaveBeenCalledWith(undefined);
  });

  it("should report stats (async)", async () => {
    const cache = new CacheStore(true);
    cache.setOrgId("org-1");

    mockCacheStats.mockResolvedValue({ entries: 5, size: 1024, oldestAge: 60 });

    const stats = await cache.statsAsync();

    expect(stats.entries).toBe(5);
    expect(stats.size).toBe(1024);
    expect(stats.oldestAge).toBe(60);
  });

  it("should not cache when disabled", async () => {
    const cache = new CacheStore(false);
    cache.setOrgId("org-1");

    await cache.setAsync("/projects", {}, "org-1", { data: "test" });
    const result = await cache.getAsync("/projects", {}, "org-1");

    expect(result).toBeNull();
    expect(mockCacheSet).not.toHaveBeenCalled();
    expect(mockCacheGet).not.toHaveBeenCalled();
  });

  it("should use correct TTL for different endpoints", async () => {
    const cache = new CacheStore(true);
    cache.setOrgId("org-1");

    // Projects should have 1 hour TTL (3600 * 1000 ms)
    await cache.setAsync("/projects", {}, "org-1", { type: "projects" });
    expect(mockCacheSet).toHaveBeenLastCalledWith(
      expect.any(String),
      { type: "projects" },
      "/projects",
      3600 * 1000,
    );

    // Time entries should have 5 min TTL (300 * 1000 ms)
    await cache.setAsync("/time_entries", {}, "org-1", { type: "time" });
    expect(mockCacheSet).toHaveBeenLastCalledWith(
      expect.any(String),
      { type: "time" },
      "/time_entries",
      300 * 1000,
    );

    // Tasks should have 15 min TTL (900 * 1000 ms)
    await cache.setAsync("/tasks", {}, "org-1", { type: "tasks" });
    expect(mockCacheSet).toHaveBeenLastCalledWith(
      expect.any(String),
      { type: "tasks" },
      "/tasks",
      900 * 1000,
    );
  });

  it("should allow custom TTL", async () => {
    const cache = new CacheStore(true);
    cache.setOrgId("org-1");

    await cache.setAsync(
      "/projects",
      {},
      "org-1",
      { data: "test" },
      { ttl: 60 },
    );

    expect(mockCacheSet).toHaveBeenCalledWith(
      expect.any(String),
      { data: "test" },
      "/projects",
      60 * 1000, // 60 seconds in ms
    );
  });

  it("should auto-set orgId from method parameters", async () => {
    const cache = new CacheStore(true);
    // Don't explicitly set orgId - it should be set from the method parameter

    mockCacheGet.mockResolvedValue({ data: "test" });
    const result = await cache.getAsync("/projects", {}, "org-1");

    // Should work since orgId is passed to the method
    expect(result).toEqual({ data: "test" });
    expect(mockCacheGet).toHaveBeenCalled();

    const { getSqliteCache } = await import("../sqlite-cache.js");
    expect(getSqliteCache).toHaveBeenCalledWith("org-1");
  });

  it("should switch orgId and reset cache", async () => {
    const cache = new CacheStore(true);

    cache.setOrgId("org-1");
    await cache.getAsync("/projects", {}, "org-1");

    cache.setOrgId("org-2");
    await cache.getAsync("/projects", {}, "org-2");

    // Should have called getSqliteCache for each org change
    const { getSqliteCache } = await import("../sqlite-cache.js");
    expect(getSqliteCache).toHaveBeenCalledWith("org-1");
    expect(getSqliteCache).toHaveBeenCalledWith("org-2");
  });
});

describe("Cache singleton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCache();
  });

  afterEach(() => {
    resetCache();
  });

  it("should return same instance", () => {
    const cache1 = getCache();
    const cache2 = getCache();
    expect(cache1).toBe(cache2);
  });

  it("should disable cache", async () => {
    disableCache();
    const cache = getCache();
    cache.setOrgId("org");

    await cache.setAsync("/test", {}, "org", { data: "test" });
    const result = await cache.getAsync("/test", {}, "org");

    expect(result).toBeNull();
    expect(mockCacheSet).not.toHaveBeenCalled();
  });

  it("should reset singleton", () => {
    const cache1 = getCache();
    resetCache();
    const cache2 = getCache();
    expect(cache1).not.toBe(cache2);
  });
});
