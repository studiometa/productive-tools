import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleTimeCommand } from '../time.js';
import * as api from '../../api.js';
import * as config from '../../config.js';

// Mock the API
vi.mock('../../api.js', () => ({
  ProductiveApi: vi.fn(() => ({
    getTimeEntries: vi.fn(),
    getTimeEntry: vi.fn(),
    createTimeEntry: vi.fn(),
    updateTimeEntry: vi.fn(),
    deleteTimeEntry: vi.fn(),
  })),
  ProductiveApiError: class ProductiveApiError extends Error {
    constructor(message: string, public statusCode?: number) {
      super(message);
      this.name = 'ProductiveApiError';
    }
    toJSON() {
      return {
        error: this.name,
        message: this.message,
        statusCode: this.statusCode,
      };
    }
  },
}));

// Mock config
vi.mock('../../config.js', () => ({
  getConfig: vi.fn(() => ({
    apiToken: 'test-token',
    organizationId: 'test-org',
    userId: 'test-user',
  })),
}));

describe('handleTimeCommand', () => {
  let mockApi: any;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    mockApi = {
      getTimeEntries: vi.fn(),
      getTimeEntry: vi.fn(),
      createTimeEntry: vi.fn(),
      updateTimeEntry: vi.fn(),
      deleteTimeEntry: vi.fn(),
    };
    (api.ProductiveApi as any).mockImplementation(() => mockApi);

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code?: any) => {
      throw new Error(`process.exit(${code})`);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('time list', () => {
    it('should list time entries in JSON format', async () => {
      mockApi.getTimeEntries.mockResolvedValue({
        data: [
          {
            id: '1',
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

      await handleTimeCommand('list', [], { format: 'json' });

      expect(mockApi.getTimeEntries).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {},
        sort: '',
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should list time entries with filters', async () => {
      mockApi.getTimeEntries.mockResolvedValue({
        data: [],
        meta: { page: 1, per_page: 100, total: 0 },
      });

      await handleTimeCommand('list', [], {
        format: 'json',
        from: '2024-01-01',
        to: '2024-01-31',
        person: 'person-1',
        project: 'project-1',
      });

      expect(mockApi.getTimeEntries).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {
          after: '2024-01-01',
          before: '2024-01-31',
          person_id: 'person-1',
          project_id: 'project-1',
        },
        sort: '',
      });
    });

    it('should list time entries in human format', async () => {
      mockApi.getTimeEntries.mockResolvedValue({
        data: [
          {
            id: '1',
            attributes: {
              date: '2024-01-15',
              time: 480,
              note: 'Test work',
              created_at: '2024-01-15T10:00:00Z',
              updated_at: '2024-01-15T10:00:00Z',
            },
            relationships: {
              person: { data: { id: 'person-1' } },
            },
          },
        ],
        meta: { page: 1, per_page: 100, total: 1 },
      });

      await handleTimeCommand('list', [], { format: 'human' });

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should list time entries in CSV format', async () => {
      mockApi.getTimeEntries.mockResolvedValue({
        data: [
          {
            id: '1',
            attributes: {
              date: '2024-01-15',
              time: 480,
              note: 'Test work',
              created_at: '2024-01-15T10:00:00Z',
              updated_at: '2024-01-15T10:00:00Z',
            },
            relationships: {},
          },
        ],
        meta: { page: 1, per_page: 100, total: 1 },
      });

      await handleTimeCommand('list', [], { format: 'csv' });

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      mockApi.getTimeEntries.mockRejectedValue(
        new (api as any).ProductiveApiError('API error', 500)
      );

      await expect(
        handleTimeCommand('list', [], { format: 'json' })
      ).rejects.toThrow('process.exit(1)');
    });

    it('should support ls alias', async () => {
      mockApi.getTimeEntries.mockResolvedValue({
        data: [],
        meta: { page: 1, per_page: 100, total: 0 },
      });

      await handleTimeCommand('ls', [], { format: 'json' });

      expect(mockApi.getTimeEntries).toHaveBeenCalled();
    });
  });

  describe('time get', () => {
    it('should get specific time entry in JSON format', async () => {
      mockApi.getTimeEntry.mockResolvedValue({
        data: {
          id: '1',
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

      await handleTimeCommand('get', ['1'], { format: 'json' });

      expect(mockApi.getTimeEntry).toHaveBeenCalledWith('1');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should get specific time entry in human format', async () => {
      mockApi.getTimeEntry.mockResolvedValue({
        data: {
          id: '1',
          attributes: {
            date: '2024-01-15',
            time: 480,
            note: 'Test work',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
          },
          relationships: {},
        },
      });

      await handleTimeCommand('get', ['1'], { format: 'human' });

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should require time entry ID', async () => {
      await expect(
        handleTimeCommand('get', [], { format: 'json' })
      ).rejects.toThrow('process.exit(3)'); // Exit code 3 for validation errors

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('id')
      );
    });

    it('should handle API errors', async () => {
      mockApi.getTimeEntry.mockRejectedValue(
        new (api as any).ProductiveApiError('Not found', 404)
      );

      await expect(
        handleTimeCommand('get', ['999'], { format: 'json' })
      ).rejects.toThrow('process.exit(5)'); // Exit code 5 for not found errors
    });
  });

  describe('time add', () => {
    it('should create time entry with all parameters', async () => {
      mockApi.createTimeEntry.mockResolvedValue({
        data: {
          id: '1',
          attributes: {
            date: '2024-01-15',
            time: 480,
            note: 'Test work',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
          },
        },
      });

      await handleTimeCommand('add', [], {
        format: 'json',
        person: 'person-1',
        service: 'service-1',
        date: '2024-01-15',
        time: '480',
        note: 'Test work',
      });

      expect(mockApi.createTimeEntry).toHaveBeenCalledWith({
        person_id: 'person-1',
        service_id: 'service-1',
        date: '2024-01-15',
        time: 480,
        note: 'Test work',
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should use userId from config when person not specified', async () => {
      mockApi.createTimeEntry.mockResolvedValue({
        data: {
          id: '1',
          attributes: {
            date: '2024-01-15',
            time: 480,
            note: '',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
          },
        },
      });

      await handleTimeCommand('add', [], {
        format: 'json',
        service: 'service-1',
        time: '480',
      });

      expect(mockApi.createTimeEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          person_id: 'test-user',
        })
      );
    });

    it('should use current date when date not specified', async () => {
      mockApi.createTimeEntry.mockResolvedValue({
        data: {
          id: '1',
          attributes: {
            date: new Date().toISOString().split('T')[0],
            time: 480,
            note: '',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
          },
        },
      });

      await handleTimeCommand('add', [], {
        format: 'json',
        person: 'person-1',
        service: 'service-1',
        time: '480',
      });

      expect(mockApi.createTimeEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          date: new Date().toISOString().split('T')[0],
        })
      );
    });

    it('should create time entry in human format', async () => {
      mockApi.createTimeEntry.mockResolvedValue({
        data: {
          id: '1',
          attributes: {
            date: '2024-01-15',
            time: 480,
            note: 'Test work',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
          },
        },
      });

      await handleTimeCommand('add', [], {
        person: 'person-1',
        service: 'service-1',
        time: '480',
        note: 'Test work',
      });

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should require person ID', async () => {
      vi.mocked(config.getConfig).mockReturnValue({
        apiToken: 'test-token',
        organizationId: 'test-org',
        userId: '',
      });

      await expect(
        handleTimeCommand('add', [], {
          format: 'json',
          service: 'service-1',
          time: '480',
        })
      ).rejects.toThrow('process.exit(4)'); // Exit code 4 for config errors

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Person ID required')
      );
    });

    it('should require service ID', async () => {
      await expect(
        handleTimeCommand('add', [], {
          format: 'json',
          person: 'person-1',
          time: '480',
        })
      ).rejects.toThrow('process.exit(3)'); // Exit code 3 for validation errors

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('service is required')
      );
    });

    it('should require time', async () => {
      await expect(
        handleTimeCommand('add', [], {
          format: 'json',
          person: 'person-1',
          service: 'service-1',
        })
      ).rejects.toThrow('process.exit(3)'); // Exit code 3 for validation errors

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('time is required')
      );
    });

    it('should handle API errors', async () => {
      mockApi.createTimeEntry.mockRejectedValue(
        new (api as any).ProductiveApiError('Validation error', 422)
      );

      await expect(
        handleTimeCommand('add', [], {
          format: 'json',
          person: 'person-1',
          service: 'service-1',
          time: '480',
        })
      ).rejects.toThrow('process.exit(1)');
    });
  });

  describe('time update', () => {
    it('should update time entry with all parameters', async () => {
      mockApi.updateTimeEntry.mockResolvedValue({
        data: {
          id: '1',
          attributes: {},
        },
      });

      await handleTimeCommand('update', ['1'], {
        format: 'json',
        time: '360',
        note: 'Updated note',
        date: '2024-01-16',
      });

      expect(mockApi.updateTimeEntry).toHaveBeenCalledWith('1', {
        time: 360,
        note: 'Updated note',
        date: '2024-01-16',
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should update time entry in human format', async () => {
      mockApi.updateTimeEntry.mockResolvedValue({
        data: {
          id: '1',
          attributes: {},
        },
      });

      await handleTimeCommand('update', ['1'], {
        time: '360',
      });

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should require time entry ID', async () => {
      await expect(
        handleTimeCommand('update', [], { format: 'json', time: '360' })
      ).rejects.toThrow('process.exit(3)'); // Exit code 3 for validation errors

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('id')
      );
    });

    it('should require at least one update field', async () => {
      await expect(
        handleTimeCommand('update', ['1'], { format: 'json' })
      ).rejects.toThrow('process.exit(3)'); // Exit code 3 for validation errors

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('No updates specified')
      );
    });

    it('should handle API errors', async () => {
      mockApi.updateTimeEntry.mockRejectedValue(
        new (api as any).ProductiveApiError('Not found', 404)
      );

      await expect(
        handleTimeCommand('update', ['999'], {
          format: 'json',
          time: '360',
        })
      ).rejects.toThrow('process.exit(5)'); // Exit code 5 for not found errors
    });
  });

  describe('time delete', () => {
    it('should delete time entry in JSON format', async () => {
      mockApi.deleteTimeEntry.mockResolvedValue(undefined);

      await handleTimeCommand('delete', ['1'], { format: 'json' });

      expect(mockApi.deleteTimeEntry).toHaveBeenCalledWith('1');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should delete time entry in human format', async () => {
      mockApi.deleteTimeEntry.mockResolvedValue(undefined);

      await handleTimeCommand('delete', ['1'], {});

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should support rm alias', async () => {
      mockApi.deleteTimeEntry.mockResolvedValue(undefined);

      await handleTimeCommand('rm', ['1'], { format: 'json' });

      expect(mockApi.deleteTimeEntry).toHaveBeenCalledWith('1');
    });

    it('should require time entry ID', async () => {
      await expect(
        handleTimeCommand('delete', [], { format: 'json' })
      ).rejects.toThrow('process.exit(3)'); // Exit code 3 for validation errors

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('id')
      );
    });

    it('should handle API errors', async () => {
      mockApi.deleteTimeEntry.mockRejectedValue(
        new (api as any).ProductiveApiError('Not found', 404)
      );

      await expect(
        handleTimeCommand('delete', ['999'], { format: 'json' })
      ).rejects.toThrow('process.exit(5)'); // Exit code 5 for not found errors
    });
  });

  describe('unknown subcommand', () => {
    it('should handle unknown subcommand', async () => {
      await expect(
        handleTimeCommand('unknown', [], { format: 'json' })
      ).rejects.toThrow('process.exit(1)');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown time subcommand: unknown')
      );
    });
  });

  describe('error handling', () => {
    it('should handle non-API errors', async () => {
      mockApi.getTimeEntries.mockRejectedValue(new Error('Unexpected error'));

      await expect(
        handleTimeCommand('list', [], { format: 'json' })
      ).rejects.toThrow('process.exit(1)');
    });

    it('should format API errors as JSON', async () => {
      mockApi.getTimeEntries.mockRejectedValue(
        new (api as any).ProductiveApiError('API error', 500)
      );

      await expect(
        handleTimeCommand('list', [], { format: 'json' })
      ).rejects.toThrow('process.exit(1)');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"error"')
      );
    });
  });
});
