import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { ProductiveApi } from './../api.js';

import { createTestContext } from './../context.js';
import { stripAnsi, truncateText, padText } from './../renderers/human/kanban.js';
import { formatTime } from './../renderers/human/task.js';
import { parseFilters } from './../utils/parse-filters.js';
import { handleTasksCommand } from './tasks/command.js';
import {
  tasksList,
  tasksGet,
  tasksAdd,
  tasksUpdate,
  getIncludedResource,
} from './tasks/handlers.js';
import { showTasksHelp } from './tasks/help.js';

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

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('tasksList', () => {
    it('should list open tasks by default', async () => {
      const getTasks = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'tasks',
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
      });

      const ctx = createTestContext({
        api: { getTasks } as unknown as ProductiveApi,
      });

      await tasksList(ctx);

      expect(getTasks).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { status: '1' },
        sort: '',
        include: ['project', 'assignee', 'workflow_status'],
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should list completed tasks with --status completed', async () => {
      const getTasks = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });

      const ctx = createTestContext({
        api: { getTasks } as unknown as ProductiveApi,
        options: { status: 'completed', format: 'json' },
      });

      await tasksList(ctx);

      expect(getTasks).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { status: '2' },
        sort: '',
        include: ['project', 'assignee', 'workflow_status'],
      });
    });

    it('should list all tasks with --status all', async () => {
      const getTasks = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });

      const ctx = createTestContext({
        api: { getTasks } as unknown as ProductiveApi,
        options: { status: 'all', format: 'json' },
      });

      await tasksList(ctx);

      expect(getTasks).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {},
        sort: '',
        include: ['project', 'assignee', 'workflow_status'],
      });
    });

    it('should filter tasks by project', async () => {
      const getTasks = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });

      const ctx = createTestContext({
        api: { getTasks } as unknown as ProductiveApi,
        options: { project: '123', format: 'json' },
      });

      await tasksList(ctx);

      expect(getTasks).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { project_id: '123', status: '1' },
        sort: '',
        include: ['project', 'assignee', 'workflow_status'],
      });
    });

    it('should filter tasks with extended filters', async () => {
      const getTasks = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });

      const ctx = createTestContext({
        api: { getTasks } as unknown as ProductiveApi,
        options: {
          assignee: 'person-1',
          creator: 'person-2',
          company: 'company-1',
          board: 'board-1',
          'task-list': 'list-1',
          'workflow-status': 'status-1',
          parent: 'parent-1',
          status: 'all',
          format: 'json',
        },
      });

      await tasksList(ctx);

      expect(getTasks).toHaveBeenCalledWith({
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
      const getTasks = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });

      const ctx = createTestContext({
        api: { getTasks } as unknown as ProductiveApi,
        options: { overdue: true, status: 'all', format: 'json' },
      });

      await tasksList(ctx);

      expect(getTasks).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { overdue_status: '2' },
        sort: '',
        include: ['project', 'assignee', 'workflow_status'],
      });
    });

    it('should filter tasks by due date', async () => {
      const getTasks = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });

      const ctx = createTestContext({
        api: { getTasks } as unknown as ProductiveApi,
        options: {
          'due-date': '2024-12-31',
          'due-before': '2025-01-15',
          'due-after': '2024-01-01',
          status: 'all',
          format: 'json',
        },
      });

      await tasksList(ctx);

      expect(getTasks).toHaveBeenCalledWith({
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
      const getTasks = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });

      const ctx = createTestContext({
        api: { getTasks } as unknown as ProductiveApi,
        options: { page: '2', size: '50', sort: 'due_date', format: 'json' },
      });

      await tasksList(ctx);

      expect(getTasks).toHaveBeenCalledWith({
        page: 2,
        perPage: 50,
        filter: { status: '1' },
        sort: 'due_date',
        include: ['project', 'assignee', 'workflow_status'],
      });
    });

    it('should handle API errors', async () => {
      const { ProductiveApiError } = await import('@studiometa/productive-api');
      const getTasks = vi.fn().mockRejectedValue(new ProductiveApiError('API Error', 500));
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        api: { getTasks } as unknown as ProductiveApi,
      });

      await tasksList(ctx);

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('tasksGet', () => {
    it('should get a task by id', async () => {
      const getTask = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'tasks',
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
      });

      const ctx = createTestContext({
        api: { getTask } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await tasksGet(['1'], ctx);

      expect(getTask).toHaveBeenCalledWith('1', {
        include: ['project', 'assignee', 'workflow_status'],
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const ctx = createTestContext();

      try {
        await tasksGet([], ctx);
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should handle API errors (not found)', async () => {
      const { ProductiveApiError } = await import('@studiometa/productive-api');
      const getTask = vi.fn().mockRejectedValue(new ProductiveApiError('Task not found', 404));
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        api: { getTask } as unknown as ProductiveApi,
      });

      await tasksGet(['999'], ctx);

      expect(processExitSpy).toHaveBeenCalledWith(5);
    });
  });

  describe('tasksList formats', () => {
    const mockTask = {
      id: '1',
      type: 'tasks',
      attributes: {
        title: 'Test task',
        number: 42,
        worked_time: 120,
        initial_estimate: 480,
        due_date: '2024-02-01',
      },
      relationships: {
        project: { data: { id: 'p1' } },
        assignee: { data: { id: 'a1' } },
        workflow_status: { data: { id: 'ws1' } },
      },
    };
    const mockIncluded = [
      { id: 'p1', type: 'projects', attributes: { name: 'Project A' } },
      { id: 'a1', type: 'people', attributes: { first_name: 'John', last_name: 'Doe' } },
      { id: 'ws1', type: 'workflow_statuses', attributes: { name: 'In Progress' } },
    ];

    it('should list tasks in csv format', async () => {
      const getTasks = vi.fn().mockResolvedValue({
        data: [mockTask],
        meta: { total: 1 },
        included: mockIncluded,
      });

      const ctx = createTestContext({
        api: { getTasks } as unknown as ProductiveApi,
        options: { format: 'csv' },
      });

      await tasksList(ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should list tasks in human format', async () => {
      const getTasks = vi.fn().mockResolvedValue({
        data: [mockTask],
        meta: { total: 1 },
        included: mockIncluded,
      });

      const ctx = createTestContext({
        api: { getTasks } as unknown as ProductiveApi,
        options: { format: 'human' },
      });

      await tasksList(ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('tasksGet formats', () => {
    it('should get a task in human format', async () => {
      const getTask = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'tasks',
          attributes: { title: 'Test task', number: 42 },
        },
        included: [],
      });

      const ctx = createTestContext({
        api: { getTask } as unknown as ProductiveApi,
        options: { format: 'human' },
      });

      await tasksGet(['1'], ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('tasksAdd', () => {
    it('should create a task in json format', async () => {
      const createTask = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'tasks',
          attributes: { title: 'New task', number: 99, due_date: '2024-03-01' },
        },
      });

      const ctx = createTestContext({
        api: { createTask } as unknown as ProductiveApi,
        options: {
          title: 'New task',
          project: '123',
          'task-list': '456',
          format: 'json',
        },
      });

      await tasksAdd(ctx);
      expect(createTask).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should create a task in human format', async () => {
      const createTask = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'tasks',
          attributes: { title: 'New task', number: 99, due_date: '2024-03-01' },
        },
      });

      const ctx = createTestContext({
        api: { createTask } as unknown as ProductiveApi,
        options: {
          title: 'New task',
          project: '123',
          'task-list': '456',
          format: 'human',
        },
      });

      await tasksAdd(ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when title is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({ options: { project: '123', 'task-list': '456' } });
      await tasksAdd(ctx);

      expect(processExitSpy).toHaveBeenCalled();
    });

    it('should exit with error when project is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({ options: { title: 'Test', 'task-list': '456' } });
      await tasksAdd(ctx);

      expect(processExitSpy).toHaveBeenCalled();
    });

    it('should exit with error when task-list is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({ options: { title: 'Test', project: '123' } });
      await tasksAdd(ctx);

      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('tasksUpdate', () => {
    it('should update a task in json format', async () => {
      const updateTask = vi.fn().mockResolvedValue({
        data: { id: '1', type: 'tasks', attributes: { title: 'Updated' } },
      });

      const ctx = createTestContext({
        api: { updateTask } as unknown as ProductiveApi,
        options: { title: 'Updated', format: 'json' },
      });

      await tasksUpdate(['1'], ctx);
      expect(updateTask).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should update a task in human format', async () => {
      const updateTask = vi.fn().mockResolvedValue({
        data: { id: '1', type: 'tasks', attributes: { title: 'Updated' } },
      });

      const ctx = createTestContext({
        api: { updateTask } as unknown as ProductiveApi,
        options: { title: 'Updated', format: 'human' },
      });

      await tasksUpdate(['1'], ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({ options: { title: 'Updated' } });
      try {
        await tasksUpdate([], ctx);
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should exit with error when no updates specified', async () => {
      const updateTask = vi.fn().mockRejectedValue(
        Object.assign(new Error('No updates specified'), {
          name: 'ExecutorValidationError',
          field: 'options',
        }),
      );

      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        api: { updateTask } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await tasksUpdate(['1'], ctx);
      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('command routing', () => {
    it('should handle unknown subcommand', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await handleTasksCommand('unknown', [], {
        format: 'json',
        token: 'test-token',
        'org-id': 'test-org',
      });

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
