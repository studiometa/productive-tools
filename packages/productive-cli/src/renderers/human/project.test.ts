import { describe, it, expect, vi, afterEach } from 'vitest';

import type { RenderContext } from './../types.js';

import { HumanProjectListRenderer } from './project.js';

const ctx: RenderContext = { format: 'human', verbose: false, links: false };

describe('HumanProjectListRenderer', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('renders a list', () => {
    new HumanProjectListRenderer().render(
      {
        data: [{ id: '1', name: 'My Project', number: 'PRJ-001', archived: false, budget: 50000 }],
        meta: { page: 1, total_pages: 2, total_count: 10 },
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders archived project', () => {
    new HumanProjectListRenderer().render(
      {
        data: [{ id: '1', name: 'Old', number: null, archived: true }],
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders empty list', () => {
    new HumanProjectListRenderer().render({ data: [] }, ctx);
    expect(spy).not.toHaveBeenCalled();
  });
});
