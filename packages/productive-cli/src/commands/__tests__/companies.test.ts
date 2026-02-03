import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ProductiveApi } from '../../api.js';
import { handleCompaniesCommand } from '../companies/index.js';

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

describe('companies command', () => {
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
    it('should list active companies by default', async () => {
      const mockCompanies = {
        data: [
          {
            id: '1',
            attributes: {
              name: 'Acme Corp',
              company_code: 'ACME',
              default_currency: 'EUR',
              vat: 'FR123456789',
              created_at: '2024-01-01T00:00:00Z',
            },
          },
        ],
        meta: { total: 1, page: 1, per_page: 100 },
      };

      const mockApi = { getCompanies: vi.fn().mockResolvedValue(mockCompanies) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleCompaniesCommand('list', [], {});

      expect(mockApi.getCompanies).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { status: '1' },
        sort: '',
      });
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should list archived companies with --archived flag', async () => {
      const mockCompanies = { data: [], meta: {} };
      const mockApi = { getCompanies: vi.fn().mockResolvedValue(mockCompanies) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleCompaniesCommand('list', [], { archived: true });

      expect(mockApi.getCompanies).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { status: '2' },
        }),
      );
    });
  });

  describe('get command', () => {
    it('should get a company by id', async () => {
      const mockCompany = {
        data: {
          id: '1',
          attributes: {
            name: 'Acme Corp',
            company_code: 'ACME',
            created_at: '2024-01-01T00:00:00Z',
          },
        },
      };

      const mockApi = { getCompany: vi.fn().mockResolvedValue(mockCompany) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleCompaniesCommand('get', ['1'], {});

      expect(mockApi.getCompany).toHaveBeenCalledWith('1');
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      try {
        await handleCompaniesCommand('get', [], {});
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });
  });

  describe('add command', () => {
    it('should create a company', async () => {
      const mockCompany = {
        data: {
          id: '1',
          attributes: {
            name: 'New Company',
            company_code: 'NEW',
            created_at: '2024-01-15T00:00:00Z',
          },
        },
      };

      const mockApi = { createCompany: vi.fn().mockResolvedValue(mockCompany) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleCompaniesCommand('add', [], {
        name: 'New Company',
        code: 'NEW',
        currency: 'EUR',
      });

      expect(mockApi.createCompany).toHaveBeenCalledWith({
        name: 'New Company',
        billing_name: undefined,
        vat: undefined,
        default_currency: 'EUR',
        company_code: 'NEW',
        domain: undefined,
        due_days: undefined,
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when name is missing', async () => {
      await handleCompaniesCommand('add', [], { code: 'NEW' });

      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('update command', () => {
    it('should update a company', async () => {
      const mockCompany = { data: { id: '1', attributes: {} } };
      const mockApi = { updateCompany: vi.fn().mockResolvedValue(mockCompany) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleCompaniesCommand('update', ['1'], { name: 'Updated Name' });

      expect(mockApi.updateCompany).toHaveBeenCalledWith('1', { name: 'Updated Name' });
    });

    it('should exit with error when id is missing', async () => {
      try {
        await handleCompaniesCommand('update', [], { name: 'Updated' });
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should exit with error when no updates specified', async () => {
      await handleCompaniesCommand('update', ['1'], {});

      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('unknown subcommand', () => {
    it('should exit with error for unknown subcommand', async () => {
      await handleCompaniesCommand('unknown', [], {});

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
