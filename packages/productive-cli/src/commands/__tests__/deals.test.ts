import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { ProductiveApi } from '../../api.js';

import { createTestContext } from '../../context.js';
import { dealsList, dealsGet, dealsAdd, dealsUpdate } from '../deals/handlers.js';
import { handleDealsCommand } from '../deals/index.js';

describe('deals command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('dealsList', () => {
    it('should list deals', async () => {
      const getDeals = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'deals',
            attributes: {
              name: 'Big Deal',
              number: 'D-001',
              budget: false,
              date: '2024-01-15',
              created_at: '2024-01-01T00:00:00Z',
            },
          },
        ],
        meta: { total: 1, page: 1, per_page: 100 },
        included: [],
      });

      const ctx = createTestContext({
        api: { getDeals } as unknown as ProductiveApi,
      });

      await dealsList(ctx);

      expect(getDeals).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {},
        sort: '',
        include: ['company', 'deal_status', 'responsible'],
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should filter by company', async () => {
      const getDeals = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

      const ctx = createTestContext({
        api: { getDeals } as unknown as ProductiveApi,
        options: { company: '123', format: 'json' },
      });

      await dealsList(ctx);

      expect(getDeals).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { company_id: '123' },
        }),
      );
    });

    it('should filter by status (open)', async () => {
      const getDeals = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

      const ctx = createTestContext({
        api: { getDeals } as unknown as ProductiveApi,
        options: { status: 'open', format: 'json' },
      });

      await dealsList(ctx);

      expect(getDeals).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { stage_status_id: '1' },
        }),
      );
    });

    it('should filter by status (won)', async () => {
      const getDeals = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

      const ctx = createTestContext({
        api: { getDeals } as unknown as ProductiveApi,
        options: { status: 'won', format: 'json' },
      });

      await dealsList(ctx);

      expect(getDeals).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { stage_status_id: '2' },
        }),
      );
    });

    it('should filter by status (lost)', async () => {
      const getDeals = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

      const ctx = createTestContext({
        api: { getDeals } as unknown as ProductiveApi,
        options: { status: 'lost', format: 'json' },
      });

      await dealsList(ctx);

      expect(getDeals).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { stage_status_id: '3' },
        }),
      );
    });

    it('should filter by type (deal)', async () => {
      const getDeals = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

      const ctx = createTestContext({
        api: { getDeals } as unknown as ProductiveApi,
        options: { type: 'deal', format: 'json' },
      });

      await dealsList(ctx);

      expect(getDeals).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { type: '1' },
        }),
      );
    });

    it('should filter by type (budget)', async () => {
      const getDeals = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

      const ctx = createTestContext({
        api: { getDeals } as unknown as ProductiveApi,
        options: { type: 'budget', format: 'json' },
      });

      await dealsList(ctx);

      expect(getDeals).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { type: '2' },
        }),
      );
    });

    it('should filter deals with extended filters', async () => {
      const getDeals = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

      const ctx = createTestContext({
        api: { getDeals } as unknown as ProductiveApi,
        options: {
          project: 'project-1',
          responsible: 'person-1',
          pipeline: 'pipeline-1',
          'budget-status': 'open',
          format: 'json',
        },
      });

      await dealsList(ctx);

      expect(getDeals).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: {
            project_id: 'project-1',
            responsible_id: 'person-1',
            pipeline_id: 'pipeline-1',
            budget_status: '1',
          },
        }),
      );
    });

    it('should filter deals by budget-status closed', async () => {
      const getDeals = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

      const ctx = createTestContext({
        api: { getDeals } as unknown as ProductiveApi,
        options: { 'budget-status': 'closed', format: 'json' },
      });

      await dealsList(ctx);

      expect(getDeals).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { budget_status: '2' },
        }),
      );
    });
  });

  describe('dealsGet', () => {
    it('should get a deal by id', async () => {
      const getDeal = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'deals',
          attributes: {
            name: 'Big Deal',
            number: 'D-001',
            created_at: '2024-01-01T00:00:00Z',
          },
        },
        included: [],
      });

      const ctx = createTestContext({
        api: { getDeal } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await dealsGet(['1'], ctx);

      expect(getDeal).toHaveBeenCalledWith('1', {
        include: ['company', 'deal_status', 'responsible', 'project'],
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const ctx = createTestContext();

      try {
        await dealsGet([], ctx);
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });
  });

  describe('dealsAdd', () => {
    it('should create a deal', async () => {
      const createDeal = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'deals',
          attributes: {
            name: 'New Deal',
            number: 'D-002',
            budget: false,
            created_at: '2024-01-15T00:00:00Z',
          },
        },
      });

      const ctx = createTestContext({
        api: { createDeal } as unknown as ProductiveApi,
        options: { name: 'New Deal', company: '123', format: 'json' },
      });

      await dealsAdd(ctx);

      expect(createDeal).toHaveBeenCalledWith({
        name: 'New Deal',
        company_id: '123',
        date: undefined,
        budget: false,
        responsible_id: undefined,
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should create a budget', async () => {
      const createDeal = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'deals',
          attributes: {
            name: 'New Budget',
            number: 'B-001',
            budget: true,
            created_at: '2024-01-15T00:00:00Z',
          },
        },
      });

      const ctx = createTestContext({
        api: { createDeal } as unknown as ProductiveApi,
        options: { name: 'New Budget', company: '123', budget: true, format: 'json' },
      });

      await dealsAdd(ctx);

      expect(createDeal).toHaveBeenCalledWith({
        name: 'New Budget',
        company_id: '123',
        date: undefined,
        budget: true,
        responsible_id: undefined,
      });
    });

    it('should exit with error when name is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        options: { company: '123', format: 'json' },
      });

      await dealsAdd(ctx);

      expect(processExitSpy).toHaveBeenCalled();
    });

    it('should exit with error when company is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        options: { name: 'New Deal', format: 'json' },
      });

      await dealsAdd(ctx);

      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('dealsUpdate', () => {
    it('should update a deal', async () => {
      const updateDeal = vi.fn().mockResolvedValue({
        data: { id: '1', type: 'deals', attributes: {} },
      });

      const ctx = createTestContext({
        api: { updateDeal } as unknown as ProductiveApi,
        options: { name: 'Updated Deal', format: 'json' },
      });

      await dealsUpdate(['1'], ctx);

      expect(updateDeal).toHaveBeenCalledWith('1', { name: 'Updated Deal' });
    });

    it('should exit with error when id is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        options: { name: 'Updated', format: 'json' },
      });

      try {
        await dealsUpdate([], ctx);
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should exit with error when no updates specified', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        options: { format: 'json' },
      });

      await dealsUpdate(['1'], ctx);

      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('format variants', () => {
    const mockDeal = {
      id: '1',
      type: 'deals',
      attributes: {
        name: 'Big Deal',
        sales_status_id: 1,
        value: 50000,
        currency: 'EUR',
        probability: 75,
        created_at: '2024-01-15T10:00:00Z',
      },
      relationships: {
        company: { data: { id: 'c1' } },
        responsible: { data: { id: 'p1' } },
      },
    };

    it('should list deals in csv format', async () => {
      const getDeals = vi
        .fn()
        .mockResolvedValue({ data: [mockDeal], meta: { total: 1 }, included: [] });
      const ctx = createTestContext({
        api: { getDeals } as unknown as ProductiveApi,
        options: { format: 'csv' },
      });
      await dealsList(ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should list deals in human format', async () => {
      const getDeals = vi
        .fn()
        .mockResolvedValue({ data: [mockDeal], meta: { total: 1 }, included: [] });
      const ctx = createTestContext({
        api: { getDeals } as unknown as ProductiveApi,
        options: { format: 'human' },
      });
      await dealsList(ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should get a deal in human format', async () => {
      const getDeal = vi.fn().mockResolvedValue({ data: mockDeal, included: [] });
      const ctx = createTestContext({
        api: { getDeal } as unknown as ProductiveApi,
        options: { format: 'human' },
      });
      await dealsGet(['1'], ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should create a deal in human format', async () => {
      const createDeal = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'deals',
          attributes: { name: 'New Deal', sales_status_id: 1, created_at: '2024-01-15T10:00:00Z' },
          relationships: { company: { data: { id: '100' } } },
        },
      });
      const ctx = createTestContext({
        api: { createDeal } as unknown as ProductiveApi,
        options: { name: 'New Deal', company: '100', format: 'human' },
      });
      await dealsAdd(ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should update a deal in human format', async () => {
      const updateDeal = vi.fn().mockResolvedValue({
        data: { id: '1', type: 'deals', attributes: {} },
      });
      const ctx = createTestContext({
        api: { updateDeal } as unknown as ProductiveApi,
        options: { name: 'Updated', format: 'human' },
      });
      await dealsUpdate(['1'], ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('command routing', () => {
    it('should exit with error for unknown subcommand', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await handleDealsCommand('unknown', [], {
        format: 'json',
        token: 'test-token',
        'org-id': 'test-org',
      });

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
