import type { ProductiveApi } from '@studiometa/productive-api';

import { describe, expect, it, vi } from 'vitest';

import { fromCommandContext } from '../from-command-context.js';

describe('fromCommandContext', () => {
  const mockApi = {} as ProductiveApi;

  it('creates an ExecutorContext from command context', () => {
    const ctx = fromCommandContext({
      api: mockApi,
      config: { userId: 'user-1', organizationId: 'org-1' },
    });

    expect(ctx.api).toBe(mockApi);
    expect(ctx.config).toEqual({ userId: 'user-1', organizationId: 'org-1' });
    expect(ctx.resolver).toBeDefined();
    expect(ctx.resolver.resolveValue).toBeInstanceOf(Function);
    expect(ctx.resolver.resolveFilters).toBeInstanceOf(Function);
  });

  it('handles missing organizationId', () => {
    const ctx = fromCommandContext({
      api: mockApi,
      config: { userId: 'user-1' },
    });

    expect(ctx.config.organizationId).toBe('');
  });

  it('handles missing userId', () => {
    const ctx = fromCommandContext({
      api: mockApi,
      config: { organizationId: 'org-1' },
    });

    expect(ctx.config.userId).toBeUndefined();
  });

  it('accepts optional cache', () => {
    const cache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
    };

    const ctx = fromCommandContext(
      { api: mockApi, config: { organizationId: 'org-1' } },
      { cache },
    );

    expect(ctx.resolver).toBeDefined();
  });
});
