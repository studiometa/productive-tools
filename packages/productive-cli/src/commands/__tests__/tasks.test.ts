import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ProductiveApi, ProductiveApiError } from '../../api.js';
import {
  handleTasksCommand,
  showTasksHelp,
  parseFilters,
  formatTime,
  getIncludedResource,
  stripAnsi,
  truncateText,
  padText,
} from '../tasks/index.js';

// Mock API
vi.mock('../../api.js');

// Mock output
vi.mock('../../output.js', () => ({
  OutputFormatter: vi.fn().mockImplementation((format, noColor) => ({
    format,
    noColor,
    output: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  })),
  createSpinner: vi.fn(() => ({
    start: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn(),
    setText: vi.fn(),
  })),
}));

// Create mock API instance for context
const mockApiInstance = {
  getTasks: vi.fn(),
  getTask: vi.fn(),
};

// Mock context to provide dependencies
vi.mock('../../context.js', () => ({
  createContext: vi.fn((options: Record<string, unknown>) => ({
    api: mockApiInstance,
    formatter: {
      format: options.format || options.f || 'human',
      output: vi.fn(),
      error: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
    config: {
      apiToken: 'test-token',
      organizationId: 'test-org',
      userId: options.mine ? 'test-user' : undefined,
    },
    options,
    cache: {
      setOrgId: vi.fn(),
      getAsync: vi.fn(),
      setAsync: vi.fn(),
    },
    createSpinner: () => ({
      start: vi.fn(),
      succeed: vi.fn(),
      fail: vi.fn(),
      setText: vi.fn(),
    }),
    getPagination: () => ({
      page: Number(options.page || options.p || 1),
      perPage: Number(options.size || options.s || 100),
    }),
    getSort: () => String(options.sort || ''),
  })),
}));

describe('tasks helpers', () => {
  describe('parseFilters', () => {
    it('should return empty object for empty string', () => {
      expect(parseFilters('')).toEqual({});
    });

    it('should parse single filter', () => {
      expect(parseFilters('assignee_id=123')).toEqual({ assignee_id: '123' });
    });

    it('should parse multiple filters', () => {
      expect(parseFilters('assignee_id=123,status=open')).toEqual({
        assignee_id: '123',
        status: 'open',
      });
    });

    it('should trim whitespace', () => {
      expect(parseFilters(' key = value , foo = bar ')).toEqual({
        key: 'value',
        foo: 'bar',
      });
    });

    it('should ignore invalid pairs', () => {
      expect(parseFilters('valid=value,invalid')).toEqual({ valid: 'value' });
    });
  });

  describe('formatTime', () => {
    it('should return dash for undefined', () => {
      expect(formatTime(undefined)).toBe('-');
    });

    it('should return dash for null', () => {
      expect(formatTime(null as unknown as undefined)).toBe('-');
    });

    it('should format minutes only', () => {
      expect(formatTime(30)).toBe('30m');
      expect(formatTime(59)).toBe('59m');
    });

    it('should format hours only', () => {
      expect(formatTime(60)).toBe('1h');
      expect(formatTime(120)).toBe('2h');
      expect(formatTime(180)).toBe('3h');
    });

    it('should format hours and minutes', () => {
      expect(formatTime(90)).toBe('1h30m');
      expect(formatTime(150)).toBe('2h30m');
      expect(formatTime(61)).toBe('1h1m');
    });

    it('should handle zero', () => {
      expect(formatTime(0)).toBe('0m');
    });
  });

  describe('getIncludedResource', () => {
    const included = [
      { id: '1', type: 'projects', attributes: { name: 'Project 1' } },
      { id: '2', type: 'people', attributes: { first_name: 'John' } },
      { id: '3', type: 'projects', attributes: { name: 'Project 2' } },
    ];

    it('should return undefined for undefined included', () => {
      expect(getIncludedResource(undefined, 'projects', '1')).toBeUndefined();
    });

    it('should return undefined for undefined id', () => {
      expect(getIncludedResource(included, 'projects', undefined)).toBeUndefined();
    });

    it('should find resource by type and id', () => {
      expect(getIncludedResource(included, 'projects', '1')).toEqual({ name: 'Project 1' });
      expect(getIncludedResource(included, 'people', '2')).toEqual({ first_name: 'John' });
    });

    it('should return undefined for non-existent resource', () => {
      expect(getIncludedResource(included, 'projects', '999')).toBeUndefined();
      expect(getIncludedResource(included, 'tasks', '1')).toBeUndefined();
    });
  });

  describe('stripAnsi', () => {
    it('should strip basic ANSI codes', () => {
      expect(stripAnsi('\x1b[31mred\x1b[0m')).toBe('red');
      expect(stripAnsi('\x1b[1mbold\x1b[0m')).toBe('bold');
    });

    it('should handle multiple ANSI codes', () => {
      expect(stripAnsi('\x1b[31m\x1b[1mred bold\x1b[0m')).toBe('red bold');
    });

    it('should return plain text unchanged', () => {
      expect(stripAnsi('plain text')).toBe('plain text');
    });

    it('should handle OSC sequences (hyperlinks)', () => {
      expect(stripAnsi('\x1b]8;;http://example.com\x1b\\link\x1b]8;;\x1b\\')).toBe('link');
    });
  });

  describe('truncateText', () => {
    it('should not truncate short text', () => {
      expect(truncateText('short', 10)).toBe('short');
    });

    it('should truncate long text', () => {
      const result = truncateText('this is a very long text', 10);
      expect(stripAnsi(result).length).toBeLessThanOrEqual(10);
      expect(result).toContain('…');
    });

    it('should handle text with ANSI codes', () => {
      const colored = '\x1b[31mred text here\x1b[0m';
      const result = truncateText(colored, 5);
      expect(result).toContain('…');
    });
  });

  describe('padText', () => {
    it('should pad short text', () => {
      expect(padText('hi', 5)).toBe('hi   ');
    });

    it('should not pad text at or over width', () => {
      expect(padText('hello', 5)).toBe('hello');
      expect(padText('hello world', 5)).toBe('hello world');
    });

    it('should account for ANSI codes', () => {
      const colored = '\x1b[31mhi\x1b[0m';
      const result = padText(colored, 5);
      // The visible length should be 5 (hi + 3 spaces)
      expect(stripAnsi(result)).toBe('hi   ');
    });
  });
});

describe('showTasksHelp', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should show general help without subcommand', () => {
    showTasksHelp();
    const output = consoleLogSpy.mock.calls.flat().join('');
    expect(output).toContain('productive tasks');
    expect(output).toContain('list');
    expect(output).toContain('get');
  });

  it('should show list subcommand help', () => {
    showTasksHelp('list');
    const output = consoleLogSpy.mock.calls.flat().join('');
    expect(output).toContain('tasks list');
    expect(output).toContain('--mine');
    expect(output).toContain('--status');
  });

  it('should show ls alias help', () => {
    showTasksHelp('ls');
    const output = consoleLogSpy.mock.calls.flat().join('');
    expect(output).toContain('tasks list');
  });

  it('should show get subcommand help', () => {
    showTasksHelp('get');
    const output = consoleLogSpy.mock.calls.flat().join('');
    expect(output).toContain('tasks get');
    expect(output).toContain('<id>');
  });
});

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
      mockApiInstance.getTasks = mockApi.getTasks;
      mockApiInstance.getTask = mockApi.getTask;

      await handleTasksCommand('list', [], {});

      expect(mockApi.getTasks).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { status: '1' },
        sort: '',
        include: ['project', 'assignee', 'workflow_status'],
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
      mockApiInstance.getTasks = mockApi.getTasks;
      mockApiInstance.getTask = mockApi.getTask;

      await handleTasksCommand('list', [], { status: 'completed' });

      expect(mockApi.getTasks).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { status: '2' },
        sort: '',
        include: ['project', 'assignee', 'workflow_status'],
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
      mockApiInstance.getTasks = mockApi.getTasks;
      mockApiInstance.getTask = mockApi.getTask;

      await handleTasksCommand('list', [], { status: 'all' });

      expect(mockApi.getTasks).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {},
        sort: '',
        include: ['project', 'assignee', 'workflow_status'],
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
      mockApiInstance.getTasks = mockApi.getTasks;
      mockApiInstance.getTask = mockApi.getTask;

      await handleTasksCommand('list', [], {
        project: '123',
      });

      expect(mockApi.getTasks).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { project_id: '123', status: '1' },
        sort: '',
        include: ['project', 'assignee', 'workflow_status'],
      });
    });

    it('should filter tasks with extended filters', async () => {
      const mockTasks = {
        data: [],
        meta: { total: 0 },
      };

      const mockApi = {
        getTasks: vi.fn().mockResolvedValue(mockTasks),
      };
      mockApiInstance.getTasks = mockApi.getTasks;
      mockApiInstance.getTask = mockApi.getTask;

      await handleTasksCommand('list', [], {
        assignee: 'person-1',
        creator: 'person-2',
        company: 'company-1',
        board: 'board-1',
        'task-list': 'list-1',
        'workflow-status': 'status-1',
        parent: 'parent-1',
        status: 'all',
      });

      expect(mockApi.getTasks).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {
          assignee_id: 'person-1',
          creator_id: 'person-2',
          company_id: 'company-1',
          board_id: 'board-1',
          task_list_id: 'list-1',
          workflow_status_id: 'status-1',
          parent_task_id: 'parent-1',
        },
        sort: '',
        include: ['project', 'assignee', 'workflow_status'],
      });
    });

    it('should filter overdue tasks', async () => {
      const mockTasks = {
        data: [],
        meta: { total: 0 },
      };

      const mockApi = {
        getTasks: vi.fn().mockResolvedValue(mockTasks),
      };
      mockApiInstance.getTasks = mockApi.getTasks;
      mockApiInstance.getTask = mockApi.getTask;

      await handleTasksCommand('list', [], {
        overdue: true,
        status: 'all',
      });

      expect(mockApi.getTasks).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { overdue_status: '2' },
        sort: '',
        include: ['project', 'assignee', 'workflow_status'],
      });
    });

    it('should filter tasks by due date', async () => {
      const mockTasks = {
        data: [],
        meta: { total: 0 },
      };

      const mockApi = {
        getTasks: vi.fn().mockResolvedValue(mockTasks),
      };
      mockApiInstance.getTasks = mockApi.getTasks;
      mockApiInstance.getTask = mockApi.getTask;

      await handleTasksCommand('list', [], {
        'due-date': '2024-12-31',
        'due-before': '2025-01-15',
        'due-after': '2024-01-01',
        status: 'all',
      });

      expect(mockApi.getTasks).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {
          due_date_on: '2024-12-31',
          due_date_before: '2025-01-15',
          due_date_after: '2024-01-01',
        },
        sort: '',
        include: ['project', 'assignee', 'workflow_status'],
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
      mockApiInstance.getTasks = mockApi.getTasks;
      mockApiInstance.getTask = mockApi.getTask;

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
        include: ['project', 'assignee', 'workflow_status'],
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
      mockApiInstance.getTasks = mockApi.getTasks;
      mockApiInstance.getTask = mockApi.getTask;

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
          }) as any,
      );

      await handleTasksCommand('list', [], {});

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const mockError = new ProductiveApiError('API Error', 500);
      const mockApi = {
        getTasks: vi.fn().mockRejectedValue(mockError),
      };
      mockApiInstance.getTasks = mockApi.getTasks;
      mockApiInstance.getTask = mockApi.getTask;

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
      mockApiInstance.getTasks = mockApi.getTasks;
      mockApiInstance.getTask = mockApi.getTask;

      await handleTasksCommand('get', ['1'], {});

      expect(mockApi.getTask).toHaveBeenCalledWith('1', {
        include: ['project', 'assignee', 'workflow_status'],
      });
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
      mockApiInstance.getTasks = mockApi.getTasks;
      mockApiInstance.getTask = mockApi.getTask;

      await handleTasksCommand('get', ['1'], { format: 'json' });

      expect(mockApi.getTask).toHaveBeenCalledWith('1', {
        include: ['project', 'assignee', 'workflow_status'],
      });
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
      mockApiInstance.getTasks = mockApi.getTasks;
      mockApiInstance.getTask = mockApi.getTask;

      await handleTasksCommand('get', ['1'], {});

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      await expect(() => handleTasksCommand('get', [], {})).rejects.toThrow('process.exit(3)');
    });

    it('should handle API errors', async () => {
      const mockError = new ProductiveApiError('Task not found', 404);
      const mockApi = {
        getTask: vi.fn().mockRejectedValue(mockError),
      };
      mockApiInstance.getTasks = mockApi.getTasks;
      mockApiInstance.getTask = mockApi.getTask;

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
      mockApiInstance.getTasks = mockApi.getTasks;
      mockApiInstance.getTask = mockApi.getTask;

      await handleTasksCommand('ls', [], {});

      expect(mockApi.getTasks).toHaveBeenCalled();
    });
  });

  describe('unknown subcommand', () => {
    it.skip('should exit with error for unknown subcommand', async () => {
      await expect(() => handleTasksCommand('unknown', [], {})).rejects.toThrow('process.exit(1)');
    });
  });
});
