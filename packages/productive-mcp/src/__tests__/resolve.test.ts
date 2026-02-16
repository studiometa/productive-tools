import type { ProductiveApi } from '@studiometa/productive-cli';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { HandlerContext } from '../handlers/types.js';

import {
  detectResourceType,
  isNumericId,
  resolve,
  resolveFilters,
  handleResolve,
} from '../handlers/resolve.js';

describe('resolve handler', () => {
  describe('detectResourceType', () => {
    it('detects email as person', () => {
      expect(detectResourceType('user@example.com')).toBe('person');
    });

    it('detects project number (PRJ-*)', () => {
      expect(detectResourceType('PRJ-123')).toBe('project');
    });

    it('detects project number (P-*)', () => {
      expect(detectResourceType('P-456')).toBe('project');
    });

    it('detects deal number (D-*)', () => {
      expect(detectResourceType('D-789')).toBe('deal');
    });

    it('detects deal number (DEAL-*)', () => {
      expect(detectResourceType('DEAL-001')).toBe('deal');
    });

    it('returns null for numeric IDs', () => {
      expect(detectResourceType('123456')).toBeNull();
    });

    it('returns null for ambiguous strings', () => {
      expect(detectResourceType('John Doe')).toBeNull();
    });
  });

  describe('isNumericId', () => {
    it('returns true for numeric strings', () => {
      expect(isNumericId('123')).toBe(true);
      expect(isNumericId('0')).toBe(true);
    });

    it('returns false for non-numeric strings', () => {
      expect(isNumericId('abc')).toBe(false);
      expect(isNumericId('user@example.com')).toBe(false);
    });
  });

  describe('resolve', () => {
    let mockApi: {
      getPeople: ReturnType<typeof vi.fn>;
      getProjects: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mockApi = {
        getPeople: vi.fn(),
        getProjects: vi.fn(),
      };
    });

    it('returns numeric IDs as-is', async () => {
      const results = await resolve(mockApi as unknown as ProductiveApi, '123456');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('123456');
      expect(results[0].exact).toBe(true);
    });

    it('resolves person by email', async () => {
      mockApi.getPeople.mockResolvedValue({
        data: [
          {
            id: '500521',
            attributes: {
              first_name: 'John',
              last_name: 'Doe',
            },
          },
        ],
      });

      const results = await resolve(mockApi as unknown as ProductiveApi, 'john@example.com');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('500521');
      expect(results[0].type).toBe('person');
      expect(results[0].label).toBe('John Doe');
      expect(results[0].exact).toBe(true);
    });

    it('throws when no matches found', async () => {
      mockApi.getPeople.mockResolvedValue({ data: [] });

      await expect(
        resolve(mockApi as unknown as ProductiveApi, 'unknown@example.com'),
      ).rejects.toThrow(/No person found/);
    });

    it('throws when type cannot be determined', async () => {
      await expect(resolve(mockApi as unknown as ProductiveApi, 'ambiguous')).rejects.toThrow(
        /Cannot determine resource type/,
      );
    });
  });

  describe('resolveFilters', () => {
    let mockApi: {
      getPeople: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mockApi = {
        getPeople: vi.fn(),
      };
    });

    it('keeps numeric IDs unchanged', async () => {
      const { resolved, metadata } = await resolveFilters(mockApi as unknown as ProductiveApi, {
        person_id: '123456',
      });

      expect(resolved.person_id).toBe('123456');
      expect(Object.keys(metadata)).toHaveLength(0);
    });

    it('resolves email to person ID', async () => {
      mockApi.getPeople.mockResolvedValue({
        data: [
          {
            id: '500521',
            attributes: { first_name: 'John', last_name: 'Doe' },
          },
        ],
      });

      const { resolved, metadata } = await resolveFilters(mockApi as unknown as ProductiveApi, {
        person_id: 'john@example.com',
      });

      expect(resolved.person_id).toBe('500521');
      expect(metadata.person_id).toEqual({
        input: 'john@example.com',
        id: '500521',
        label: 'John Doe',
        reusable: true,
      });
    });
  });

  describe('handleResolve', () => {
    let mockApi: {
      getPeople: ReturnType<typeof vi.fn>;
    };

    let mockCtx: HandlerContext;

    beforeEach(() => {
      mockApi = {
        getPeople: vi.fn(),
      };

      mockCtx = {
        api: mockApi as unknown as ProductiveApi,
        formatOptions: { compact: false },
        perPage: 20,
      };
    });

    it('returns error when query is missing', async () => {
      const result = await handleResolve({}, mockCtx);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('query is required');
    });

    it('returns matches for valid query', async () => {
      mockApi.getPeople.mockResolvedValue({
        data: [
          {
            id: '500521',
            attributes: { first_name: 'John', last_name: 'Doe' },
          },
        ],
      });

      const result = await handleResolve({ query: 'john@example.com' }, mockCtx);

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text as string);
      expect(content.query).toBe('john@example.com');
      expect(content.matches).toHaveLength(1);
      expect(content.matches[0].id).toBe('500521');
    });
  });
});
