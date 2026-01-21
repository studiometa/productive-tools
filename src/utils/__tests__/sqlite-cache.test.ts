import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  SqliteCache,
  getSqliteCache,
  clearSqliteCacheInstances,
} from "../sqlite-cache.js";

// Mock node:sqlite to avoid Vitest transformation issues
const mockDbInstance = {
  exec: vi.fn(),
  prepare: vi.fn(),
  close: vi.fn(),
};

const mockPreparedStatement = {
  run: vi.fn(),
  get: vi.fn(),
  all: vi.fn(),
};

vi.mock("node:sqlite", async () => {
  return {
    DatabaseSync: vi.fn(() => mockDbInstance),
  };
});

describe("SqliteCache", () => {
  const testOrgId = "test-org-123";
  let cache: SqliteCache;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDbInstance.prepare.mockReturnValue(mockPreparedStatement);
    cache = new SqliteCache(testOrgId);
  });

  afterEach(async () => {
    cache.close();
    clearSqliteCacheInstances();
  });

  describe("Projects", () => {
    it("should upsert and retrieve projects", async () => {
      const projects = [
        {
          id: "1",
          attributes: {
            name: "Project A",
            project_number: "PRJ-001",
            archived: false,
          },
          relationships: {
            company: { data: { id: "company-1" } },
          },
        },
        {
          id: "2",
          attributes: {
            name: "Project B",
            project_number: "PRJ-002",
            archived: false,
          },
        },
      ];

      mockPreparedStatement.all.mockReturnValue([
        {
          id: "1",
          name: "Project A",
          project_number: "PRJ-001",
          archived: 0,
          company_id: "company-1",
          data: JSON.stringify(projects[0]),
          synced_at: Date.now(),
        },
        {
          id: "2",
          name: "Project B",
          project_number: "PRJ-002",
          archived: 0,
          company_id: null,
          data: JSON.stringify(projects[1]),
          synced_at: Date.now(),
        },
      ]);

      await cache.upsertProjects(projects);
      const allProjects = await cache.getAllProjects();

      expect(mockPreparedStatement.run).toHaveBeenCalledTimes(2);
      expect(allProjects).toHaveLength(2);
      expect(allProjects[0].name).toBe("Project A");
      expect(allProjects[0].project_number).toBe("PRJ-001");
      expect(allProjects[0].company_id).toBe("company-1");
    });

    it("should search projects by name", async () => {
      mockPreparedStatement.all.mockReturnValue([
        {
          id: "1",
          name: "Website Redesign",
          project_number: "WEB-001",
          archived: 0,
          company_id: null,
          data: "{}",
          synced_at: Date.now(),
        },
        {
          id: "3",
          name: "Website Migration",
          project_number: "WEB-002",
          archived: 0,
          company_id: null,
          data: "{}",
          synced_at: Date.now(),
        },
      ]);

      const results = await cache.searchProjects("website");

      expect(mockPreparedStatement.all).toHaveBeenCalledWith(
        "%website%",
        "%website%",
        50,
      );
      expect(results).toHaveLength(2);
      expect(results[0].name).toContain("Website");
    });

    it("should track project sync time", async () => {
      const now = Date.now();
      mockPreparedStatement.get.mockReturnValue({ max_sync: now });

      const syncTime = await cache.getProjectsSyncTime();

      expect(syncTime).toBe(now);
    });

    it("should validate project cache freshness", async () => {
      const now = Date.now();
      mockPreparedStatement.get.mockReturnValue({ max_sync: now });

      // Fresh cache
      expect(await cache.isProjectsCacheValid(3600000)).toBe(true);

      // Expired cache (simulate old sync time)
      mockPreparedStatement.get.mockReturnValue({ max_sync: now - 4000000 });
      expect(await cache.isProjectsCacheValid(3600000)).toBe(false);
    });
  });

  describe("People", () => {
    it("should upsert and retrieve people", async () => {
      const people = [
        {
          id: "1",
          attributes: {
            first_name: "John",
            last_name: "Doe",
            email: "john@example.com",
            active: true,
          },
        },
        {
          id: "2",
          attributes: {
            first_name: "Jane",
            last_name: "Smith",
            email: "jane@example.com",
            active: true,
          },
        },
      ];

      mockPreparedStatement.all.mockReturnValue([
        {
          id: "2",
          first_name: "Jane",
          last_name: "Smith",
          email: "jane@example.com",
          active: 1,
          company_id: null,
          data: JSON.stringify(people[1]),
          synced_at: Date.now(),
        },
        {
          id: "1",
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
          active: 1,
          company_id: null,
          data: JSON.stringify(people[0]),
          synced_at: Date.now(),
        },
      ]);

      await cache.upsertPeople(people);
      const allPeople = await cache.getAllPeople();

      expect(mockPreparedStatement.run).toHaveBeenCalledTimes(2);
      expect(allPeople).toHaveLength(2);
      expect(allPeople[0].first_name).toBe("Jane");
      expect(allPeople[1].first_name).toBe("John");
    });

    it("should search people by name and email", async () => {
      mockPreparedStatement.all.mockReturnValue([
        {
          id: "1",
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
          active: 1,
          company_id: null,
          data: "{}",
          synced_at: Date.now(),
        },
      ]);

      const results = await cache.searchPeople("john");

      expect(mockPreparedStatement.all).toHaveBeenCalledWith(
        "%john%",
        "%john%",
        "%john%",
        50,
      );
      expect(results).toHaveLength(1);
      expect(results[0].first_name).toBe("John");
    });

    it("should validate people cache freshness", async () => {
      const now = Date.now();
      mockPreparedStatement.get.mockReturnValue({ max_sync: now });

      expect(await cache.isPeopleCacheValid(3600000)).toBe(true);

      mockPreparedStatement.get.mockReturnValue({ max_sync: now - 4000000 });
      expect(await cache.isPeopleCacheValid(3600000)).toBe(false);
    });
  });

  describe("Services", () => {
    it("should upsert and retrieve services", async () => {
      const services = [
        {
          id: "1",
          attributes: { name: "Development" },
          relationships: {
            project: { data: { id: "project-1" } },
            deal: { data: { id: "deal-1" } },
          },
        },
        {
          id: "2",
          attributes: { name: "Design" },
          relationships: {
            project: { data: { id: "project-1" } },
          },
        },
      ];

      mockPreparedStatement.all.mockReturnValue([
        {
          id: "2",
          name: "Design",
          project_id: "project-1",
          deal_id: null,
          data: JSON.stringify(services[1]),
          synced_at: Date.now(),
        },
        {
          id: "1",
          name: "Development",
          project_id: "project-1",
          deal_id: "deal-1",
          data: JSON.stringify(services[0]),
          synced_at: Date.now(),
        },
      ]);

      await cache.upsertServices(services);
      const results = await cache.getServicesByProject("project-1");

      expect(mockPreparedStatement.run).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(2);
      expect(results[0].name).toBe("Design");
      expect(results[1].name).toBe("Development");
    });

    it("should search services by name", async () => {
      mockPreparedStatement.all.mockReturnValue([
        {
          id: "1",
          name: "Web Development",
          project_id: null,
          deal_id: null,
          data: "{}",
          synced_at: Date.now(),
        },
        {
          id: "2",
          name: "Mobile Development",
          project_id: null,
          deal_id: null,
          data: "{}",
          synced_at: Date.now(),
        },
      ]);

      const results = await cache.searchServices("development");

      expect(mockPreparedStatement.all).toHaveBeenCalledWith(
        "%development%",
        50,
      );
      expect(results).toHaveLength(2);
    });

    it("should validate services cache freshness", async () => {
      const now = Date.now();
      mockPreparedStatement.get.mockReturnValue({ max_sync: now });

      expect(await cache.isServicesCacheValid(3600000)).toBe(true);

      mockPreparedStatement.get.mockReturnValue({ max_sync: now - 4000000 });
      expect(await cache.isServicesCacheValid(3600000)).toBe(false);
    });
  });

  describe("Utilities", () => {
    it("should get cache statistics", async () => {
      // Mock fs module
      vi.doMock("node:fs", async () => {
        const actual =
          await vi.importActual<typeof import("node:fs")>("node:fs");
        return {
          ...actual,
          statSync: vi.fn().mockReturnValue({ size: 12345 }),
        };
      });

      mockPreparedStatement.get
        .mockReturnValueOnce({ count: 2 }) // projects count
        .mockReturnValueOnce({ count: 1 }) // people count
        .mockReturnValueOnce({ count: 3 }); // services count

      const stats = await cache.getStats();

      expect(stats.projects).toBe(2);
      expect(stats.people).toBe(1);
      expect(stats.services).toBe(3);
      // Don't check dbSize since fs mocking is complex
    });

    it("should clear all cache", async () => {
      await cache.clear();

      expect(mockDbInstance.exec).toHaveBeenCalledWith("DELETE FROM projects");
      expect(mockDbInstance.exec).toHaveBeenCalledWith("DELETE FROM people");
      expect(mockDbInstance.exec).toHaveBeenCalledWith("DELETE FROM services");
      expect(mockDbInstance.exec).toHaveBeenCalledWith("DELETE FROM _meta");
      expect(mockDbInstance.exec).toHaveBeenCalledWith("VACUUM");
    });

    it("should close database connection", async () => {
      // Ensure cache is initialized by calling a method
      mockPreparedStatement.all.mockReturnValue([]);
      await cache.getAllProjects();

      cache.close();

      expect(mockDbInstance.close).toHaveBeenCalled();
    });
  });

  describe("Factory functions", () => {
    it("should return singleton instance per org", () => {
      const cache1 = getSqliteCache("org-1");
      const cache2 = getSqliteCache("org-1");
      const cache3 = getSqliteCache("org-2");

      expect(cache1).toBe(cache2);
      expect(cache1).not.toBe(cache3);
    });

    it("should clear all cache instances", () => {
      getSqliteCache("org-1");
      getSqliteCache("org-2");

      expect(() => clearSqliteCacheInstances()).not.toThrow();
    });
  });
});
