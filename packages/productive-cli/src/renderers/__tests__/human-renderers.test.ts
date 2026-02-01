import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  HumanTimeEntryListRenderer,
  HumanTimeEntryDetailRenderer,
} from '../human/time-entry.js';
import {
  HumanProjectListRenderer,
} from '../human/project.js';
import {
  HumanTaskListRenderer,
  formatTime,
} from '../human/task.js';
import {
  KanbanRenderer,
  stripAnsi,
  truncateText,
  padText,
} from '../human/kanban.js';
import type { RenderContext } from '../types.js';

const defaultCtx: RenderContext = {
  noColor: true,
  terminalWidth: 80,
};

describe('HumanTimeEntryListRenderer', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should render time entries with duration', () => {
    const renderer = new HumanTimeEntryListRenderer();
    const data = {
      data: [
        {
          id: '123',
          date: '2024-01-15',
          time_minutes: 480,
          time_hours: '8.00',
          note: 'Development work',
        },
      ],
      meta: { page: 1, total_pages: 1, total_count: 1 },
    };

    renderer.render(data, defaultCtx);

    // Should output date and duration
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('2024-01-15')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('8h 00m')
    );
  });

  it('should render total when there are entries', () => {
    const renderer = new HumanTimeEntryListRenderer();
    const data = {
      data: [
        { id: '1', date: '2024-01-15', time_minutes: 240, time_hours: '4.00', note: null },
        { id: '2', date: '2024-01-16', time_minutes: 240, time_hours: '4.00', note: null },
      ],
    };

    renderer.render(data, defaultCtx);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Total: 8h 00m')
    );
  });

  it('should render pagination info', () => {
    const renderer = new HumanTimeEntryListRenderer();
    const data = {
      data: [{ id: '1', date: '2024-01-15', time_minutes: 60, time_hours: '1.00', note: null }],
      meta: { page: 2, total_pages: 5, total_count: 100 },
    };

    renderer.render(data, defaultCtx);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Page 2/5')
    );
  });
});

describe('HumanTimeEntryDetailRenderer', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should render time entry details', () => {
    const renderer = new HumanTimeEntryDetailRenderer();
    const entry = {
      id: '123',
      date: '2024-01-15',
      time_minutes: 480,
      time_hours: '8.00',
      note: 'Development work',
    };

    renderer.render(entry, defaultCtx);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Time Entry')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('123')
    );
  });
});

describe('HumanProjectListRenderer', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should render projects with status', () => {
    const renderer = new HumanProjectListRenderer();
    const data = {
      data: [
        {
          id: '1',
          name: 'Project A',
          number: 'PRJ-001',
          archived: false,
          budget: 10000,
        },
      ],
    };

    renderer.render(data, defaultCtx);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Project A')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[active]')
    );
  });

  it('should show archived status', () => {
    const renderer = new HumanProjectListRenderer();
    const data = {
      data: [
        {
          id: '1',
          name: 'Old Project',
          number: null,
          archived: true,
        },
      ],
    };

    renderer.render(data, defaultCtx);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[archived]')
    );
  });
});

describe('HumanTaskListRenderer', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should render tasks with status icon', () => {
    const renderer = new HumanTaskListRenderer();
    const data = {
      data: [
        {
          id: '1',
          number: 42,
          title: 'Fix bug',
          closed: false,
          due_date: null,
        },
      ],
    };

    renderer.render(data, defaultCtx);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Fix bug')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('#42')
    );
  });

  it('should show time tracking info', () => {
    const renderer = new HumanTaskListRenderer();
    const data = {
      data: [
        {
          id: '1',
          title: 'Task with time',
          closed: false,
          due_date: null,
          worked_time: 120,
          initial_estimate: 240,
        },
      ],
    };

    renderer.render(data, defaultCtx);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('2h/4h')
    );
  });
});

describe('formatTime helper', () => {
  it('should format minutes only', () => {
    expect(formatTime(30)).toBe('30m');
  });

  it('should format hours only', () => {
    expect(formatTime(60)).toBe('1h');
    expect(formatTime(120)).toBe('2h');
  });

  it('should format hours and minutes', () => {
    expect(formatTime(90)).toBe('1h30m');
    expect(formatTime(150)).toBe('2h30m');
  });

  it('should handle undefined', () => {
    expect(formatTime(undefined)).toBe('-');
  });

  it('should handle zero', () => {
    expect(formatTime(0)).toBe('0m');
  });
});

describe('Kanban helpers', () => {
  describe('stripAnsi', () => {
    it('should strip ANSI color codes', () => {
      const colored = '\x1b[31mRed text\x1b[0m';
      expect(stripAnsi(colored)).toBe('Red text');
    });

    it('should handle text without ANSI codes', () => {
      expect(stripAnsi('Plain text')).toBe('Plain text');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const result = truncateText('This is a very long text', 10);
      expect(stripAnsi(result).length).toBeLessThanOrEqual(10);
      expect(result).toContain('…');
    });

    it('should not truncate short text', () => {
      expect(truncateText('Short', 10)).toBe('Short');
    });
  });

  describe('padText', () => {
    it('should pad text to width', () => {
      const result = padText('Hi', 5);
      expect(result).toBe('Hi   ');
    });

    it('should not pad text already at width', () => {
      expect(padText('Hello', 5)).toBe('Hello');
    });
  });
});

describe('KanbanRenderer', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should render tasks grouped by status', () => {
    const renderer = new KanbanRenderer();
    const data = {
      data: [
        {
          id: '1',
          title: 'Task in progress',
          closed: false,
          due_date: null,
          status_id: 's1',
          status_name: 'In Progress',
        },
        {
          id: '2',
          title: 'Task done',
          closed: true,
          due_date: null,
          status_id: 's2',
          status_name: 'Done',
        },
      ],
      meta: { page: 1, total_pages: 1, total_count: 2 },
    };

    renderer.render(data, { ...defaultCtx, terminalWidth: 80 });

    // Should have column headers
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('In Progress')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Done')
    );
  });

  it('should handle empty data', () => {
    const renderer = new KanbanRenderer();
    const data = { data: [] };

    renderer.render(data, defaultCtx);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('No columns to display')
    );
  });
});
