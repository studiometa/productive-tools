import { describe, expect, it, vi } from 'vitest';

import type { HandlerContext } from './types.js';

import { handleApiRead } from './api-read.js';

function createHandlerContext(requestRaw: ReturnType<typeof vi.fn>): HandlerContext {
  return {
    formatOptions: { compact: false },
    perPage: 20,
    includeHints: false,
    includeSuggestions: false,
    executor: () => ({
      api: { requestRaw } as never,
      resolver: {} as never,
      config: { organizationId: 'org' },
    }),
  };
}

describe('handleApiRead', () => {
  it('searches the endpoint catalog without a path', async () => {
    const requestRaw = vi.fn();
    const result = await handleApiRead({ search: 'tasks' }, createHandlerContext(requestRaw));
    expect(result.isError).toBeUndefined();
    const body = JSON.parse((result.content[0] as { text: string }).text);
    expect(body.total).toBeGreaterThan(0);
    expect(body.matches.some((m: { path: string }) => m.path.includes('task'))).toBe(true);
    expect(requestRaw).not.toHaveBeenCalled();
  });

  it('errors when neither path nor search is provided', async () => {
    const result = await handleApiRead({}, createHandlerContext(vi.fn()));
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('path');
  });

  it('returns endpoint docs in describe mode', async () => {
    const result = await handleApiRead(
      { path: '/invoices', describe: true },
      createHandlerContext(vi.fn()),
    );
    expect(result.isError).toBeUndefined();
    expect((result.content[0] as { text: string }).text).toContain('/invoices');
    expect((result.content[0] as { text: string }).text).toContain('sent_status');
  });

  it('executes a validated GET request', async () => {
    const requestRaw = vi.fn().mockResolvedValue({ data: [{ id: '1' }] });
    const result = await handleApiRead(
      {
        path: '/api/v2/invoices',
        filter: { sent_status: { eq: 2 } },
        include: ['company'],
        sort: ['-sent_on'],
      },
      createHandlerContext(requestRaw),
    );

    expect(result.isError).toBeUndefined();
    expect(requestRaw).toHaveBeenCalledWith('/invoices', {
      method: 'GET',
      query: {
        'filter[sent_status][eq]': '2',
        include: 'company',
        sort: '-sent_on',
      },
    });
  });

  it('preserves paginated response shape with meta and included', async () => {
    const requestRaw = vi
      .fn()
      .mockResolvedValueOnce({
        data: [{ id: '1' }],
        meta: { current_page: 1, total_pages: 2 },
        included: [{ id: '10', type: 'companies', attributes: { name: 'ACME' } }],
      })
      .mockResolvedValueOnce({
        data: [{ id: '2' }],
        meta: { current_page: 2, total_pages: 2 },
      });

    const result = await handleApiRead(
      {
        path: '/invoices',
        paginate: true,
      },
      createHandlerContext(requestRaw),
    );

    expect(result.isError).toBeUndefined();
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('"data"');
    expect(text).toContain('"meta"');
    expect(text).toContain('"included"');
    expect(text).toContain('"pagesFetched": 2');
  });

  it('returns a helpful error for invalid filters', async () => {
    const result = await handleApiRead(
      { path: '/invoices', filter: { nope: 'x' } },
      createHandlerContext(vi.fn()),
    );

    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('Invalid filter field');
  });

  it('returns a helpful error for invalid nested logical-group filters', async () => {
    const result = await handleApiRead(
      {
        path: '/invoices',
        filter: {
          $op: 'and',
          0: { nope: 'x' },
        },
      },
      createHandlerContext(vi.fn()),
    );

    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('Invalid filter field');
  });
});
