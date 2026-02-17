import { describe, it, expect, vi, afterEach } from 'vitest';

import type { RenderContext } from '../types.js';

import { HumanTimerListRenderer } from './timer.js';

const ctx: RenderContext = { format: 'human', verbose: false, links: false };

describe('HumanTimerListRenderer', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('renders a running timer', () => {
    new HumanTimerListRenderer().render(
      {
        data: [
          {
            id: '1',
            person_id: 100,
            started_at: '2024-01-15T10:00:00Z',
            stopped_at: null,
            total_time: 3600,
            running: true,
          },
        ],
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders a stopped timer', () => {
    new HumanTimerListRenderer().render(
      {
        data: [
          {
            id: '1',
            person_id: 100,
            started_at: '2024-01-15T10:00:00Z',
            stopped_at: '2024-01-15T12:00:00Z',
            total_time: 7200,
            running: false,
          },
        ],
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders empty list', () => {
    new HumanTimerListRenderer().render({ data: [] }, ctx);
    // Renderers may log 'no results' for empty data
  });
});
