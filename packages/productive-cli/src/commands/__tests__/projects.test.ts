import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { ProductiveApi } from '../../api.js';

import { createTestContext } from '../../context.js';
import { projectsList, projectsGet } from '../projects/handlers.js';
import { handleProjectsCommand } from '../projects/index.js';

describe('projects command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('projectsList', () => {
    it('should list projects with default pagination', async () => {
      const getProjects = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'projects',
            attributes: {
              name: 'Project 1',
              project_number: 'PRJ-001',
              archived: false,
              budget: 10000,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-02T00:00:00Z',
            },
          },
        ],
        meta: { total: 1, page: 1, per_page: 100 },
      });

      const ctx = createTestContext({
        api: { getProjects } as unknown as ProductiveApi,
      });

      await projectsList(ctx);

      expect(getProjects).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {},
        sort: '',
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle pagination and sorting', async () => {
      const getProjects = vi.fn().mockResolvedValue({
        data: [],
        meta: { total: 0 },
      });

      const ctx = createTestContext({
        api: { getProjects } as unknown as ProductiveApi,
        options: { page: '2', size: '50', sort: 'name', format: 'json' },
      });

      await projectsList(ctx);

      expect(getProjects).toHaveBeenCalledWith({
        page: 2,
        perPage: 50,
        filter: {},
        sort: 'name',
      });
    });

    it('should pass company filter', async () => {
      const getProjects = vi.fn().mockResolvedValue({
        data: [],
        meta: { total: 0 },
      });

      const ctx = createTestContext({
        api: { getProjects } as unknown as ProductiveApi,
        options: { company: '999', format: 'json' },
      });

      await projectsList(ctx);

      expect(getProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ company_id: '999' }),
        }),
      );
    });

    it('should pass responsible filter', async () => {
      const getProjects = vi.fn().mockResolvedValue({
        data: [],
        meta: { total: 0 },
      });

      const ctx = createTestContext({
        api: { getProjects } as unknown as ProductiveApi,
        options: { responsible: '123', format: 'json' },
      });

      await projectsList(ctx);

      expect(getProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ responsible_id: '123' }),
        }),
      );
    });

    it('should pass person filter', async () => {
      const getProjects = vi.fn().mockResolvedValue({
        data: [],
        meta: { total: 0 },
      });

      const ctx = createTestContext({
        api: { getProjects } as unknown as ProductiveApi,
        options: { person: '456', format: 'json' },
      });

      await projectsList(ctx);

      expect(getProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ person_id: '456' }),
        }),
      );
    });

    it('should pass type filter (client)', async () => {
      const getProjects = vi.fn().mockResolvedValue({
        data: [],
        meta: { total: 0 },
      });

      const ctx = createTestContext({
        api: { getProjects } as unknown as ProductiveApi,
        options: { type: 'client', format: 'json' },
      });

      await projectsList(ctx);

      expect(getProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ project_type: '2' }),
        }),
      );
    });

    it('should pass type filter (internal)', async () => {
      const getProjects = vi.fn().mockResolvedValue({
        data: [],
        meta: { total: 0 },
      });

      const ctx = createTestContext({
        api: { getProjects } as unknown as ProductiveApi,
        options: { type: 'internal', format: 'json' },
      });

      await projectsList(ctx);

      expect(getProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ project_type: '1' }),
        }),
      );
    });

    it('should pass status filter', async () => {
      const getProjects = vi.fn().mockResolvedValue({
        data: [],
        meta: { total: 0 },
      });

      const ctx = createTestContext({
        api: { getProjects } as unknown as ProductiveApi,
        options: { status: 'archived', format: 'json' },
      });

      await projectsList(ctx);

      expect(getProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ status: '2' }),
        }),
      );
    });

    it('should output formatted JSON data', async () => {
      const getProjects = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'projects',
            attributes: {
              name: 'Project 1',
              project_number: 'PRJ-001',
              archived: false,
              budget: 10000,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-02T00:00:00Z',
            },
          },
        ],
        meta: { total: 1 },
      });

      const ctx = createTestContext({
        api: { getProjects } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await projectsList(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(output.data).toHaveLength(1);
      expect(output.data[0].name).toBe('Project 1');
    });

    it('should handle projects without optional fields', async () => {
      const getProjects = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'projects',
            attributes: {
              name: 'Project 1',
              project_number: null,
              archived: false,
              budget: null,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-02T00:00:00Z',
            },
          },
        ],
        meta: { total: 1 },
      });

      const ctx = createTestContext({
        api: { getProjects } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await projectsList(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const { ProductiveApiError } = await import('@studiometa/productive-api');
      const getProjects = vi.fn().mockRejectedValue(new ProductiveApiError('API Error', 500));
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        api: { getProjects } as unknown as ProductiveApi,
      });

      await projectsList(ctx);

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('projectsGet', () => {
    it('should get a project by id', async () => {
      const getProject = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'projects',
          attributes: {
            name: 'Project 1',
            project_number: 'PRJ-001',
            archived: false,
            budget: 10000,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
          relationships: {},
        },
      });

      const ctx = createTestContext({
        api: { getProject } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await projectsGet(['1'], ctx);

      expect(getProject).toHaveBeenCalledWith('1');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle projects without optional fields', async () => {
      const getProject = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'projects',
          attributes: {
            name: 'Project 1',
            project_number: null,
            archived: false,
            budget: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
          relationships: {},
        },
      });

      const ctx = createTestContext({
        api: { getProject } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await projectsGet(['1'], ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext();

      try {
        await projectsGet([], ctx);
      } catch {
        // exitWithValidationError throws after process.exit
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should handle API errors (not found)', async () => {
      const { ProductiveApiError } = await import('@studiometa/productive-api');
      const getProject = vi.fn().mockRejectedValue(new ProductiveApiError('Not found', 404));
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        api: { getProject } as unknown as ProductiveApi,
      });

      await projectsGet(['999'], ctx);

      expect(processExitSpy).toHaveBeenCalledWith(5);
    });

    it('should handle unexpected errors', async () => {
      const getProject = vi.fn().mockRejectedValue(new Error('Unexpected'));
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        api: { getProject } as unknown as ProductiveApi,
      });

      await projectsGet(['1'], ctx);

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('command routing', () => {
    // These tests require vi.mock since they test handleProjectsCommand
    // which internally creates a real context. Kept minimal.

    it('should handle unknown subcommand', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await handleProjectsCommand('unknown', [], {
        format: 'json',
        token: 'test-token',
        'org-id': 'test-org',
      });

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
