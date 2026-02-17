import { describe, it, expect, vi, afterEach } from 'vitest';

import type { RenderContext } from './../types.js';

import { HumanServiceListRenderer } from './service.js';

const ctx: RenderContext = { format: 'human', verbose: false, links: false };

describe('HumanServiceListRenderer', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('renders a list', () => {
    new HumanServiceListRenderer().render(
      {
        data: [{ id: '1', name: 'Dev', budgeted_time: 4800, worked_time: 2400 }],
        meta: { page: 1, total_pages: 2, total_count: 10 },
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders without optional fields', () => {
    new HumanServiceListRenderer().render({ data: [{ id: '1', name: 'QA' }] }, ctx);
    expect(spy).toHaveBeenCalled();
  });

  it('renders empty list', () => {
    new HumanServiceListRenderer().render({ data: [] }, ctx);
    expect(spy).not.toHaveBeenCalled();
  });
});
