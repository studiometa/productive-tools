import { describe, it, expect, vi, afterEach } from 'vitest';

import type { RenderContext } from '../../types.js';

import { HumanTimeEntryListRenderer } from '../time-entry.js';

const ctx: RenderContext = { format: 'human', verbose: false, links: false };

describe('HumanTimeEntryListRenderer', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('renders a list', () => {
    new HumanTimeEntryListRenderer().render(
      {
        data: [
          {
            id: '1',
            date: '2024-01-15',
            time_minutes: 480,
            time_hours: '8.00',
            note: 'Dev work',
            person_id: '1',
            project_id: '2',
          },
        ],
        meta: { page: 1, total_pages: 2, total_count: 10 },
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders entry with null note', () => {
    new HumanTimeEntryListRenderer().render(
      {
        data: [{ id: '1', date: '2024-01-15', time_minutes: 60, time_hours: '1.00', note: null }],
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders empty list', () => {
    new HumanTimeEntryListRenderer().render({ data: [] }, ctx);
    expect(spy).not.toHaveBeenCalled();
  });
});
