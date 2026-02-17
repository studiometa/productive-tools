import { describe, it, expect, vi, afterEach } from 'vitest';

import type { RenderContext } from '../../types.js';

import { HumanCompanyListRenderer } from '../company.js';

const ctx: RenderContext = { format: 'human', verbose: false, links: false };

describe('HumanCompanyListRenderer', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('renders a list of companies', () => {
    new HumanCompanyListRenderer().render(
      {
        data: [
          {
            id: '1',
            name: 'Acme',
            billing_name: 'Acme Inc',
            company_code: 'ACM',
            vat: 'FR123',
            default_currency: 'EUR',
            domain: 'acme.com',
            due_days: 30,
            archived: false,
          },
        ],
        meta: { page: 1, total_pages: 3, total_count: 50 },
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders archived company', () => {
    new HumanCompanyListRenderer().render(
      {
        data: [
          {
            id: '1',
            name: 'Old Corp',
            billing_name: null,
            company_code: null,
            vat: null,
            default_currency: null,
            domain: null,
            due_days: null,
            archived: true,
          },
        ],
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders empty list', () => {
    new HumanCompanyListRenderer().render({ data: [] }, ctx);
    // Renderers may log 'no results' for empty data
  });
});
