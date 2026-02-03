import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ProductiveApi } from '../../api.js';
import { handleDealsCommand } from '../deals/index.js';

vi.mock('../../api.js', () => ({
  ProductiveApi: vi.fn(),
  ProductiveApiError: class ProductiveApiError extends Error {
    constructor(
      message: string,
      public statusCode?: number,
      public response?: unknown,
    ) {
      super(message);
      this.name = 'ProductiveApiError';
    }
  },
}));

vi.mock('../../output.js', () => ({
  OutputFormatter: vi.fn().mockImplementation((format, noColor) => ({
    format,
    noColor,
    output: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  })),
  createSpinner: vi.fn(() => ({
    start: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn(),
  })),
}));

describe('deals command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('list command', () => {
    it('should list deals', async () => {
      const mockDeals = {
        data: [
          {
            id: '1',
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
      };

      const mockApi = { getDeals: vi.fn().mockResolvedValue(mockDeals) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleDealsCommand('list', [], {});

      expect(mockApi.getDeals).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {},
        sort: '',
        include: ['company', 'deal_status', 'responsible'],
      });
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should filter by company', async () => {
      const mockDeals = { data: [], meta: {}, included: [] };
      const mockApi = { getDeals: vi.fn().mockResolvedValue(mockDeals) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleDealsCommand('list', [], { company: '123' });

      expect(mockApi.getDeals).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { company_id: '123' },
        }),
      );
    });

    it('should filter by status (open)', async () => {
      const mockDeals = { data: [], meta: {}, included: [] };
      const mockApi = { getDeals: vi.fn().mockResolvedValue(mockDeals) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleDealsCommand('list', [], { status: 'open' });

      expect(mockApi.getDeals).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { stage_status_id: '1' },
        }),
      );
    });

    it('should filter by status (won)', async () => {
      const mockDeals = { data: [], meta: {}, included: [] };
      const mockApi = { getDeals: vi.fn().mockResolvedValue(mockDeals) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleDealsCommand('list', [], { status: 'won' });

      expect(mockApi.getDeals).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { stage_status_id: '2' },
        }),
      );
    });

    it('should filter by status (lost)', async () => {
      const mockDeals = { data: [], meta: {}, included: [] };
      const mockApi = { getDeals: vi.fn().mockResolvedValue(mockDeals) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleDealsCommand('list', [], { status: 'lost' });

      expect(mockApi.getDeals).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { stage_status_id: '3' },
        }),
      );
    });

    it('should filter by type (deal)', async () => {
      const mockDeals = { data: [], meta: {}, included: [] };
      const mockApi = { getDeals: vi.fn().mockResolvedValue(mockDeals) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleDealsCommand('list', [], { type: 'deal' });

      expect(mockApi.getDeals).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { type: '1' },
        }),
      );
    });

    it('should filter by type (budget)', async () => {
      const mockDeals = { data: [], meta: {}, included: [] };
      const mockApi = { getDeals: vi.fn().mockResolvedValue(mockDeals) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleDealsCommand('list', [], { type: 'budget' });

      expect(mockApi.getDeals).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { type: '2' },
        }),
      );
    });

    it('should filter deals with extended filters', async () => {
      const mockDeals = { data: [], meta: {}, included: [] };
      const mockApi = { getDeals: vi.fn().mockResolvedValue(mockDeals) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleDealsCommand('list', [], {
        project: 'project-1',
        responsible: 'person-1',
        pipeline: 'pipeline-1',
        'budget-status': 'open',
      });

      expect(mockApi.getDeals).toHaveBeenCalledWith(
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
      const mockDeals = { data: [], meta: {}, included: [] };
      const mockApi = { getDeals: vi.fn().mockResolvedValue(mockDeals) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleDealsCommand('list', [], { 'budget-status': 'closed' });

      expect(mockApi.getDeals).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { budget_status: '2' },
        }),
      );
    });
  });

  describe('get command', () => {
    it('should get a deal by id', async () => {
      const mockDeal = {
        data: {
          id: '1',
          attributes: {
            name: 'Big Deal',
            number: 'D-001',
            created_at: '2024-01-01T00:00:00Z',
          },
        },
        included: [],
      };

      const mockApi = { getDeal: vi.fn().mockResolvedValue(mockDeal) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleDealsCommand('get', ['1'], {});

      expect(mockApi.getDeal).toHaveBeenCalledWith('1', {
        include: ['company', 'deal_status', 'responsible', 'project'],
      });
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      try {
        await handleDealsCommand('get', [], {});
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });
  });

  describe('add command', () => {
    it('should create a deal', async () => {
      const mockDeal = {
        data: {
          id: '1',
          attributes: {
            name: 'New Deal',
            number: 'D-002',
            budget: false,
            created_at: '2024-01-15T00:00:00Z',
          },
        },
      };

      const mockApi = { createDeal: vi.fn().mockResolvedValue(mockDeal) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleDealsCommand('add', [], { name: 'New Deal', company: '123' });

      expect(mockApi.createDeal).toHaveBeenCalledWith({
        name: 'New Deal',
        company_id: '123',
        date: undefined,
        budget: false,
        responsible_id: undefined,
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should create a budget', async () => {
      const mockDeal = {
        data: {
          id: '1',
          attributes: {
            name: 'New Budget',
            number: 'B-001',
            budget: true,
            created_at: '2024-01-15T00:00:00Z',
          },
        },
      };

      const mockApi = { createDeal: vi.fn().mockResolvedValue(mockDeal) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleDealsCommand('add', [], { name: 'New Budget', company: '123', budget: true });

      expect(mockApi.createDeal).toHaveBeenCalledWith({
        name: 'New Budget',
        company_id: '123',
        date: undefined,
        budget: true,
        responsible_id: undefined,
      });
    });

    it('should exit with error when name is missing', async () => {
      await handleDealsCommand('add', [], { company: '123' });

      expect(processExitSpy).toHaveBeenCalled();
    });

    it('should exit with error when company is missing', async () => {
      await handleDealsCommand('add', [], { name: 'New Deal' });

      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('update command', () => {
    it('should update a deal', async () => {
      const mockDeal = { data: { id: '1', attributes: {} } };
      const mockApi = { updateDeal: vi.fn().mockResolvedValue(mockDeal) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleDealsCommand('update', ['1'], { name: 'Updated Deal' });

      expect(mockApi.updateDeal).toHaveBeenCalledWith('1', { name: 'Updated Deal' });
    });

    it('should exit with error when id is missing', async () => {
      try {
        await handleDealsCommand('update', [], { name: 'Updated' });
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should exit with error when no updates specified', async () => {
      await handleDealsCommand('update', ['1'], {});

      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('unknown subcommand', () => {
    it('should exit with error for unknown subcommand', async () => {
      await handleDealsCommand('unknown', [], {});

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
