import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { ProductiveApi } from '../api.js';

import { createTestContext } from '../context.js';
import { activitiesList } from './activities/handlers.js';

describe('activities command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('activitiesList', () => {
    const mockActivities = [
      {
        id: '1',
        type: 'activities',
        attributes: {
          event: 'create',
          changeset: [{ name: [null, { value: 'New Task' }] }],
          created_at: '2026-02-22T10:00:00Z',
        },
        relationships: {
          creator: { data: { type: 'people', id: '100' } },
        },
      },
      {
        id: '2',
        type: 'activities',
        attributes: {
          event: 'update',
          changeset: [{ status: [{ value: 'open' }, { value: 'closed' }] }],
          created_at: '2026-02-22T11:00:00Z',
        },
        relationships: {
          creator: { data: { type: 'people', id: '101' } },
        },
      },
    ];

    it('should list activities in human format', async () => {
      const getActivities = vi.fn().mockResolvedValue({
        data: mockActivities,
        meta: { total_count: 2, page: 1 },
        included: [
          { id: '100', type: 'people', attributes: { first_name: 'John', last_name: 'Doe' } },
        ],
      });

      const ctx = createTestContext({
        api: { getActivities } as unknown as ProductiveApi,
      });

      await activitiesList(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should list activities in json format', async () => {
      const getActivities = vi.fn().mockResolvedValue({
        data: mockActivities,
        meta: { total_count: 2 },
        included: [],
      });

      const ctx = createTestContext({
        api: { getActivities } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await activitiesList(ctx);

      expect(getActivities).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          perPage: 100,
          include: ['creator'],
        }),
      );
    });

    it('should pass event filter', async () => {
      const getActivities = vi.fn().mockResolvedValue({
        data: [],
        meta: { total_count: 0 },
      });

      const ctx = createTestContext({
        api: { getActivities } as unknown as ProductiveApi,
        options: { event: 'create', format: 'json' },
      });

      await activitiesList(ctx);

      expect(getActivities).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ event: 'create' }),
        }),
      );
    });

    it('should pass after filter', async () => {
      const getActivities = vi.fn().mockResolvedValue({
        data: [],
        meta: { total_count: 0 },
      });

      const ctx = createTestContext({
        api: { getActivities } as unknown as ProductiveApi,
        options: { after: '2026-02-22T00:00:00Z', format: 'json' },
      });

      await activitiesList(ctx);

      expect(getActivities).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ after: '2026-02-22T00:00:00Z' }),
        }),
      );
    });

    it('should pass person and project filters', async () => {
      const getActivities = vi.fn().mockResolvedValue({
        data: [],
        meta: { total_count: 0 },
      });

      const ctx = createTestContext({
        api: { getActivities } as unknown as ProductiveApi,
        options: { person: '123', project: '456', format: 'json' },
      });

      await activitiesList(ctx);

      expect(getActivities).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({
            person_id: '123',
            project_id: '456',
          }),
        }),
      );
    });

    it('should handle pagination options', async () => {
      const getActivities = vi.fn().mockResolvedValue({
        data: [],
        meta: { total_count: 0 },
      });

      const ctx = createTestContext({
        api: { getActivities } as unknown as ProductiveApi,
        options: { page: '2', size: '10', format: 'json' },
      });

      await activitiesList(ctx);

      expect(getActivities).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          perPage: 10,
        }),
      );
    });

    it('should handle csv format', async () => {
      const getActivities = vi.fn().mockResolvedValue({
        data: mockActivities,
        meta: { total_count: 2 },
        included: [],
      });

      const ctx = createTestContext({
        api: { getActivities } as unknown as ProductiveApi,
        options: { format: 'csv' },
      });

      await activitiesList(ctx);

      expect(getActivities).toHaveBeenCalled();
    });

    it('should handle table format', async () => {
      const getActivities = vi.fn().mockResolvedValue({
        data: mockActivities,
        meta: { total_count: 2 },
        included: [],
      });

      const ctx = createTestContext({
        api: { getActivities } as unknown as ProductiveApi,
        options: { format: 'table' },
      });

      await activitiesList(ctx);

      expect(getActivities).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const { ProductiveApiError } = await import('@studiometa/productive-api');
      const getActivities = vi.fn().mockRejectedValue(new ProductiveApiError('API Error', 500));
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        api: { getActivities } as unknown as ProductiveApi,
      });

      await activitiesList(ctx);

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should pass generic filter option', async () => {
      const getActivities = vi.fn().mockResolvedValue({
        data: [],
        meta: { total_count: 0 },
      });

      const ctx = createTestContext({
        api: { getActivities } as unknown as ProductiveApi,
        options: { filter: 'event=create,person_id=123', format: 'json' },
      });

      await activitiesList(ctx);

      expect(getActivities).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ event: 'create', person_id: '123' }),
        }),
      );
    });

    it('should handle empty results', async () => {
      const getActivities = vi.fn().mockResolvedValue({
        data: [],
        meta: { total_count: 0 },
      });

      const ctx = createTestContext({
        api: { getActivities } as unknown as ProductiveApi,
      });

      await activitiesList(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });
});
