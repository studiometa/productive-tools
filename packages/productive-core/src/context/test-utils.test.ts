import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext, defaultTestConfig, noopResolver } from './test-utils.js';

describe('noopResolver', () => {
  it('returns value unchanged', async () => {
    expect(await noopResolver.resolveValue('test')).toBe('test');
  });

  it('returns filters unchanged', async () => {
    const filters = { person_id: 'john@test.com' };
    const result = await noopResolver.resolveFilters(filters);
    expect(result.resolved).toEqual(filters);
    expect(result.metadata).toEqual({});
  });
});

describe('defaultTestConfig', () => {
  it('has userId and organizationId', () => {
    expect(defaultTestConfig.userId).toBeDefined();
    expect(defaultTestConfig.organizationId).toBeDefined();
  });
});

describe('createTestExecutorContext', () => {
  it('creates context with defaults', () => {
    const ctx = createTestExecutorContext();
    expect(ctx.api).toBeDefined();
    expect(ctx.resolver).toBeDefined();
    expect(ctx.config).toEqual(defaultTestConfig);
  });

  it('overrides api methods', () => {
    const mockFn = vi.fn().mockResolvedValue({ data: [] });
    const ctx = createTestExecutorContext({
      api: { getProjects: mockFn },
    });

    expect(ctx.api.getProjects).toBe(mockFn);
  });

  it('throws for unconfigured api methods', () => {
    const ctx = createTestExecutorContext();
    expect(() => (ctx.api as any).getProjects()).toThrow(/not provided/);
  });

  it('overrides resolver', () => {
    const resolveValue = vi.fn().mockResolvedValue('resolved');
    const ctx = createTestExecutorContext({
      resolver: { resolveValue },
    });

    expect(ctx.resolver.resolveValue).toBe(resolveValue);
    // resolveFilters should still work (from noopResolver spread)
    expect(ctx.resolver.resolveFilters).toBeInstanceOf(Function);
  });

  it('overrides config', () => {
    const ctx = createTestExecutorContext({
      config: { userId: 'custom-user' },
    });

    expect(ctx.config.userId).toBe('custom-user');
    expect(ctx.config.organizationId).toBe(defaultTestConfig.organizationId);
  });
});
