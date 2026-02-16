import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { ProductiveApi } from '../../api.js';

import { createTestContext } from '../../context.js';
import { peopleList, peopleGet } from '../people/handlers.js';
import { handlePeopleCommand } from '../people/index.js';

describe('people command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('peopleList', () => {
    it('should list active people by default', async () => {
      const getPeople = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'people',
            attributes: {
              first_name: 'John',
              last_name: 'Doe',
              email: 'john@example.com',
              active: true,
              created_at: '2024-01-01',
              updated_at: '2024-01-02',
            },
          },
        ],
        meta: { total: 1, page: 1, per_page: 100 },
      });

      const ctx = createTestContext({
        api: { getPeople } as unknown as ProductiveApi,
      });

      await peopleList(ctx);

      expect(getPeople).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {},
        sort: '',
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should list people in json format', async () => {
      const getPeople = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'people',
            attributes: {
              first_name: 'John',
              last_name: 'Doe',
              email: 'john@example.com',
              active: true,
              created_at: '2024-01-01',
              updated_at: '2024-01-02',
            },
          },
        ],
        meta: { total: 1 },
      });

      const ctx = createTestContext({
        api: { getPeople } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await peopleList(ctx);

      expect(getPeople).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle pagination and sorting', async () => {
      const getPeople = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });

      const ctx = createTestContext({
        api: { getPeople } as unknown as ProductiveApi,
        options: { page: '2', size: '50', sort: 'last_name', format: 'json' },
      });

      await peopleList(ctx);

      expect(getPeople).toHaveBeenCalledWith({
        page: 2,
        perPage: 50,
        filter: {},
        sort: 'last_name',
      });
    });

    it('should filter people with extended filters', async () => {
      const getPeople = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });

      const ctx = createTestContext({
        api: { getPeople } as unknown as ProductiveApi,
        options: {
          company: 'company-1',
          project: 'project-1',
          role: 'role-1',
          team: 'Engineering',
          type: 'user',
          status: 'active',
          format: 'json',
        },
      });

      await peopleList(ctx);

      expect(getPeople).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {
          company_id: 'company-1',
          project_id: 'project-1',
          role_id: 'role-1',
          team: 'Engineering',
          person_type: '1',
          status: '1',
        },
        sort: '',
      });
    });

    it('should filter people by type contact', async () => {
      const getPeople = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });

      const ctx = createTestContext({
        api: { getPeople } as unknown as ProductiveApi,
        options: { type: 'contact', format: 'json' },
      });

      await peopleList(ctx);

      expect(getPeople).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { person_type: '2' },
        sort: '',
      });
    });

    it('should filter people by type placeholder', async () => {
      const getPeople = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });

      const ctx = createTestContext({
        api: { getPeople } as unknown as ProductiveApi,
        options: { type: 'placeholder', format: 'json' },
      });

      await peopleList(ctx);

      expect(getPeople).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { person_type: '3' },
        sort: '',
      });
    });

    it('should filter people by status deactivated', async () => {
      const getPeople = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });

      const ctx = createTestContext({
        api: { getPeople } as unknown as ProductiveApi,
        options: { status: 'deactivated', format: 'json' },
      });

      await peopleList(ctx);

      expect(getPeople).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { status: '2' },
        sort: '',
      });
    });

    it('should handle API errors', async () => {
      const { ProductiveApiError } = await import('@studiometa/productive-api');
      const getPeople = vi.fn().mockRejectedValue(new ProductiveApiError('API Error', 500));
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        api: { getPeople } as unknown as ProductiveApi,
      });

      await peopleList(ctx);

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('peopleGet', () => {
    it('should get a person by id', async () => {
      const getPerson = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'people',
          attributes: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
          relationships: {},
        },
      });

      const ctx = createTestContext({
        api: { getPerson } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await peopleGet(['1'], ctx);

      expect(getPerson).toHaveBeenCalledWith('1');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const ctx = createTestContext();

      try {
        await peopleGet([], ctx);
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should handle API errors (not found)', async () => {
      const { ProductiveApiError } = await import('@studiometa/productive-api');
      const getPerson = vi.fn().mockRejectedValue(new ProductiveApiError('Person not found', 404));
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        api: { getPerson } as unknown as ProductiveApi,
      });

      await peopleGet(['999'], ctx);

      expect(processExitSpy).toHaveBeenCalledWith(5);
    });

    it('should handle unexpected errors', async () => {
      const getPerson = vi.fn().mockRejectedValue(new Error('Unexpected error'));
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        api: { getPerson } as unknown as ProductiveApi,
      });

      await peopleGet(['1'], ctx);

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('command routing', () => {
    it('should exit with error for unknown subcommand', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await handlePeopleCommand('unknown', [], {
        format: 'json',
        token: 'test-token',
        'org-id': 'test-org',
      });

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
