import type {
  ProductiveApiResponse,
  ProductiveApiMeta,
  IncludedResource,
} from '@studiometa/productive-api';

import { vi } from 'vitest';

export function mockJsonApiResponse<T>(
  data: T,
  meta?: ProductiveApiMeta,
  included?: IncludedResource[],
): ProductiveApiResponse<T> {
  return { data, meta, included };
}

export function createMockFetch(handler: (url: string, init?: RequestInit) => unknown) {
  return vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
    const data = handler(urlStr, init);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/vnd.api+json' },
    });
  }) as unknown as typeof fetch;
}
