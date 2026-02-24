import { vol } from 'memfs';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { handleApiCommand } from './api.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

// Mock output and config
vi.mock('../output.js', () => ({
  OutputFormatter: vi.fn(function (format, noColor) {
    return {
      format,
      noColor,
      output: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      success: vi.fn(),
    };
  }),
  createSpinner: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    setText: vi.fn().mockReturnThis(),
  })),
}));

vi.mock('../config.js', () => ({
  getConfig: vi.fn(() => ({
    apiToken: 'test-token',
    organizationId: 'test-org-id',
    userId: 'test-user-id',
    baseUrl: 'https://api.productive.io/api/v2',
  })),
}));

describe('api command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });

    mockFetch.mockReset();
    vol.reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('endpoint validation', () => {
    it('should exit with error when endpoint is missing', async () => {
      await expect(handleApiCommand([], {})).rejects.toThrow('process.exit(3)');
      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should normalize endpoint to start with /', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await handleApiCommand(['projects'], {});

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/projects'),
        expect.any(Object),
      );
    });

    it('should accept endpoint starting with /', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await handleApiCommand(['/projects'], {});

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/projects'),
        expect.any(Object),
      );
    });
  });

  describe('HTTP methods', () => {
    it('should default to GET when no fields provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await handleApiCommand(['/projects'], {});

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should default to POST when fields provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await handleApiCommand(['/time_entries'], { field: ['time=480'] });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should use explicit method when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await handleApiCommand(['/projects/123'], { method: 'PATCH' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    it('should support DELETE method', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await handleApiCommand(['/time_entries/123'], { method: 'DELETE' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('should support PUT method', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await handleApiCommand(['/projects/123'], { method: 'PUT' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PUT' }),
      );
    });

    it('should support -X alias for method', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await handleApiCommand(['/projects/123'], { X: 'PATCH' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });

  describe('field parsing', () => {
    it('should parse string field values', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await handleApiCommand(['/test'], { field: ['name=test'] });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body).toEqual({ name: 'test' });
    });

    it('should parse boolean true', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await handleApiCommand(['/test'], { field: ['archived=true'] });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body).toEqual({ archived: true });
    });

    it('should parse boolean false', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await handleApiCommand(['/test'], { field: ['archived=false'] });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body).toEqual({ archived: false });
    });

    it('should parse null', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await handleApiCommand(['/test'], { field: ['value=null'] });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body).toEqual({ value: null });
    });

    it('should parse integers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await handleApiCommand(['/test'], { field: ['time=480'] });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body).toEqual({ time: 480 });
    });

    it('should parse negative integers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await handleApiCommand(['/test'], { field: ['value=-42'] });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body).toEqual({ value: -42 });
    });

    it('should parse floats', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await handleApiCommand(['/test'], { field: ['price=19.99'] });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body).toEqual({ price: 19.99 });
    });

    it('should parse multiple fields', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await handleApiCommand(['/test'], {
        field: ['name=test', 'time=480', 'archived=true'],
      });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body).toEqual({ name: 'test', time: 480, archived: true });
    });

    it('should support -F alias for field', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await handleApiCommand(['/test'], { F: ['time=480'] });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body).toEqual({ time: 480 });
    });
  });

  describe('raw field parsing', () => {
    it('should keep raw-field values as strings', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await handleApiCommand(['/test'], { 'raw-field': ['time=480'] });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body).toEqual({ time: '480' });
    });

    it('should not convert true to boolean', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await handleApiCommand(['/test'], { 'raw-field': ['archived=true'] });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body).toEqual({ archived: 'true' });
    });

    it('should support -f alias for raw-field', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await handleApiCommand(['/test'], { f: ['note=Development work'] });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body).toEqual({ note: 'Development work' });
    });

    it('should mix field and raw-field', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await handleApiCommand(['/test'], {
        field: ['time=480'],
        'raw-field': ['note=Work'],
      });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body).toEqual({ time: 480, note: 'Work' });
    });
  });

  describe('file input', () => {
    it('should read body from file', async () => {
      vol.fromJSON({
        '/tmp/body.json': JSON.stringify({
          data: { type: 'test', attributes: { name: 'value' } },
        }),
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await handleApiCommand(['/test'], {
        method: 'POST',
        input: '/tmp/body.json',
      });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body).toEqual({
        data: { type: 'test', attributes: { name: 'value' } },
      });
    });

    it('should convert fields to query params when using --input', async () => {
      vol.fromJSON({
        '/tmp/body.json': JSON.stringify({ data: {} }),
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await handleApiCommand(['/test'], {
        method: 'POST',
        input: '/tmp/body.json',
        field: ['page=2'],
      });

      const call = mockFetch.mock.calls[0];
      const url = call[0];
      expect(url).toContain('page=2');
    });

    it('should throw error for invalid JSON file', async () => {
      vol.fromJSON({
        '/tmp/invalid.json': 'not valid json',
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await expect(
        handleApiCommand(['/test'], {
          method: 'POST',
          input: '/tmp/invalid.json',
        }),
      ).rejects.toThrow();
    });
  });

  describe('query parameters', () => {
    it('should add fields as query params for explicit GET', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await handleApiCommand(['/projects'], {
        method: 'GET',
        field: ['filter[archived]=false'],
      });

      const call = mockFetch.mock.calls[0];
      const url = call[0];
      expect(url).toContain('filter%5Barchived%5D=false');
    });

    it('should handle multiple query params for explicit GET', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await handleApiCommand(['/projects'], {
        method: 'GET',
        field: ['page=2', 'size=50'],
      });

      const call = mockFetch.mock.calls[0];
      const url = call[0];
      expect(url).toContain('page=2');
      expect(url).toContain('size=50');
    });
  });

  describe('--filter flag', () => {
    it('should add single filter as query param', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await handleApiCommand(['/tasks'], { filter: ['project_id=123'] });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('filter%5Bproject_id%5D=123');
    });

    it('should add multiple filters as query params', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await handleApiCommand(['/tasks'], { filter: ['project_id=123', 'status=1'] });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('filter%5Bproject_id%5D=123');
      expect(url).toContain('filter%5Bstatus%5D=1');
    });

    it('should handle single filter string (not array)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await handleApiCommand(['/tasks'], { filter: 'project_id=123' });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('filter%5Bproject_id%5D=123');
    });

    it('should combine --filter with URL query params', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await handleApiCommand(['/tasks?sort=-created_at'], { filter: ['project_id=123'] });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('sort=-created_at');
      expect(url).toContain('filter%5Bproject_id%5D=123');
    });

    it('should throw error for filter with invalid format', async () => {
      await expect(handleApiCommand(['/tasks'], { filter: ['invalidformat'] })).rejects.toThrow();
    });

    it('should throw error for --filter with non-GET method', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await expect(
        handleApiCommand(['/tasks'], { method: 'POST', filter: ['project_id=123'] }),
      ).rejects.toThrow();
    });

    it('should combine --filter with --field on GET', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await handleApiCommand(['/tasks'], {
        method: 'GET',
        field: ['page=2'],
        filter: ['project_id=123'],
      });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('page=2');
      expect(url).toContain('filter%5Bproject_id%5D=123');
    });

    it('should error when --filter used with --field (implicit POST)', async () => {
      // --field triggers implicit POST, --filter is GET-only
      await expect(
        handleApiCommand(['/tasks'], {
          field: ['name=test'],
          filter: ['project_id=123'],
        }),
      ).rejects.toThrow('process.exit(3)');
    });

    it('should handle filter values containing equals signs', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await handleApiCommand(['/tasks'], { filter: ['custom_field=a=b'] });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('filter%5Bcustom_field%5D=a%3Db');
    });

    it('should throw error for --filter with POST', async () => {
      await expect(
        handleApiCommand(['/tasks'], { method: 'POST', filter: ['project_id=123'] }),
      ).rejects.toThrow('process.exit(3)');
    });

    it('should include filters when paginating', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{ id: '1' }],
            links: { next: 'https://api.productive.io/api/v2/tasks?page=2' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{ id: '2' }],
            links: {},
          }),
        });

      await handleApiCommand(['/tasks'], {
        paginate: true,
        filter: ['project_id=123'],
      });

      // First request should include filter
      const firstUrl = mockFetch.mock.calls[0][0];
      expect(firstUrl).toContain('filter%5Bproject_id%5D=123');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should merge filters with --input on GET', async () => {
      vol.fromJSON({
        '/tmp/body.json': JSON.stringify({ data: {} }),
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await handleApiCommand(['/tasks'], {
        method: 'GET',
        input: '/tmp/body.json',
        filter: ['project_id=123'],
      });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('filter%5Bproject_id%5D=123');
    });
  });

  describe('--include flag', () => {
    it('should add include query param', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await handleApiCommand(['/tasks'], { include: 'project,assignee' });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('include=project%2Cassignee');
    });

    it('should combine --include with --filter', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await handleApiCommand(['/tasks'], {
        filter: ['project_id=123'],
        include: 'project,assignee',
      });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('filter%5Bproject_id%5D=123');
      expect(url).toContain('include=project%2Cassignee');
    });

    it('should throw error for --include with non-GET method', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await expect(
        handleApiCommand(['/tasks'], { method: 'POST', include: 'project' }),
      ).rejects.toThrow();
    });

    it('should still show response headers when --include is boolean true', async () => {
      const mockHeaders = new Map([['content-type', 'application/json']]);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
        headers: {
          forEach: (callback: any) => {
            mockHeaders.forEach((value, key) => callback(value, key));
          },
        },
      });

      await handleApiCommand(['/projects'], { include: true });

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should not show response headers when --include has a string value', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await handleApiCommand(['/tasks'], { include: 'project' });

      // Response headers should NOT be logged (include is a string, not boolean)
      const headerCalls = consoleLogSpy.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('Response Headers'),
      );
      expect(headerCalls).toHaveLength(0);
    });

    it('should combine --include with URL query params', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await handleApiCommand(['/tasks?sort=-due_date'], { include: 'project' });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('sort=-due_date');
      expect(url).toContain('include=project');
    });

    it('should throw error for --include with PATCH', async () => {
      await expect(
        handleApiCommand(['/tasks/1'], { method: 'PATCH', include: 'project' }),
      ).rejects.toThrow('process.exit(3)');
    });

    it('should include include param when paginating', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{ id: '1' }],
            links: { next: 'https://api.productive.io/api/v2/tasks?page=2' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{ id: '2' }],
            links: {},
          }),
        });

      await handleApiCommand(['/tasks'], {
        paginate: true,
        include: 'project,assignee',
      });

      const firstUrl = mockFetch.mock.calls[0][0];
      expect(firstUrl).toContain('include=project%2Cassignee');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should merge include with --input on GET', async () => {
      vol.fromJSON({
        '/tmp/body.json': JSON.stringify({ data: {} }),
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await handleApiCommand(['/tasks'], {
        method: 'GET',
        input: '/tmp/body.json',
        include: 'project',
      });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('include=project');
    });
  });

  describe('custom headers', () => {
    it('should add custom headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await handleApiCommand(['/projects'], {
        header: ['X-Custom-Header: value'],
      });

      const call = mockFetch.mock.calls[0];
      const headers = call[1].headers;
      expect(headers['X-Custom-Header']).toBe('value');
    });

    it('should add multiple custom headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await handleApiCommand(['/projects'], {
        header: ['X-Header-1: value1', 'X-Header-2: value2'],
      });

      const call = mockFetch.mock.calls[0];
      const headers = call[1].headers;
      expect(headers['X-Header-1']).toBe('value1');
      expect(headers['X-Header-2']).toBe('value2');
    });

    it('should support -H alias for header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await handleApiCommand(['/projects'], {
        H: ['X-Custom: test'],
      });

      const call = mockFetch.mock.calls[0];
      const headers = call[1].headers;
      expect(headers['X-Custom']).toBe('test');
    });

    it('should throw error for invalid header format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await expect(
        handleApiCommand(['/projects'], { header: ['InvalidHeader'] }),
      ).rejects.toThrow();
    });
  });

  describe('pagination', () => {
    it('should fetch single page by default', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ id: '1' }],
          links: { next: 'https://api.productive.io/api/v2/projects?page=2' },
        }),
      });

      await handleApiCommand(['/projects'], {});

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should fetch all pages with --paginate', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{ id: '1' }],
            links: { next: 'https://api.productive.io/api/v2/projects?page=2' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{ id: '2' }],
            links: { next: null },
          }),
        });

      await handleApiCommand(['/projects'], { paginate: true });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should accumulate data from all pages', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{ id: '1' }],
            links: { next: 'https://api.productive.io/api/v2/projects?page=2' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{ id: '2' }],
            links: {},
          }),
        });

      await handleApiCommand(['/projects'], { paginate: true });

      // Check that spinner was called with success message about 2 items
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should throw error when paginating non-GET requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await expect(
        handleApiCommand(['/projects'], { method: 'POST', paginate: true }),
      ).rejects.toThrow();
    });

    it('should not duplicate query params on subsequent pages', async () => {
      const nextUrl =
        'https://api.productive.io/api/v2/tasks?filter%5Bproject_id%5D=123&page%5Bnumber%5D=2';

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{ id: '1' }],
            links: { next: nextUrl },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{ id: '2' }],
            links: {},
          }),
        });

      await handleApiCommand(['/tasks'], {
        paginate: true,
        filter: ['project_id=123'],
      });

      // Page 1: query params appended
      const page1Url = mockFetch.mock.calls[0][0];
      expect(page1Url).toContain('filter%5Bproject_id%5D=123');

      // Page 2: uses nextLink as-is, no duplicate params
      const page2Url = mockFetch.mock.calls[1][0];
      const occurrences = page2Url.split('filter%5Bproject_id%5D=123').length - 1;
      expect(occurrences).toBe(1);
    });

    it('should not duplicate query params from --field on subsequent pages', async () => {
      const nextUrl =
        'https://api.productive.io/api/v2/tasks?filter%5Barchived%5D=false&page%5Bnumber%5D=2';

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{ id: '1' }],
            links: { next: nextUrl },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{ id: '2' }],
            links: {},
          }),
        });

      await handleApiCommand(['/tasks'], {
        method: 'GET',
        paginate: true,
        field: ['filter[archived]=false'],
      });

      // Page 2: should not duplicate the field param
      const page2Url = mockFetch.mock.calls[1][0];
      const occurrences = page2Url.split('filter%5Barchived%5D=false').length - 1;
      expect(occurrences).toBe(1);
    });
  });

  describe('authentication', () => {
    it('should include auth headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await handleApiCommand(['/projects'], {});

      const call = mockFetch.mock.calls[0];
      const headers = call[1].headers;
      expect(headers['X-Auth-Token']).toBe('test-token');
      expect(headers['X-Organization-Id']).toBe('test-org-id');
    });

    it('should include Content-Type header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await handleApiCommand(['/projects'], {});

      const call = mockFetch.mock.calls[0];
      const headers = call[1].headers;
      expect(headers['Content-Type']).toBe('application/vnd.api+json');
    });
  });

  describe('error handling', () => {
    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => JSON.stringify({ errors: [{ detail: 'Invalid token' }] }),
      });

      // 401 errors exit with code 2 (authentication error)
      await expect(handleApiCommand(['/projects'], {})).rejects.toThrow('process.exit(2)');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(handleApiCommand(['/projects'], {})).rejects.toThrow();
    });

    it('should handle invalid field format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await expect(handleApiCommand(['/test'], { field: ['invalidformat'] })).rejects.toThrow();
    });
  });

  describe('output formats', () => {
    it('should default to json format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await handleApiCommand(['/projects'], {});

      // Default format is json for api command
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should support human format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await handleApiCommand(['/projects'], { format: 'human' });

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should include response headers with --include', async () => {
      const mockHeaders = new Map([
        ['content-type', 'application/json'],
        ['x-rate-limit', '100'],
      ]);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
        headers: {
          forEach: (callback: any) => {
            mockHeaders.forEach((value, key) => callback(value, key));
          },
        },
      });

      await handleApiCommand(['/projects'], { include: true });

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });
});
