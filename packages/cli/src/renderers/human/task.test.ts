import { describe, it, expect, vi, afterEach } from 'vitest';

import type { RenderContext } from '../types.js';

import { HumanTaskListRenderer, HumanTaskDetailRenderer, formatTime } from './task.js';

const ctx: RenderContext = { format: 'human', verbose: false, links: false };

describe('HumanTaskListRenderer', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('renders a list', () => {
    new HumanTaskListRenderer().render(
      {
        data: [
          {
            id: '1',
            title: 'Fix bug',
            number: 42,
            closed: false,
            due_date: '2024-12-31',
            description: 'Important fix',
            initial_estimate: 480,
            worked_time: 240,
            remaining_time: 240,
            project_name: 'My Project',
            assignee_name: 'John',
            status_name: 'In Progress',
          },
        ],
        meta: { page: 1, total_pages: 2, total_count: 10 },
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders closed task', () => {
    new HumanTaskListRenderer().render(
      {
        data: [{ id: '1', title: 'Done', closed: true, due_date: null }],
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders overdue task', () => {
    new HumanTaskListRenderer().render(
      {
        data: [{ id: '1', title: 'Late', closed: false, due_date: '2020-01-01' }],
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders task without optional fields', () => {
    new HumanTaskListRenderer().render(
      {
        data: [{ id: '1', title: 'Min', closed: false, due_date: null }],
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders empty list', () => {
    new HumanTaskListRenderer().render({ data: [] }, ctx);
    expect(spy).not.toHaveBeenCalled();
  });

  it('renders task with only worked time (no estimate)', () => {
    new HumanTaskListRenderer().render(
      {
        data: [{ id: '1', title: 'Work', closed: false, due_date: null, worked_time: 120 }],
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
    const calls = spy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(calls).toContain('2h');
  });

  it('renders task with estimate but no worked time', () => {
    new HumanTaskListRenderer().render(
      {
        data: [{ id: '1', title: 'Planned', closed: false, due_date: null, initial_estimate: 480 }],
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
    const calls = spy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(calls).toContain('Est:');
  });

  it('renders task with worked time over budget', () => {
    new HumanTaskListRenderer().render(
      {
        data: [
          {
            id: '1',
            title: 'Overrun',
            closed: false,
            due_date: null,
            worked_time: 600,
            initial_estimate: 480,
          },
        ],
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders task with linked project_id and assignee_id', () => {
    new HumanTaskListRenderer().render(
      {
        data: [
          {
            id: '1',
            title: 'Linked',
            closed: false,
            due_date: null,
            project_name: 'My Project',
            project_id: '42',
            assignee_name: 'Alice',
            assignee_id: '99',
          },
        ],
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });
});

describe('HumanTaskDetailRenderer', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('renders a full task detail', () => {
    new HumanTaskDetailRenderer().render(
      {
        id: '1',
        title: 'Fix critical bug',
        number: 42,
        closed: false,
        due_date: '2099-12-31',
        description: 'Line one\nLine two',
        initial_estimate: 480,
        worked_time: 240,
        remaining_time: 240,
        project_name: 'My Project',
        project_id: '10',
        assignee_name: 'Alice',
        assignee_id: '99',
        status_name: 'In Progress',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
    const allOutput = spy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(allOutput).toContain('Fix critical bug');
    expect(allOutput).toContain('Description:');
    expect(allOutput).toContain('Line one');
    expect(allOutput).toContain('Created:');
    expect(allOutput).toContain('Updated:');
  });

  it('renders a closed task', () => {
    new HumanTaskDetailRenderer().render(
      { id: '1', title: 'Done', closed: true, due_date: null },
      ctx,
    );
    const allOutput = spy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(allOutput).toContain('✓ Completed');
  });

  it('renders task without number', () => {
    new HumanTaskDetailRenderer().render(
      { id: '1', title: 'No Number', closed: false, due_date: null },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders task with overdue due date', () => {
    new HumanTaskDetailRenderer().render(
      { id: '1', title: 'Overdue', closed: false, due_date: '2020-01-01' },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders task with worked time over budget', () => {
    new HumanTaskDetailRenderer().render(
      {
        id: '1',
        title: 'Over Budget',
        closed: false,
        due_date: null,
        worked_time: 600,
        initial_estimate: 480,
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders task with worked time under budget', () => {
    new HumanTaskDetailRenderer().render(
      {
        id: '1',
        title: 'Under Budget',
        closed: false,
        due_date: null,
        worked_time: 240,
        initial_estimate: 480,
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders task with only estimate', () => {
    new HumanTaskDetailRenderer().render(
      { id: '1', title: 'Planned', closed: false, due_date: null, initial_estimate: 480 },
      ctx,
    );
    const allOutput = spy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(allOutput).toContain('Estimate:');
  });

  it('renders task with worked time but no estimate', () => {
    new HumanTaskDetailRenderer().render(
      { id: '1', title: 'Tracked', closed: false, due_date: null, worked_time: 120 },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders task with project but no project_id', () => {
    new HumanTaskDetailRenderer().render(
      { id: '1', title: 'No ProjId', closed: false, due_date: null, project_name: 'My Project' },
      ctx,
    );
    const allOutput = spy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(allOutput).toContain('My Project');
  });

  it('renders task with assignee but no assignee_id', () => {
    new HumanTaskDetailRenderer().render(
      { id: '1', title: 'No AsgnId', closed: false, due_date: null, assignee_name: 'Bob' },
      ctx,
    );
    const allOutput = spy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(allOutput).toContain('Bob');
  });
});

describe('formatTime', () => {
  it('returns - for undefined', () => {
    expect(formatTime(undefined)).toBe('-');
  });

  it('returns - for null', () => {
    expect(formatTime(null as unknown as number)).toBe('-');
  });

  it('formats minutes only', () => {
    expect(formatTime(45)).toBe('45m');
  });

  it('formats hours only', () => {
    expect(formatTime(120)).toBe('2h');
  });

  it('formats hours and minutes', () => {
    expect(formatTime(90)).toBe('1h30m');
  });
});
