import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { ProductiveApi } from '../../api.js';

import { createTestContext } from '../../context.js';
import {
  companiesList,
  companiesGet,
  companiesAdd,
  companiesUpdate,
} from '../companies/handlers.js';
import { handleCompaniesCommand } from '../companies/index.js';

describe('companies command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('companiesList', () => {
    it('should list active companies by default', async () => {
      const getCompanies = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'companies',
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
      });

      const ctx = createTestContext({
        api: { getCompanies } as unknown as ProductiveApi,
      });

      await companiesList(ctx);

      expect(getCompanies).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { status: '1' },
        sort: '',
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should list archived companies with --archived flag', async () => {
      const getCompanies = vi.fn().mockResolvedValue({ data: [], meta: {} });

      const ctx = createTestContext({
        api: { getCompanies } as unknown as ProductiveApi,
        options: { archived: true, format: 'json' },
      });

      await companiesList(ctx);

      expect(getCompanies).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { status: '2' },
        }),
      );
    });
  });

  describe('companiesGet', () => {
    it('should get a company by id', async () => {
      const getCompany = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'companies',
          attributes: {
            name: 'Acme Corp',
            company_code: 'ACME',
            created_at: '2024-01-01T00:00:00Z',
          },
        },
      });

      const ctx = createTestContext({
        api: { getCompany } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await companiesGet(['1'], ctx);

      expect(getCompany).toHaveBeenCalledWith('1');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const ctx = createTestContext();

      try {
        await companiesGet([], ctx);
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });
  });

  describe('companiesAdd', () => {
    it('should create a company', async () => {
      const createCompany = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'companies',
          attributes: {
            name: 'New Company',
            company_code: 'NEW',
            created_at: '2024-01-15T00:00:00Z',
          },
        },
      });

      const ctx = createTestContext({
        api: { createCompany } as unknown as ProductiveApi,
        options: { name: 'New Company', code: 'NEW', currency: 'EUR', format: 'json' },
      });

      await companiesAdd(ctx);

      expect(createCompany).toHaveBeenCalledWith({
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
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        options: { code: 'NEW', format: 'json' },
      });

      await companiesAdd(ctx);

      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('companiesUpdate', () => {
    it('should update a company', async () => {
      const updateCompany = vi.fn().mockResolvedValue({
        data: { id: '1', type: 'companies', attributes: {} },
      });

      const ctx = createTestContext({
        api: { updateCompany } as unknown as ProductiveApi,
        options: { name: 'Updated Name', format: 'json' },
      });

      await companiesUpdate(['1'], ctx);

      expect(updateCompany).toHaveBeenCalledWith('1', { name: 'Updated Name' });
    });

    it('should exit with error when id is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const ctx = createTestContext({ options: { name: 'Updated', format: 'json' } });

      try {
        await companiesUpdate([], ctx);
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

      await companiesUpdate(['1'], ctx);

      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('format variants', () => {
    const mockCompany = {
      id: '1',
      type: 'companies',
      attributes: {
        name: 'Acme Corp',
        email: 'hello@acme.com',
        created_at: '2024-01-15T10:00:00Z',
      },
    };

    it('should list companies in csv format', async () => {
      const getCompanies = vi.fn().mockResolvedValue({
        data: [mockCompany],
        meta: { total: 1 },
      });
      const ctx = createTestContext({
        api: { getCompanies } as unknown as ProductiveApi,
        options: { format: 'csv' },
      });
      await companiesList(ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should list companies in human format', async () => {
      const getCompanies = vi.fn().mockResolvedValue({
        data: [mockCompany],
        meta: { total: 1 },
      });
      const ctx = createTestContext({
        api: { getCompanies } as unknown as ProductiveApi,
        options: { format: 'human' },
      });
      await companiesList(ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should get a company in human format', async () => {
      const getCompany = vi.fn().mockResolvedValue({
        data: mockCompany,
        included: [],
      });
      const ctx = createTestContext({
        api: { getCompany } as unknown as ProductiveApi,
        options: { format: 'human' },
      });
      await companiesGet(['1'], ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should create a company in human format', async () => {
      const createCompany = vi.fn().mockResolvedValue({
        data: { id: '1', type: 'companies', attributes: { name: 'New Co' } },
      });
      const ctx = createTestContext({
        api: { createCompany } as unknown as ProductiveApi,
        options: { name: 'New Co', format: 'human' },
      });
      await companiesAdd(ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should update a company in human format', async () => {
      const updateCompany = vi.fn().mockResolvedValue({
        data: { id: '1', type: 'companies', attributes: {} },
      });
      const ctx = createTestContext({
        api: { updateCompany } as unknown as ProductiveApi,
        options: { name: 'Renamed', format: 'human' },
      });
      await companiesUpdate(['1'], ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('command routing', () => {
    it('should exit with error for unknown subcommand', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await handleCompaniesCommand('unknown', [], {
        format: 'json',
        token: 'test-token',
        'org-id': 'test-org',
      });

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
