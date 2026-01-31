/**
 * Command context for explicit dependency injection.
 *
 * Instead of creating dependencies inside command handlers (hidden dependencies),
 * this module provides explicit dependency passing, making commands:
 * - Easier to test (inject mocks directly)
 * - More transparent about their requirements
 * - Decoupled from global state
 *
 * @example
 * ```typescript
 * // Instead of this (hidden dependencies):
 * async function projectsList(options: Options) {
 *   const config = getConfig();  // hidden
 *   const api = new ProductiveApi(options);  // hidden
 *   const formatter = new OutputFormatter(format);  // hidden
 *   // ...
 * }
 *
 * // Use this (explicit dependencies):
 * async function projectsList(ctx: CommandContext) {
 *   const { api, formatter, config } = ctx;
 *   // ...
 * }
 * ```
 */

import { ProductiveApi } from "./api.js";
import { OutputFormatter, createSpinner } from "./output.js";
import { getConfig } from "./config.js";
import { getCache, type CacheStore } from "./utils/cache.js";
import type { OutputFormat, ProductiveConfig } from "./types.js";
import type { Spinner } from "./utils/spinner.js";

/**
 * Options passed to command context creation
 */
export interface CommandOptions extends Record<string, string | boolean> {
  format?: string;
  f?: string;
  "no-color"?: boolean;
  "no-cache"?: boolean;
  refresh?: boolean;
  page?: string | number;
  p?: string | number;
  size?: string | number;
  s?: string | number;
  sort?: string;
}

/**
 * Context containing all dependencies needed by commands.
 * This is the main interface for dependency injection.
 */
export interface CommandContext {
  /** Configured API client */
  readonly api: ProductiveApi;

  /** Output formatter for the current format */
  readonly formatter: OutputFormatter;

  /** Resolved configuration */
  readonly config: ProductiveConfig;

  /** Cache store */
  readonly cache: CacheStore;

  /** Raw CLI options */
  readonly options: CommandOptions;

  /** Create a spinner for long operations */
  createSpinner(message: string): Spinner;

  /** Get pagination parameters */
  getPagination(): { page: number; perPage: number };

  /** Get sort parameter */
  getSort(): string;
}

/**
 * Creates a command context from CLI options.
 *
 * This is the main factory function for creating contexts in production.
 * Tests can create their own contexts with mock implementations.
 *
 * @example
 * ```typescript
 * const ctx = createContext(options);
 * const projects = await ctx.api.getProjects(ctx.getPagination());
 * ctx.formatter.output(projects);
 * ```
 */
export function createContext(options: CommandOptions = {}): CommandContext {
  const format = (options.format || options.f || "human") as OutputFormat;
  const noColor = options["no-color"] === true;

  const config = getConfig(options);
  const formatter = new OutputFormatter(format, noColor);
  const api = new ProductiveApi(options);
  const cache = getCache(options["no-cache"] !== true);

  return {
    api,
    formatter,
    config,
    cache,
    options,

    createSpinner(message: string): Spinner {
      return createSpinner(message, format);
    },

    getPagination(): { page: number; perPage: number } {
      return {
        page: parseInt(String(options.page || options.p || "1")),
        perPage: parseInt(String(options.size || options.s || "100")),
      };
    },

    getSort(): string {
      return String(options.sort || "");
    },
  };
}

/**
 * Creates a test context with provided mocks.
 *
 * This allows tests to inject mock implementations without vi.mock().
 *
 * @example
 * ```typescript
 * const mockApi = {
 *   getProjects: vi.fn().mockResolvedValue({ data: [] }),
 * };
 *
 * const ctx = createTestContext({
 *   api: mockApi as unknown as ProductiveApi,
 * });
 *
 * await projectsList(ctx);
 * expect(mockApi.getProjects).toHaveBeenCalled();
 * ```
 */
export function createTestContext(
  overrides: Partial<CommandContext> = {},
): CommandContext {
  const defaultConfig: ProductiveConfig = {
    apiToken: "test-token",
    organizationId: "test-org",
    userId: "test-user",
    baseUrl: "https://api.productive.io/api/v2",
  };

  const defaultOptions: CommandOptions = {
    format: "json",
    "no-color": true,
  };

  // Create no-op spinner for tests
  const noopSpinner = {
    start: () => noopSpinner,
    succeed: () => noopSpinner,
    fail: () => noopSpinner,
    stop: () => noopSpinner,
    setText: () => noopSpinner,
  } as unknown as Spinner;

  const defaultFormatter = new OutputFormatter("json", true);

  // Create a mock cache
  const mockCache: CacheStore = {
    get: () => null,
    set: () => {},
    getAsync: async () => null,
    setAsync: async () => {},
    setOrgId: () => {},
    invalidate: () => {},
    invalidateAsync: async () => {},
    isEnabled: () => false,
  };

  // Create a mock API that throws if called without override
  const mockApi = new Proxy(
    {},
    {
      get(_, prop) {
        if (typeof prop === "string") {
          return () => {
            throw new Error(
              `Mock API method '${prop}' was called but not provided in test context`,
            );
          };
        }
      },
    },
  ) as ProductiveApi;

  return {
    api: overrides.api ?? mockApi,
    formatter: overrides.formatter ?? defaultFormatter,
    config: overrides.config ?? defaultConfig,
    cache: overrides.cache ?? mockCache,
    options: overrides.options ?? defaultOptions,
    createSpinner: overrides.createSpinner ?? (() => noopSpinner),
    getPagination: overrides.getPagination ?? (() => ({ page: 1, perPage: 100 })),
    getSort: overrides.getSort ?? (() => ""),
  };
}

/**
 * Higher-order function that wraps a context-based command for CLI usage.
 *
 * This bridges the gap between the existing CLI interface and the new
 * context-based approach, allowing gradual migration.
 *
 * @example
 * ```typescript
 * // Define command with context
 * async function projectsListImpl(ctx: CommandContext) {
 *   const response = await ctx.api.getProjects(ctx.getPagination());
 *   ctx.formatter.output(response.data);
 * }
 *
 * // Export wrapped version for CLI
 * export const projectsList = withContext(projectsListImpl);
 *
 * // CLI calls it as:
 * await projectsList(options, formatter);
 * ```
 */
export function withContext<T>(
  handler: (ctx: CommandContext) => Promise<T>,
): (options: CommandOptions) => Promise<T> {
  return async (options: CommandOptions) => {
    const ctx = createContext(options);
    return handler(ctx);
  };
}
