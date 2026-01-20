import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleTasksCommand } from '../tasks.js';
import { ProductiveApi, ProductiveApiError } from '../../api.js';

// Mock dependencies
vi.mock('../../api.js');
vi.mock('../../output.js', () => ({
  OutputFormatter: vi.fn().mockImplementation((format, noColor) => ({
    format,
    noColor,
    output: vi.fn(),
    error: vi.fn(),
  })),
  createSpinner: vi.fn(() => ({
    start: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn(),
  })),
}));

describe('tasks command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('list command', () => {
    it('should list open tasks by default', async () => {
      const mockTasks = {
        data: [
          {
            id: '1',
            attributes: {
              title: 'Task 1',
              description: 'Description 1',
              completed: false,
              due_date: '2024-12-31',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-02T00:00:00Z',
            },
          },
        ],
        meta: { total: 1, page: 1, per_page: 100 },
      };

      const mockApi = {
        getTasks: vi.fn().mockResolvedValue(mockTasks),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleTasksCommand('list', [], {});

      expect(mockApi.getTasks).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { status: '1' },
        sort: '',
      });
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should list completed tasks with --status completed', async () => {
      const mockTasks = {
        data: [
          {
            id: '1',
            attributes: {
              title: 'Completed Task',
              description: null,
              completed: true,
              due_date: null,
              created_at: '2024-01-01',
              updated_at: '2024-01-02',
            },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getTasks: vi.fn().mockResolvedValue(mockTasks),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleTasksCommand('list', [], { status: 'completed' });

      expect(mockApi.getTasks).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { status: '2' },
        sort: '',
      });
    });

    it('should list all tasks with --status all', async () => {
      const mockTasks = {
        data: [],
        meta: { total: 0 },
      };

      const mockApi = {
        getTasks: vi.fn().mockResolvedValue(mockTasks),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleTasksCommand('list', [], { status: 'all' });

      expect(mockApi.getTasks).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {},
        sort: '',
      });
    });

    it('should filter tasks by project', async () => {
      const mockTasks = {
        data: [],
        meta: { total: 0 },
      };

      const mockApi = {
        getTasks: vi.fn().mockResolvedValue(mockTasks),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleTasksCommand('list', [], {
        project: '123',
      });

      expect(mockApi.getTasks).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { project_id: '123', status: '1' },
        sort: '',
      });
    });

    it('should handle pagination and sorting', async () => {
      const mockTasks = {
        data: [],
        meta: { total: 0 },
      };

      const mockApi = {
        getTasks: vi.fn().mockResolvedValue(mockTasks),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleTasksCommand('list', [], {
        page: '2',
        size: '50',
        sort: 'due_date',
      });

      expect(mockApi.getTasks).toHaveBeenCalledWith({
        page: 2,
        perPage: 50,
        filter: { status: '1' },
        sort: 'due_date',
      });
    });

    it('should list tasks in json format', async () => {
      const mockTasks = {
        data: [
          {
            id: '1',
            attributes: {
              title: 'Task 1',
              description: 'Description 1',
              completed: false,
              due_date: '2024-12-31',
              created_at: '2024-01-01',
              updated_at: '2024-01-02',
            },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getTasks: vi.fn().mockResolvedValue(mockTasks),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleTasksCommand('list', [], { format: 'json' });

      expect(mockApi.getTasks).toHaveBeenCalled();
    });

    it('should handle tasks without optional fields', async () => {
      const mockTasks = {
        data: [
          {
            id: '1',
            attributes: {
              title: 'Task 1',
              description: null,
              completed: false,
              due_date: null,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-02T00:00:00Z',
            },
          },
        ],
        meta: { total: 1 },
      };

      vi.mocked(ProductiveApi).mockImplementation(
        () =>
          ({
            getTasks: vi.fn().mockResolvedValue(mockTasks),
          }) as any
      );

      await handleTasksCommand('list', [], {});

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const mockError = new ProductiveApiError('API Error', 500);
      const mockApi = {
        getTasks: vi.fn().mockRejectedValue(mockError),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await expect(() => handleTasksCommand('list', [], {})).rejects.toThrow('process.exit(1)');
    });
  });

  describe('get command', () => {
    it('should get a task by id', async () => {
      const mockTask = {
        data: {
          id: '1',
          attributes: {
            title: 'Task 1',
            description: 'Description 1',
            completed: false,
            due_date: '2024-12-31',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
          relationships: {},
        },
      };

      const mockApi = {
        getTask: vi.fn().mockResolvedValue(mockTask),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleTasksCommand('get', ['1'], {});

      expect(mockApi.getTask).toHaveBeenCalledWith('1');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should get a task in json format', async () => {
      const mockTask = {
        data: {
          id: '1',
          attributes: {
            title: 'Task 1',
            description: 'Description 1',
            completed: true,
            due_date: '2024-12-31',
            created_at: '2024-01-01',
            updated_at: '2024-01-02',
          },
          relationships: {},
        },
      };

      const mockApi = {
        getTask: vi.fn().mockResolvedValue(mockTask),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleTasksCommand('get', ['1'], { format: 'json' });

      expect(mockApi.getTask).toHaveBeenCalledWith('1');
    });

    it('should handle tasks without optional fields', async () => {
      const mockTask = {
        data: {
          id: '1',
          attributes: {
            title: 'Task 1',
            description: null,
            completed: false,
            due_date: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
          relationships: {},
        },
      };

      const mockApi = {
        getTask: vi.fn().mockResolvedValue(mockTask),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleTasksCommand('get', ['1'], {});

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      await expect(() => handleTasksCommand('get', [], {})).rejects.toThrow('process.exit(1)');
    });

    it('should handle API errors', async () => {
      const mockError = new ProductiveApiError('Task not found', 404);
      const mockApi = {
        getTask: vi.fn().mockRejectedValue(mockError),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await expect(() => handleTasksCommand('get', ['999'], {})).rejects.toThrow('process.exit(1)');
    });
  });

  describe('ls alias', () => {
    it('should work as an alias for list', async () => {
      const mockTasks = {
        data: [],
        meta: { total: 0 },
      };

      const mockApi = {
        getTasks: vi.fn().mockResolvedValue(mockTasks),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleTasksCommand('ls', [], {});

      expect(mockApi.getTasks).toHaveBeenCalled();
    });
  });

  describe('unknown subcommand', () => {
    it('should exit with error for unknown subcommand', async () => {
      await expect(() => handleTasksCommand('unknown', [], {})).rejects.toThrow('process.exit(1)');
    });
  });
});
