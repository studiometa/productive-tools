import { describe, it, expect, vi, afterEach } from 'vitest';

import type { RenderContext } from '../../types.js';

import { HumanDealListRenderer } from '../deal.js';

const ctx: RenderContext = { format: 'human', verbose: false, links: false };

describe('HumanDealListRenderer', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('renders a list', () => {
    new HumanDealListRenderer().render(
      {
        data: [
          {
            id: '1',
            name: 'Big Deal',
            number: 'D-001',
            type: 'deal' as const,
            date: '2024-01-01',
            end_date: '2024-12-31',
            won_at: null,
            lost_at: null,
            company_name: 'Acme',
            responsible_name: 'Jane Doe',
            status_name: 'Open',
          },
        ],
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders won deal', () => {
    new HumanDealListRenderer().render(
      {
        data: [
          {
            id: '1',
            name: 'Won',
            number: null,
            type: 'budget' as const,
            date: null,
            end_date: null,
            won_at: '2024-06-01',
            lost_at: null,
          },
        ],
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders lost deal', () => {
    new HumanDealListRenderer().render(
      {
        data: [
          {
            id: '1',
            name: 'Lost',
            number: null,
            type: 'deal' as const,
            date: null,
            end_date: null,
            won_at: null,
            lost_at: '2024-06-01',
          },
        ],
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders empty list', () => {
    new HumanDealListRenderer().render({ data: [] }, ctx);
    // Renderers may log 'no results' for empty data
  });
});
