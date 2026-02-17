import { describe, it, expect, vi, afterEach } from 'vitest';

import type { RenderContext } from './../types.js';

import { HumanTaskListRenderer } from './task.js';

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
});
