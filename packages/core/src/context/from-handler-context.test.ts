import type { ProductiveApi } from '@studiometa/productive-api';

import { describe, expect, it, vi } from 'vitest';

import { fromHandlerContext } from './from-handler-context.js';

describe('fromHandlerContext', () => {
  const mockApi = {} as ProductiveApi;

  it('creates an ExecutorContext from handler context', () => {
    const ctx = fromHandlerContext({ api: mockApi });

    expect(ctx.api).toBe(mockApi);
    expect(ctx.config).toEqual({ organizationId: '' });
    expect(ctx.resolver).toBeDefined();
    expect(ctx.resolver.resolveValue).toBeInstanceOf(Function);
    expect(ctx.resolver.resolveFilters).toBeInstanceOf(Function);
  });

  it('uses orgId when provided', () => {
    const ctx = fromHandlerContext({ api: mockApi }, { orgId: 'org-1' });

    expect(ctx.config.organizationId).toBe('org-1');
  });

  it('accepts optional cache', () => {
    const cache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
    };

    const ctx = fromHandlerContext({ api: mockApi }, { cache, orgId: 'org-1' });

    expect(ctx.resolver).toBeDefined();
  });

  it('uses userId when provided', () => {
    const ctx = fromHandlerContext({ api: mockApi }, { userId: 'user-123', orgId: 'org-1' });

    expect(ctx.config.userId).toBe('user-123');
    expect(ctx.config.organizationId).toBe('org-1');
  });
});
