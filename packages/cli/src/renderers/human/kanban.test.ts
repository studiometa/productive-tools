import type { FormattedTask } from '@studiometa/productive-api';

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

import type { RenderContext } from '../types.js';

import { setColorEnabled } from '../../utils/colors.js';
import { KanbanRenderer, kanbanRenderer, stripAnsi, truncateText, padText } from './kanban.js';

const ctx: RenderContext = { noColor: false, terminalWidth: 100 };

// Sample task factory
function createTask(overrides: Partial<FormattedTask> = {}): FormattedTask {
  return {
    id: '1',
    title: 'Sample Task',
    number: 42,
    closed: false,
    due_date: null,
    description: null,
    initial_estimate: null,
    worked_time: null,
    remaining_time: null,
    project_id: null,
    project_name: null,
    assignee_id: null,
    assignee_name: null,
    status_id: null,
    status_name: null,
    ...overrides,
  };
}

describe('KanbanRenderer', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

  beforeEach(() => {
    // Disable colors for easier testing
    setColorEnabled(false);
  });

  afterEach(() => {
    spy.mockClear();
    setColorEnabled(true);
  });

  describe('render with tasks grouped by status', () => {
    it('renders columns for each status', () => {
      const renderer = new KanbanRenderer();
      const tasks = [
        createTask({ id: '1', title: 'Task 1', status_name: 'To Do', status_id: 's1' }),
        createTask({ id: '2', title: 'Task 2', status_name: 'In Progress', status_id: 's2' }),
        createTask({ id: '3', title: 'Task 3', status_name: 'To Do', status_id: 's1' }),
      ];

      renderer.render({ data: tasks }, ctx);

      // Should have been called multiple times for header, separator, tasks
      expect(spy).toHaveBeenCalled();

      // Check that both columns appear in the output
      const allOutput = spy.mock.calls.map((c) => c[0]).join('\n');
      expect(allOutput).toContain('In Progress');
      expect(allOutput).toContain('To Do');
    });

    it('shows task count in column headers', () => {
      const renderer = new KanbanRenderer();
      const tasks = [
        createTask({ id: '1', title: 'Task 1', status_name: 'Done', status_id: 's1' }),
        createTask({ id: '2', title: 'Task 2', status_name: 'Done', status_id: 's1' }),
      ];

      renderer.render({ data: tasks }, ctx);

      const allOutput = spy.mock.calls.map((c) => c[0]).join('\n');
      expect(allOutput).toContain('(2)');
    });
  });

  describe('render empty data', () => {
    it('displays message when no columns', () => {
      new KanbanRenderer().render({ data: [] }, ctx);

      expect(spy).toHaveBeenCalledWith('No columns to display');
    });
  });

  describe('render tasks without status', () => {
    it('groups tasks without status into "No Status" column', () => {
      const renderer = new KanbanRenderer();
      const tasks = [
        createTask({ id: '1', title: 'Task 1', status_name: undefined, status_id: undefined }),
        createTask({ id: '2', title: 'Task 2', status_name: undefined, status_id: undefined }),
      ];

      renderer.render({ data: tasks }, ctx);

      const allOutput = spy.mock.calls.map((c) => c[0]).join('\n');
      expect(allOutput).toContain('No Status');
    });
  });

  describe('render with assignees', () => {
    it('shows assignee on a separate line', () => {
      const renderer = new KanbanRenderer();
      const tasks = [
        createTask({
          id: '1',
          title: 'Task 1',
          status_name: 'To Do',
          assignee_name: 'Alice',
        }),
      ];

      renderer.render({ data: tasks }, ctx);

      const allOutput = spy.mock.calls.map((c) => c[0]).join('\n');
      expect(allOutput).toContain('Alice');
    });
  });

  describe('render with pagination', () => {
    it('shows total count when meta is provided', () => {
      const renderer = new KanbanRenderer();
      const tasks = [createTask({ id: '1', title: 'Task 1', status_name: 'To Do' })];

      renderer.render({ data: tasks, meta: { page: 1, total_pages: 2, total_count: 15 } }, ctx);

      const allOutput = spy.mock.calls.map((c) => c[0]).join('\n');
      expect(allOutput).toContain('Total: 15 tasks');
    });
  });

  describe('render tasks with missing fields', () => {
    it('handles task without title', () => {
      const renderer = new KanbanRenderer();
      const tasks = [
        createTask({
          id: '1',
          title: undefined as unknown as string,
          status_name: 'To Do',
        }),
      ];

      renderer.render({ data: tasks }, ctx);

      const allOutput = spy.mock.calls.map((c) => c[0]).join('\n');
      expect(allOutput).toContain('Untitled');
    });

    it('handles task without number', () => {
      const renderer = new KanbanRenderer();
      const tasks = [
        createTask({
          id: '1',
          title: 'Task',
          number: undefined,
          status_name: 'To Do',
        }),
      ];

      renderer.render({ data: tasks }, ctx);

      // Should not throw
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('column width calculation', () => {
    it('adjusts to terminal width', () => {
      const renderer = new KanbanRenderer();
      const tasks = [
        createTask({ id: '1', title: 'Task 1', status_name: 'Column A' }),
        createTask({ id: '2', title: 'Task 2', status_name: 'Column B' }),
        createTask({ id: '3', title: 'Task 3', status_name: 'Column C' }),
      ];

      const narrowCtx: RenderContext = { noColor: false, terminalWidth: 60 };
      renderer.render({ data: tasks }, narrowCtx);

      // Should render without error
      expect(spy).toHaveBeenCalled();
    });

    it('handles very narrow terminal', () => {
      const renderer = new KanbanRenderer();
      const tasks = [createTask({ id: '1', title: 'Task 1', status_name: 'To Do' })];

      const veryNarrowCtx: RenderContext = { noColor: false, terminalWidth: 30 };
      renderer.render({ data: tasks }, veryNarrowCtx);

      // Should still render
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('singleton instance', () => {
    it('exports a usable singleton', () => {
      const tasks = [createTask({ id: '1', title: 'Task', status_name: 'Done' })];
      kanbanRenderer.render({ data: tasks }, ctx);
      expect(spy).toHaveBeenCalled();
    });
  });
});

describe('helper functions', () => {
  describe('stripAnsi', () => {
    it('removes ANSI color codes', () => {
      expect(stripAnsi('\x1b[31mred\x1b[0m')).toBe('red');
    });

    it('removes bold codes', () => {
      expect(stripAnsi('\x1b[1mbold\x1b[0m')).toBe('bold');
    });

    it('returns plain text unchanged', () => {
      expect(stripAnsi('plain text')).toBe('plain text');
    });

    it('handles OSC hyperlink sequences', () => {
      const linked = '\x1b]8;;https://example.com\x1b\\link\x1b]8;;\x1b\\';
      expect(stripAnsi(linked)).toBe('link');
    });
  });

  describe('truncateText', () => {
    it('returns short text unchanged', () => {
      expect(truncateText('short', 10)).toBe('short');
    });

    it('truncates long text with ellipsis', () => {
      const result = truncateText('this is a very long text', 10);
      expect(stripAnsi(result).length).toBeLessThanOrEqual(10);
      expect(result).toContain('…');
    });

    it('handles exact length', () => {
      expect(truncateText('exact', 5)).toBe('exact');
    });
  });

  describe('padText', () => {
    it('pads short text to width', () => {
      expect(padText('hi', 5)).toBe('hi   ');
    });

    it('returns text unchanged if already at width', () => {
      expect(padText('hello', 5)).toBe('hello');
    });

    it('returns text unchanged if longer than width', () => {
      expect(padText('hello world', 5)).toBe('hello world');
    });

    it('handles text with ANSI codes', () => {
      setColorEnabled(true);
      const colored = '\x1b[31mred\x1b[0m';
      const padded = padText(colored, 10);
      // Visible length should be 3 (red), so should add 7 spaces
      expect(padded).toBe(colored + '       ');
      setColorEnabled(false);
    });
  });
});
