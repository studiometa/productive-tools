/**
 * Test utilities for creating mock ExecutorContext instances.
 *
 * @example
 * ```typescript
 * const ctx = createTestExecutorContext({
 *   api: {
 *     getTimeEntries: vi.fn().mockResolvedValue({ data: [], meta: {} }),
 *   },
 * });
 *
 * const result = await listTimeEntries({ page: 1, perPage: 10 }, ctx);
 * expect(ctx.api.getTimeEntries).toHaveBeenCalled();
 * ```
 */

import type { ProductiveApi } from '@studiometa/productive-cli';

import type { ExecutorConfig, ExecutorContext, ResourceResolver } from './types.js';

/**
 * No-op resource resolver that returns values unchanged.
 * Useful for tests that don't need resolution.
 */
export const noopResolver: ResourceResolver = {
  async resolveValue(value: string): Promise<string> {
    return value;
  },

  async resolveFilters(
    filters: Record<string, string>,
  ): Promise<{ resolved: Record<string, string>; metadata: Record<string, never> }> {
    return { resolved: filters, metadata: {} };
  },
};

/**
 * Default test config
 */
export const defaultTestConfig: ExecutorConfig = {
  userId: 'test-user-123',
  organizationId: 'test-org-456',
};

/**
 * Create a mock API that throws descriptive errors for unconfigured methods.
 */
function createMockApi(overrides: Partial<ProductiveApi> = {}): ProductiveApi {
  return new Proxy(overrides as ProductiveApi, {
    get(target, prop) {
      if (prop in target) {
        return target[prop as keyof ProductiveApi];
      }
      if (typeof prop === 'string') {
        return () => {
          throw new Error(
            `Mock API method '${prop}' was called but not provided. ` +
              `Add it to createTestExecutorContext({ api: { ${prop}: vi.fn()... } })`,
          );
        };
      }
    },
  });
}

/**
 * Create a test ExecutorContext with optional overrides.
 *
 * All dependencies have safe defaults:
 * - api: Proxy that throws descriptive errors for unconfigured methods
 * - resolver: No-op resolver (returns values unchanged)
 * - config: Default test config with fake IDs
 */
export function createTestExecutorContext(
  overrides: {
    api?: Partial<ProductiveApi>;
    resolver?: Partial<ResourceResolver>;
    config?: Partial<ExecutorConfig>;
  } = {},
): ExecutorContext {
  return {
    api: createMockApi(overrides.api),
    resolver: { ...noopResolver, ...overrides.resolver },
    config: { ...defaultTestConfig, ...overrides.config },
  };
}
