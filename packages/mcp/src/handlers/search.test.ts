/**
 * Tests for cross-resource search handler
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { ProductiveCredentials } from '../auth.js';
import type { ToolResult } from './types.js';

import { handleSearch, SEARCHABLE_RESOURCES, type ExecuteFunction } from './search.js';

/**
 * Helper to create a mock successful response
 */
function createMockResponse(items: unknown[]): ToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ items, total_count: items.length }),
      },
    ],
  };
}

/**
 * Helper to parse result JSON
 */
function parseResult(result: ToolResult): Record<string, unknown> {
  const textContent = result.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in result');
  }
  return JSON.parse(textContent.text);
}

describe('handleSearch', () => {
  const mockCredentials: ProductiveCredentials = {
    organizationId: 'test-org',
    apiToken: 'test-token',
    userId: 'test-user',
  };

  let mockExecute: ReturnType<
    typeof vi.fn<Parameters<ExecuteFunction>, ReturnType<ExecuteFunction>>
  >;

  beforeEach(() => {
    mockExecute = vi.fn();
  });

  describe('valid search', () => {
    it('returns grouped results with correct structure', async () => {
      mockExecute
        .mockResolvedValueOnce(createMockResponse([{ id: '1', name: 'Project A' }]))
        .mockResolvedValueOnce(createMockResponse([{ id: '2', name: 'Company B' }]))
        .mockResolvedValueOnce(createMockResponse([]))
        .mockResolvedValueOnce(createMockResponse([{ id: '3', name: 'Task C' }]));

      const result = await handleSearch('Studio Meta', undefined, mockCredentials, mockExecute);

      expect(result.isError).toBeUndefined();
      const parsed = parseResult(result);

      expect(parsed.query).toBe('Studio Meta');
      expect(parsed.resources_searched).toEqual(['projects', 'companies', 'people', 'tasks']);
      expect(parsed.results).toHaveProperty('projects');
      expect(parsed.results).toHaveProperty('companies');
      expect(parsed.results).toHaveProperty('people');
      expect(parsed.results).toHaveProperty('tasks');
      expect(parsed.total_results).toBe(3);
    });

    it('uses default resources when not specified', async () => {
      mockExecute.mockResolvedValue(createMockResponse([]));

      await handleSearch('test', undefined, mockCredentials, mockExecute);

      expect(mockExecute).toHaveBeenCalledTimes(4);
      const calledResources = mockExecute.mock.calls.map((call) => call[1].resource);
      expect(calledResources).toEqual(['projects', 'companies', 'people', 'tasks']);
    });

    it('supports custom resources subset', async () => {
      mockExecute
        .mockResolvedValueOnce(createMockResponse([{ id: '1' }]))
        .mockResolvedValueOnce(createMockResponse([{ id: '2' }]));

      const result = await handleSearch(
        'test',
        ['projects', 'deals'],
        mockCredentials,
        mockExecute,
      );

      expect(result.isError).toBeUndefined();
      expect(mockExecute).toHaveBeenCalledTimes(2);

      const parsed = parseResult(result);
      expect(parsed.resources_searched).toEqual(['projects', 'deals']);
      expect(parsed.results).toHaveProperty('projects');
      expect(parsed.results).toHaveProperty('deals');
    });

    it('calls execute with correct args per resource', async () => {
      mockExecute.mockResolvedValue(createMockResponse([]));

      await handleSearch('Studio Meta', ['projects', 'companies'], mockCredentials, mockExecute);

      expect(mockExecute).toHaveBeenCalledWith(
        'productive',
        {
          resource: 'projects',
          action: 'list',
          query: 'Studio Meta',
          compact: true,
          per_page: 10,
        },
        mockCredentials,
      );

      expect(mockExecute).toHaveBeenCalledWith(
        'productive',
        {
          resource: 'companies',
          action: 'list',
          query: 'Studio Meta',
          compact: true,
          per_page: 10,
        },
        mockCredentials,
      );
    });

    it('correctly sums total_results from array result lengths', async () => {
      mockExecute
        .mockResolvedValueOnce(createMockResponse([{ id: '1' }, { id: '2' }, { id: '3' }]))
        .mockResolvedValueOnce(createMockResponse([{ id: '4' }, { id: '5' }]))
        .mockResolvedValueOnce(createMockResponse([]))
        .mockResolvedValueOnce(createMockResponse([{ id: '6' }]));

      const result = await handleSearch('test', undefined, mockCredentials, mockExecute);
      const parsed = parseResult(result);

      expect(parsed.total_results).toBe(6);
    });

    it('trims whitespace from query', async () => {
      mockExecute.mockResolvedValue(createMockResponse([]));

      await handleSearch('  Studio Meta  ', ['projects'], mockCredentials, mockExecute);

      expect(mockExecute).toHaveBeenCalledWith(
        'productive',
        expect.objectContaining({ query: 'Studio Meta' }),
        mockCredentials,
      );
    });
  });

  describe('error handling', () => {
    it('returns error for empty query', async () => {
      const result = await handleSearch('', undefined, mockCredentials, mockExecute);

      expect(result.isError).toBe(true);
      const textContent = result.content.find((c) => c.type === 'text');
      expect(textContent?.type === 'text' && textContent.text).toContain('query');
      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('returns error for missing query', async () => {
      const result = await handleSearch(undefined, undefined, mockCredentials, mockExecute);

      expect(result.isError).toBe(true);
      const textContent = result.content.find((c) => c.type === 'text');
      expect(textContent?.type === 'text' && textContent.text).toContain('query');
      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('returns error for whitespace-only query', async () => {
      const result = await handleSearch('   ', undefined, mockCredentials, mockExecute);

      expect(result.isError).toBe(true);
      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('returns error for invalid resource name', async () => {
      const result = await handleSearch(
        'test',
        ['projects', 'invalid_resource', 'companies'],
        mockCredentials,
        mockExecute,
      );

      expect(result.isError).toBe(true);
      const textContent = result.content.find((c) => c.type === 'text');
      expect(textContent?.type === 'text' && textContent.text).toContain('invalid_resource');
      expect(textContent?.type === 'text' && textContent.text).toContain(
        SEARCHABLE_RESOURCES.join(', '),
      );
      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('returns error listing all invalid resources', async () => {
      const result = await handleSearch(
        'test',
        ['invalid1', 'invalid2'],
        mockCredentials,
        mockExecute,
      );

      expect(result.isError).toBe(true);
      const textContent = result.content.find((c) => c.type === 'text');
      expect(textContent?.type === 'text' && textContent.text).toContain('invalid1');
      expect(textContent?.type === 'text' && textContent.text).toContain('invalid2');
    });

    it('captures per-resource error without aborting others', async () => {
      mockExecute
        .mockResolvedValueOnce(createMockResponse([{ id: '1', name: 'Project A' }]))
        .mockRejectedValueOnce(new Error('API rate limited'))
        .mockResolvedValueOnce(createMockResponse([{ id: '2', name: 'Person B' }]))
        .mockResolvedValueOnce(createMockResponse([{ id: '3', name: 'Task C' }]));

      const result = await handleSearch('test', undefined, mockCredentials, mockExecute);

      expect(result.isError).toBeUndefined();
      const parsed = parseResult(result);

      // Projects succeeded
      expect(Array.isArray(parsed.results.projects)).toBe(true);
      expect((parsed.results.projects as unknown[]).length).toBe(1);

      // Companies failed with captured error
      expect(parsed.results.companies).toHaveProperty('error');
      expect((parsed.results.companies as { error: string }).error).toContain('API rate limited');

      // People and tasks succeeded
      expect(Array.isArray(parsed.results.people)).toBe(true);
      expect(Array.isArray(parsed.results.tasks)).toBe(true);

      // Total only counts successful results
      expect(parsed.total_results).toBe(3);
    });

    it('captures error when response has no content', async () => {
      mockExecute.mockResolvedValueOnce({ content: [] });

      const result = await handleSearch('test', ['projects'], mockCredentials, mockExecute);

      expect(result.isError).toBeUndefined();
      const parsed = parseResult(result);
      expect(parsed.results.projects).toHaveProperty('error');
    });

    it('captures error when response JSON is invalid', async () => {
      mockExecute.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'not valid json' }],
      });

      const result = await handleSearch('test', ['projects'], mockCredentials, mockExecute);

      expect(result.isError).toBeUndefined();
      const parsed = parseResult(result);
      expect(parsed.results.projects).toHaveProperty('error');
      expect((parsed.results.projects as { error: string }).error).toContain('parse');
    });
  });

  describe('SEARCHABLE_RESOURCES constant', () => {
    it('contains the expected resources', () => {
      expect(SEARCHABLE_RESOURCES).toContain('projects');
      expect(SEARCHABLE_RESOURCES).toContain('companies');
      expect(SEARCHABLE_RESOURCES).toContain('people');
      expect(SEARCHABLE_RESOURCES).toContain('tasks');
      expect(SEARCHABLE_RESOURCES).toContain('deals');
      expect(SEARCHABLE_RESOURCES.length).toBe(5);
    });
  });
});
