import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createContext,
  createTestContext,
  withContext,
  type CommandContext,
} from '../context.js';
import { OutputFormatter } from '../output.js';

// Mock dependencies
vi.mock('../api.js', () => ({
  ProductiveApi: vi.fn().mockImplementation(() => ({
    getProjects: vi.fn(),
    getTimeEntries: vi.fn(),
  })),
  ProductiveApiError: class ProductiveApiError extends Error {
    constructor(
      message: string,
      public statusCode?: number,
      public response?: unknown,
    ) {
      super(message);
      this.name = 'ProductiveApiError';
    }
  },
}));

vi.mock('../config.js', () => ({
  getConfig: vi.fn().mockReturnValue({
    apiToken: 'test-token',
    organizationId: 'test-org',
    userId: 'test-user',
    baseUrl: 'https://api.productive.io/api/v2',
  }),
}));

vi.mock('../utils/cache.js', () => ({
  getCache: vi.fn().mockReturnValue({
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    getAsync: vi.fn().mockResolvedValue(null),
    setAsync: vi.fn().mockResolvedValue(undefined),
    setOrgId: vi.fn(),
    invalidate: vi.fn().mockReturnValue(0),
    invalidateAsync: vi.fn().mockResolvedValue(0),
  }),
  CacheStore: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    getAsync: vi.fn().mockResolvedValue(null),
    setAsync: vi.fn().mockResolvedValue(undefined),
    setOrgId: vi.fn(),
    invalidate: vi.fn().mockReturnValue(0),
    invalidateAsync: vi.fn().mockResolvedValue(0),
  })),
}));

describe('createContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create context with default options', () => {
    const ctx = createContext({});

    expect(ctx.api).toBeDefined();
    expect(ctx.formatter).toBeDefined();
    expect(ctx.config).toBeDefined();
    expect(ctx.cache).toBeDefined();
    expect(ctx.options).toEqual({});
  });

  it('should pass format option to formatter', () => {
    const ctx = createContext({ format: 'json' });

    // Formatter should be created with json format
    expect(ctx.formatter).toBeInstanceOf(OutputFormatter);
  });

  it('should create spinner for human format', () => {
    const ctx = createContext({ format: 'human' });
    const spinner = ctx.createSpinner('Test message');

    expect(spinner).toBeDefined();
    expect(typeof spinner.start).toBe('function');
    expect(typeof spinner.succeed).toBe('function');
    expect(typeof spinner.fail).toBe('function');
  });

  it('should create no-op spinner for json format', () => {
    const ctx = createContext({ format: 'json' });
    const spinner = ctx.createSpinner('Test message');

    // Should return the same object (chainable no-op)
    expect(spinner.start()).toBe(spinner);
    expect(spinner.succeed()).toBe(spinner);
    expect(spinner.fail()).toBe(spinner);
  });

  describe('getPagination', () => {
    it('should return default pagination', () => {
      const ctx = createContext({});
      const { page, perPage } = ctx.getPagination();

      expect(page).toBe(1);
      expect(perPage).toBe(100);
    });

    it('should parse page option', () => {
      const ctx = createContext({ page: '3' });
      const { page } = ctx.getPagination();

      expect(page).toBe(3);
    });

    it('should parse p (short) option', () => {
      const ctx = createContext({ p: '5' });
      const { page } = ctx.getPagination();

      expect(page).toBe(5);
    });

    it('should parse size option', () => {
      const ctx = createContext({ size: '50' });
      const { perPage } = ctx.getPagination();

      expect(perPage).toBe(50);
    });

    it('should parse s (short) option', () => {
      const ctx = createContext({ s: '25' });
      const { perPage } = ctx.getPagination();

      expect(perPage).toBe(25);
    });
  });

  describe('getSort', () => {
    it('should return empty string by default', () => {
      const ctx = createContext({});
      expect(ctx.getSort()).toBe('');
    });

    it('should return sort option', () => {
      const ctx = createContext({ sort: '-created_at' });
      expect(ctx.getSort()).toBe('-created_at');
    });
  });
});

