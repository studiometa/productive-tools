import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProductiveApi, ProductiveApiError } from '../api.js';
import { setConfig, clearConfig } from '../config.js';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { existsSync, rmSync } from 'node:fs';

describe('ProductiveApi', () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // Use temporary directory for testing
    const tempDir = join(tmpdir(), 'productive-cli-test-' + Date.now());
    process.env.XDG_CONFIG_HOME = tempDir;
    
    // Set up test configuration
    setConfig('apiToken', 'test-token');
    setConfig('organizationId', 'test-org-id');
    
    // Mock fetch
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    // Restore environment
    process.env = { ...originalEnv };
    globalThis.fetch = originalFetch;
    
    // Clean up test config
    if (process.env.XDG_CONFIG_HOME && existsSync(process.env.XDG_CONFIG_HOME)) {
      rmSync(process.env.XDG_CONFIG_HOME, { recursive: true, force: true });
    }
  });

  it('should throw error if apiToken not configured', () => {
    clearConfig();
    delete process.env.PRODUCTIVE_API_TOKEN;
    delete process.env.PRODUCTIVE_ORG_ID;
    expect(() => new ProductiveApi()).toThrow('API token not configured');
  });

  it('should throw error if organizationId not configured', () => {
    clearConfig();
    delete process.env.PRODUCTIVE_API_TOKEN;
    delete process.env.PRODUCTIVE_ORG_ID;
    setConfig('apiToken', 'test-token');
    expect(() => new ProductiveApi()).toThrow('Organization ID not configured');
  });

  it('should create API instance with config', () => {
    const api = new ProductiveApi();
    expect(api).toBeDefined();
  });

  it('should fetch projects', async () => {
    const mockResponse = {
      data: [
        {
          id: '1',
          type: 'projects',
          attributes: {
            name: 'Test Project',
            project_number: 'PRJ-001',
            archived: false,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        },
      ],
      meta: { page: 1, per_page: 100, total: 1 },
    };

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const api = new ProductiveApi();
    const result = await api.getProjects();

    expect(result.data).toHaveLength(1);
    expect(result.data[0].attributes.name).toBe('Test Project');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Auth-Token': 'test-token',
          'X-Organization-Id': 'test-org-id',
        }),
      })
    );
  });

  it('should fetch single project', async () => {
    const mockResponse = {
      data: {
        id: '1',
        type: 'projects',
        attributes: {
          name: 'Test Project',
          project_number: 'PRJ-001',
          archived: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      },
    };

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const api = new ProductiveApi();
    const result = await api.getProject('1');

    expect(result.data.id).toBe('1');
    expect(result.data.attributes.name).toBe('Test Project');
  });

  it('should handle API errors', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => JSON.stringify({ errors: [{ detail: 'Invalid token' }] }),
    });

    const api = new ProductiveApi();
    
    await expect(api.getProjects()).rejects.toThrow('Invalid token');
  });

  it('should handle non-JSON error responses', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'Server error',
    });

    const api = new ProductiveApi();
    
    await expect(api.getProjects()).rejects.toThrow('500 Internal Server Error');
  });

  it('should create time entry', async () => {
    const mockResponse = {
      data: {
        id: '1',
        type: 'time_entries',
        attributes: {
          date: '2024-01-16',
          time: 480,
          note: 'Test work',
          created_at: '2024-01-16T00:00:00Z',
          updated_at: '2024-01-16T00:00:00Z',
        },
      },
    };

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const api = new ProductiveApi();
    const result = await api.createTimeEntry({
      person_id: 'person-1',
      service_id: 'service-1',
      date: '2024-01-16',
      time: 480,
      note: 'Test work',
    });

    expect(result.data.attributes.time).toBe(480);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/time_entries'),
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('should update time entry', async () => {
    const mockResponse = {
      data: {
        id: '1',
        type: 'time_entries',
        attributes: {
          date: '2024-01-16',
          time: 360,
          note: 'Updated work',
          created_at: '2024-01-16T00:00:00Z',
          updated_at: '2024-01-16T00:00:00Z',
        },
      },
    };

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const api = new ProductiveApi();
    const result = await api.updateTimeEntry('1', {
      time: 360,
      note: 'Updated work',
    });

    expect(result.data.attributes.time).toBe(360);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/time_entries/1'),
      expect.objectContaining({
        method: 'PATCH',
      })
    );
  });

  it('should delete time entry', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const api = new ProductiveApi();
    await api.deleteTimeEntry('1');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/time_entries/1'),
      expect.objectContaining({
        method: 'DELETE',
      })
    );
  });

  it('should handle pagination parameters', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [], meta: {} }),
    });

    const api = new ProductiveApi();
    await api.getProjects({
      page: 2,
      perPage: 50,
    });

    const callUrl = (globalThis.fetch as any).mock.calls[0][0];
    expect(callUrl).toContain('page%5Bnumber%5D=2'); // URL encoded [number]
    expect(callUrl).toContain('page%5Bsize%5D=50'); // URL encoded [size]
  });

  it('should handle filter parameters', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [], meta: {} }),
    });

    const api = new ProductiveApi();
    await api.getProjects({
      filter: { archived: 'false' },
    });

    const callUrl = (globalThis.fetch as any).mock.calls[0][0];
    expect(callUrl).toContain('filter%5Barchived%5D=false'); // URL encoded [archived]
  });

  it('should handle sort parameter', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [], meta: {} }),
    });

    const api = new ProductiveApi();
    await api.getProjects({
      sort: 'name',
    });

    const callUrl = (globalThis.fetch as any).mock.calls[0][0];
    expect(callUrl).toContain('sort=name');
  });
});

describe('ProductiveApiError', () => {
  it('should create error with message', () => {
    const error = new ProductiveApiError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('ProductiveApiError');
  });

  it('should create error with status code', () => {
    const error = new ProductiveApiError('Test error', 404);
    expect(error.statusCode).toBe(404);
  });

  it('should create error with response', () => {
    const response = { errors: [{ detail: 'Not found' }] };
    const error = new ProductiveApiError('Test error', 404, response);
    expect(error.response).toEqual(response);
  });

  it('should serialize to JSON', () => {
    const error = new ProductiveApiError('Test error', 404, { detail: 'Not found' });
    const json = error.toJSON();
    
    expect(json).toEqual({
      error: 'ProductiveApiError',
      message: 'Test error',
      statusCode: 404,
      response: { detail: 'Not found' },
    });
  });
});
