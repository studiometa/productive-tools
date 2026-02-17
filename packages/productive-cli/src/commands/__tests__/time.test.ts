import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { ProductiveApi } from '../../api.js';

import { createTestContext } from '../../context.js';
import { timeList, timeGet, timeAdd, timeUpdate, timeDelete } from '../time/handlers.js';
import { handleTimeCommand } from '../time/index.js';

describe('time command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('timeList', () => {
    it('should list time entries in JSON format', async () => {
      const getTimeEntries = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'time_entries',
            attributes: {
              date: '2024-01-15',
              time: 480,
              note: 'Test work',
              created_at: '2024-01-15T10:00:00Z',
              updated_at: '2024-01-15T10:00:00Z',
            },
            relationships: {
              person: { data: { id: 'person-1' } },
              service: { data: { id: 'service-1' } },
              project: { data: { id: 'project-1' } },
            },
          },
        ],
        meta: { page: 1, per_page: 100, total: 1 },
      });

      const ctx = createTestContext({
        api: { getTimeEntries } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await timeList(ctx);

      expect(getTimeEntries).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {},
        sort: '',
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should list time entries with filters', async () => {
      const getTimeEntries = vi.fn().mockResolvedValue({
        data: [],
        meta: { page: 1, per_page: 100, total: 0 },
      });

      const ctx = createTestContext({
        api: { getTimeEntries } as unknown as ProductiveApi,
        options: {
          format: 'json',
          from: '2024-01-01',
          to: '2024-01-31',
          person: '500521',
          project: 'project-1',
        },
      });

      await timeList(ctx);

      expect(getTimeEntries).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {
          after: '2024-01-01',
          before: '2024-01-31',
          person_id: '500521',
          project_id: 'project-1',
        },
        sort: '',
      });
    });

    it('should list time entries with extended filters', async () => {
      const getTimeEntries = vi.fn().mockResolvedValue({
        data: [],
        meta: { page: 1, per_page: 100, total: 0 },
      });

      const ctx = createTestContext({
        api: { getTimeEntries } as unknown as ProductiveApi,
        options: {
          format: 'json',
          service: '6028361',
          task: 'task-1',
          company: 'company-1',
          deal: 'deal-1',
          status: 'approved',
          'billing-type': 'actuals',
          'invoicing-status': 'not_invoiced',
        },
      });

      await timeList(ctx);

      expect(getTimeEntries).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {
          service_id: '6028361',
          task_id: 'task-1',
          company_id: 'company-1',
          deal_id: 'deal-1',
          status: '1',
          billing_type_id: '2',
          invoicing_status: '1',
        },
        sort: '',
      });
    });

    it('should list time entries with budget filter', async () => {
      const getTimeEntries = vi.fn().mockResolvedValue({
        data: [],
        meta: { page: 1, per_page: 100, total: 0 },
      });

      const ctx = createTestContext({
        api: { getTimeEntries } as unknown as ProductiveApi,
        options: { format: 'json', budget: 'budget-1' },
      });

      await timeList(ctx);

      expect(getTimeEntries).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { budget_id: 'budget-1' },
        sort: '',
      });
    });

    it('should map status filter values correctly', async () => {
      const getTimeEntries = vi.fn().mockResolvedValue({
        data: [],
        meta: { page: 1, per_page: 100, total: 0 },
      });

      // Test unapproved
      const ctx1 = createTestContext({
        api: { getTimeEntries } as unknown as ProductiveApi,
        options: { format: 'json', status: 'unapproved' },
      });
      await timeList(ctx1);
      expect(getTimeEntries).toHaveBeenLastCalledWith(
        expect.objectContaining({ filter: { status: '2' } }),
      );

      // Test rejected
      const ctx2 = createTestContext({
        api: { getTimeEntries } as unknown as ProductiveApi,
        options: { format: 'json', status: 'rejected' },
      });
      await timeList(ctx2);
      expect(getTimeEntries).toHaveBeenLastCalledWith(
        expect.objectContaining({ filter: { status: '3' } }),
      );
    });

    it('should map billing-type filter values correctly', async () => {
      const getTimeEntries = vi.fn().mockResolvedValue({
        data: [],
        meta: { page: 1, per_page: 100, total: 0 },
      });

      // Test fixed
      const ctx1 = createTestContext({
        api: { getTimeEntries } as unknown as ProductiveApi,
        options: { format: 'json', 'billing-type': 'fixed' },
      });
      await timeList(ctx1);
      expect(getTimeEntries).toHaveBeenLastCalledWith(
        expect.objectContaining({ filter: { billing_type_id: '1' } }),
      );

      // Test non_billable
      const ctx2 = createTestContext({
        api: { getTimeEntries } as unknown as ProductiveApi,
        options: { format: 'json', 'billing-type': 'non_billable' },
      });
      await timeList(ctx2);
      expect(getTimeEntries).toHaveBeenLastCalledWith(
        expect.objectContaining({ filter: { billing_type_id: '3' } }),
      );
    });

    it('should map invoicing-status filter values correctly', async () => {
      const getTimeEntries = vi.fn().mockResolvedValue({
        data: [],
        meta: { page: 1, per_page: 100, total: 0 },
      });

      // Test drafted
      const ctx1 = createTestContext({
        api: { getTimeEntries } as unknown as ProductiveApi,
        options: { format: 'json', 'invoicing-status': 'drafted' },
      });
      await timeList(ctx1);
      expect(getTimeEntries).toHaveBeenLastCalledWith(
        expect.objectContaining({ filter: { invoicing_status: '2' } }),
      );

      // Test finalized
      const ctx2 = createTestContext({
        api: { getTimeEntries } as unknown as ProductiveApi,
        options: { format: 'json', 'invoicing-status': 'finalized' },
      });
      await timeList(ctx2);
      expect(getTimeEntries).toHaveBeenLastCalledWith(
        expect.objectContaining({ filter: { invoicing_status: '3' } }),
      );
    });

    it('should handle API errors', async () => {
      const { ProductiveApiError } = await import('@studiometa/productive-api');
      const getTimeEntries = vi.fn().mockRejectedValue(new ProductiveApiError('API error', 500));
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        api: { getTimeEntries } as unknown as ProductiveApi,
      });

      await timeList(ctx);

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('timeGet', () => {
    it('should get specific time entry in JSON format', async () => {
      const getTimeEntry = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'time_entries',
          attributes: {
            date: '2024-01-15',
            time: 480,
            note: 'Test work',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
          },
          relationships: {
            person: { data: { id: 'person-1' } },
            service: { data: { id: 'service-1' } },
            project: { data: { id: 'project-1' } },
          },
        },
      });

      const ctx = createTestContext({
        api: { getTimeEntry } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await timeGet(['1'], ctx);

      expect(getTimeEntry).toHaveBeenCalledWith('1');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should require time entry ID', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const ctx = createTestContext();

      try {
        await timeGet([], ctx);
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should handle API errors (not found)', async () => {
      const { ProductiveApiError } = await import('@studiometa/productive-api');
      const getTimeEntry = vi.fn().mockRejectedValue(new ProductiveApiError('Not found', 404));
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        api: { getTimeEntry } as unknown as ProductiveApi,
      });

      await timeGet(['999'], ctx);

      expect(processExitSpy).toHaveBeenCalledWith(5);
    });
  });

  describe('timeAdd', () => {
    it('should create time entry with all parameters', async () => {
      const createTimeEntry = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'time_entries',
          attributes: {
            date: '2024-01-15',
            time: 480,
            note: 'Test work',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
          },
        },
      });

      const ctx = createTestContext({
        api: { createTimeEntry } as unknown as ProductiveApi,
        options: {
          format: 'json',
          person: '500521',
          service: '6028361',
          date: '2024-01-15',
          time: '480',
          note: 'Test work',
        },
      });

      await timeAdd(ctx);

      expect(createTimeEntry).toHaveBeenCalledWith({
        person_id: '500521',
        service_id: '6028361',
        date: '2024-01-15',
        time: 480,
        note: 'Test work',
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should use userId from config when person not specified', async () => {
      const createTimeEntry = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'time_entries',
          attributes: {
            date: '2024-01-15',
            time: 480,
            note: '',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
          },
        },
      });

      const ctx = createTestContext({
        api: { createTimeEntry } as unknown as ProductiveApi,
        options: { format: 'json', service: '6028361', time: '480' },
      });

      await timeAdd(ctx);

      expect(createTimeEntry).toHaveBeenCalledWith(
        expect.objectContaining({ person_id: '500521' }),
      );
    });

    it('should use current date when date not specified', async () => {
      const createTimeEntry = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'time_entries',
          attributes: {
            date: new Date().toISOString().split('T')[0],
            time: 480,
            note: '',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
          },
        },
      });

      const ctx = createTestContext({
        api: { createTimeEntry } as unknown as ProductiveApi,
        options: { format: 'json', person: '500521', service: '6028361', time: '480' },
      });

      await timeAdd(ctx);

      // date defaults to today when not specified
      expect(createTimeEntry).toHaveBeenCalledWith(
        expect.objectContaining({ date: new Date().toISOString().split('T')[0] }),
      );
    });

    it('should require person ID', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        config: {
          apiToken: 'test-token',
          organizationId: '12345',
          userId: '',
          baseUrl: 'https://api.productive.io/api/v2',
        },
        options: { format: 'json', service: '6028361', time: '480' },
      });

      await timeAdd(ctx);

      expect(processExitSpy).toHaveBeenCalledWith(4);
    });

    it('should require service ID', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        options: { format: 'json', person: '500521', time: '480' },
      });

      await timeAdd(ctx);

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should require time', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        options: { format: 'json', person: '500521', service: '6028361' },
      });

      await timeAdd(ctx);

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should handle API errors', async () => {
      const { ProductiveApiError } = await import('@studiometa/productive-api');
      const createTimeEntry = vi
        .fn()
        .mockRejectedValue(new ProductiveApiError('Validation error', 422));
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        api: { createTimeEntry } as unknown as ProductiveApi,
        options: { format: 'json', person: '500521', service: '6028361', time: '480' },
      });

      await timeAdd(ctx);

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('timeUpdate', () => {
    it('should update time entry with all parameters', async () => {
      const updateTimeEntry = vi.fn().mockResolvedValue({
        data: { id: '1', type: 'time_entries', attributes: {} },
      });

      const ctx = createTestContext({
        api: { updateTimeEntry } as unknown as ProductiveApi,
        options: { format: 'json', time: '360', note: 'Updated note', date: '2024-01-16' },
      });

      await timeUpdate(['1'], ctx);

      expect(updateTimeEntry).toHaveBeenCalledWith('1', {
        time: 360,
        note: 'Updated note',
        date: '2024-01-16',
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should require time entry ID', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        options: { format: 'json', time: '360' },
      });

      try {
        await timeUpdate([], ctx);
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should require at least one update field', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        options: { format: 'json' },
      });

      await timeUpdate(['1'], ctx);

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should handle API errors (not found)', async () => {
      const { ProductiveApiError } = await import('@studiometa/productive-api');
      const updateTimeEntry = vi.fn().mockRejectedValue(new ProductiveApiError('Not found', 404));
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        api: { updateTimeEntry } as unknown as ProductiveApi,
        options: { format: 'json', time: '360' },
      });

      await timeUpdate(['999'], ctx);

      expect(processExitSpy).toHaveBeenCalledWith(5);
    });
  });

  describe('timeDelete', () => {
    it('should delete time entry in JSON format', async () => {
      const deleteTimeEntry = vi.fn().mockResolvedValue(undefined);

      const ctx = createTestContext({
        api: { deleteTimeEntry } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await timeDelete(['1'], ctx);

      expect(deleteTimeEntry).toHaveBeenCalledWith('1');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should require time entry ID', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const ctx = createTestContext();

      try {
        await timeDelete([], ctx);
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should handle API errors (not found)', async () => {
      const { ProductiveApiError } = await import('@studiometa/productive-api');
      const deleteTimeEntry = vi.fn().mockRejectedValue(new ProductiveApiError('Not found', 404));
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        api: { deleteTimeEntry } as unknown as ProductiveApi,
      });

      await timeDelete(['999'], ctx);

      expect(processExitSpy).toHaveBeenCalledWith(5);
    });
  });

  describe('format variants', () => {
    const mockTimeEntry = {
      id: '1',
      type: 'time_entries',
      attributes: {
        date: '2024-01-15',
        time: 480,
        note: 'Dev work',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
      relationships: {
        person: { data: { id: 'p1' } },
        service: { data: { id: 's1' } },
        project: { data: { id: 'pr1' } },
      },
    };

    it('should list time entries in csv format', async () => {
      const getTimeEntries = vi.fn().mockResolvedValue({
        data: [mockTimeEntry],
        meta: { total: 1 },
        included: [],
      });
      const ctx = createTestContext({
        api: { getTimeEntries } as unknown as ProductiveApi,
        options: { format: 'csv' },
      });
      await timeList(ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should list time entries in human format', async () => {
      const getTimeEntries = vi.fn().mockResolvedValue({
        data: [mockTimeEntry],
        meta: { total: 1 },
        included: [],
      });
      const ctx = createTestContext({
        api: { getTimeEntries } as unknown as ProductiveApi,
        options: { format: 'human' },
      });
      await timeList(ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should get time entry in human format', async () => {
      const getTimeEntry = vi.fn().mockResolvedValue({
        data: mockTimeEntry,
        included: [],
      });
      const ctx = createTestContext({
        api: { getTimeEntry } as unknown as ProductiveApi,
        options: { format: 'human' },
      });
      await timeGet(['1'], ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should create time entry in human format', async () => {
      const createTimeEntry = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'time_entries',
          attributes: { date: '2024-01-15', time: 480, note: 'Dev' },
        },
      });
      const ctx = createTestContext({
        api: { createTimeEntry } as unknown as ProductiveApi,
        options: {
          person: '123',
          service: '456',
          time: 480,
          format: 'human',
        },
      });
      await timeAdd(ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should update time entry in human format', async () => {
      const updateTimeEntry = vi.fn().mockResolvedValue({
        data: { id: '1', type: 'time_entries', attributes: {} },
      });
      const ctx = createTestContext({
        api: { updateTimeEntry } as unknown as ProductiveApi,
        options: { time: 240, format: 'human' },
      });
      await timeUpdate(['1'], ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should delete time entry in human format', async () => {
      const deleteTimeEntry = vi.fn().mockResolvedValue({ data: null });
      const ctx = createTestContext({
        api: { deleteTimeEntry } as unknown as ProductiveApi,
        options: { format: 'human' },
      });
      await timeDelete(['1'], ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('command routing', () => {
    it('should handle unknown subcommand', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await handleTimeCommand('unknown', [], {
        format: 'json',
        token: 'test-token',
        'org-id': 'test-org',
      });

      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown time subcommand: unknown'),
      );
    });
  });
});