describe('createTestContext', () => {
  it('should create context with default test values', () => {
    const ctx = createTestContext();

    expect(ctx.config.apiToken).toBe('test-token');
    expect(ctx.config.organizationId).toBe('test-org');
    expect(ctx.config.userId).toBe('test-user');
  });

  it('should allow overriding config', () => {
    const ctx = createTestContext({
      config: {
        apiToken: 'custom-token',
        organizationId: 'custom-org',
        userId: 'custom-user',
        baseUrl: 'https://custom.api.io',
      },
    });

    expect(ctx.config.apiToken).toBe('custom-token');
    expect(ctx.config.organizationId).toBe('custom-org');
  });

  it('should allow overriding API', () => {
    const mockApi = {
      getProjects: vi.fn().mockResolvedValue({ data: [] }),
    };

    const ctx = createTestContext({
      api: mockApi as unknown as CommandContext['api'],
    });

    expect(ctx.api.getProjects).toBe(mockApi.getProjects);
  });

  it('should throw if mock API method not provided', () => {
    const ctx = createTestContext();

    expect(() => ctx.api.getProjects()).toThrow("Mock API method 'getProjects' was called but not provided");
  });

  it('should create no-op spinner', () => {
    const ctx = createTestContext();
    const spinner = ctx.createSpinner('Test');

    expect(spinner.start()).toBe(spinner);
    expect(spinner.succeed()).toBe(spinner);
    expect(spinner.fail()).toBe(spinner);
  });

  it('should return default pagination', () => {
    const ctx = createTestContext();
    const { page, perPage } = ctx.getPagination();

    expect(page).toBe(1);
    expect(perPage).toBe(100);
  });

  it('should allow overriding getPagination', () => {
    const ctx = createTestContext({
      getPagination: () => ({ page: 5, perPage: 50 }),
    });

    const { page, perPage } = ctx.getPagination();
    expect(page).toBe(5);
    expect(perPage).toBe(50);
  });

  it('should return empty sort by default', () => {
    const ctx = createTestContext();
    expect(ctx.getSort()).toBe('');
  });

  it('should use json format by default for tests', () => {
    const ctx = createTestContext();
    expect(ctx.options.format).toBe('json');
  });

  it('should disable colors by default for tests', () => {
    const ctx = createTestContext();
    expect(ctx.options['no-color']).toBe(true);
  });
});

describe('withContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should wrap handler with context creation', async () => {
    const handler = vi.fn().mockResolvedValue('result');
    const wrapped = withContext(handler);

    const result = await wrapped({ format: 'json' });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toHaveProperty('api');
    expect(handler.mock.calls[0][0]).toHaveProperty('formatter');
    expect(handler.mock.calls[0][0]).toHaveProperty('config');
    expect(result).toBe('result');
  });

  it('should pass options to context', async () => {
    const handler = vi.fn().mockImplementation((ctx: CommandContext) => {
      return ctx.options.sort;
    });
    const wrapped = withContext(handler);

    const result = await wrapped({ sort: '-name' });

    expect(result).toBe('-name');
  });

  it('should propagate errors from handler', async () => {
    const error = new Error('handler error');
    const handler = vi.fn().mockRejectedValue(error);
    const wrapped = withContext(handler);

    await expect(wrapped({})).rejects.toThrow('handler error');
  });
});

describe('Context usage patterns', () => {
  it('should support testing without vi.mock', async () => {
    // This demonstrates how to test without vi.mock
    const mockProjects = [
      { id: '1', attributes: { name: 'Project 1' } },
      { id: '2', attributes: { name: 'Project 2' } },
    ];

    const mockApi = {
      getProjects: vi.fn().mockResolvedValue({ data: mockProjects }),
    };

    const outputCapture: unknown[] = [];
    const mockFormatter = {
      output: vi.fn((data) => outputCapture.push(data)),
      error: vi.fn(),
      success: vi.fn(),
    };

    const ctx = createTestContext({
      api: mockApi as unknown as CommandContext['api'],
      formatter: mockFormatter as unknown as OutputFormatter,
    });

    // Simulate a command
    const response = await ctx.api.getProjects();
    ctx.formatter.output(response.data);

    expect(mockApi.getProjects).toHaveBeenCalled();
    expect(outputCapture[0]).toEqual(mockProjects);
  });

  it('should support different pagination for different tests', () => {
    const ctx1 = createTestContext({
      getPagination: () => ({ page: 1, perPage: 10 }),
    });

    const ctx2 = createTestContext({
      getPagination: () => ({ page: 2, perPage: 50 }),
    });

    expect(ctx1.getPagination()).toEqual({ page: 1, perPage: 10 });
    expect(ctx2.getPagination()).toEqual({ page: 2, perPage: 50 });
  });
});
