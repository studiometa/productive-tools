import { describe, it, expect, vi, afterEach } from 'vitest';

import type { RenderContext } from './../types.js';

import { HumanBookingListRenderer } from './booking.js';

const ctx: RenderContext = { format: 'human', verbose: false, links: false };

describe('HumanBookingListRenderer', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('renders a list', () => {
    new HumanBookingListRenderer().render(
      {
        data: [
          {
            id: '1',
            started_on: '2024-01-01',
            ended_on: '2024-01-05',
            time: 480,
            total_time: 2400,
            percentage: 100,
            booking_method: 'per_day',
            draft: false,
            note: 'Sprint work',
            approved_at: '2024-01-06',
            rejected_at: null,
            rejected_reason: null,
            person_name: 'Jane Doe',
            service_name: 'Dev',
          },
        ],
        meta: { page: 1, total_pages: 2, total_count: 10 },
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders draft booking', () => {
    new HumanBookingListRenderer().render(
      {
        data: [
          {
            id: '1',
            started_on: '2024-01-01',
            ended_on: '2024-01-05',
            time: null,
            total_time: null,
            percentage: null,
            booking_method: 'percentage',
            draft: true,
            note: null,
            approved_at: null,
            rejected_at: null,
            rejected_reason: null,
          },
        ],
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders rejected booking', () => {
    new HumanBookingListRenderer().render(
      {
        data: [
          {
            id: '1',
            started_on: '2024-01-01',
            ended_on: '2024-01-05',
            time: 480,
            total_time: 480,
            percentage: 100,
            booking_method: 'total_hours',
            draft: false,
            note: null,
            approved_at: null,
            rejected_at: '2024-01-02',
            rejected_reason: 'Too much',
          },
        ],
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders empty list', () => {
    new HumanBookingListRenderer().render({ data: [] }, ctx);
    // Renderers may log 'no results' for empty data
  });
});
