import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { ProductiveApi } from '../../api.js';

import {
  detectResourceType,
  isNumericId,
  needsResolution,
  resolve,
  resolveFilterValue,
  resolveFilterIds,
  ResolveError,
  type ResolvableResourceType,
} from '../resource-resolver.js';

describe('resource-resolver', () => {
  describe('detectResourceType', () => {
    it('detects email addresses as person', () => {
      const result = detectResourceType('user@example.com');
      expect(result).toEqual({
        type: 'person',
        confidence: 'high',
        pattern: 'email',
      });
    });

    it('detects project numbers (PRJ-*)', () => {
      const result = detectResourceType('PRJ-123');
      expect(result).toEqual({
        type: 'project',
        confidence: 'high',
        pattern: 'project_number',
      });
    });

    it('detects project numbers (P-*)', () => {
      const result = detectResourceType('P-456');
      expect(result).toEqual({
        type: 'project',
        confidence: 'high',
        pattern: 'project_number',
      });
    });

    it('is case-insensitive for project numbers', () => {
      expect(detectResourceType('prj-123')?.type).toBe('project');
      expect(detectResourceType('Prj-123')?.type).toBe('project');
    });

    it('detects deal numbers (D-*)', () => {
      const result = detectResourceType('D-789');
      expect(result).toEqual({
        type: 'deal',
        confidence: 'high',
        pattern: 'deal_number',
      });
    });

    it('detects deal numbers (DEAL-*)', () => {
      const result = detectResourceType('DEAL-001');
      expect(result).toEqual({
        type: 'deal',
        confidence: 'high',
        pattern: 'deal_number',
      });
    });

    it('returns null for numeric IDs', () => {
      expect(detectResourceType('123456')).toBeNull();
      expect(detectResourceType('1')).toBeNull();
    });

    it('returns null for ambiguous strings', () => {
      expect(detectResourceType('John Doe')).toBeNull();
      expect(detectResourceType('Client Project')).toBeNull();
      expect(detectResourceType('Development')).toBeNull();
    });
  });

  describe('isNumericId', () => {
    it('returns true for numeric strings', () => {
      expect(isNumericId('123')).toBe(true);
      expect(isNumericId('0')).toBe(true);
      expect(isNumericId('999999999')).toBe(true);
    });

    it('returns false for non-numeric strings', () => {
      expect(isNumericId('abc')).toBe(false);
      expect(isNumericId('123abc')).toBe(false);
      expect(isNumericId('user@example.com')).toBe(false);
      expect(isNumericId('PRJ-123')).toBe(false);
      expect(isNumericId('')).toBe(false);
    });
  });

  describe('needsResolution', () => {
    it('returns false for numeric IDs', () => {
      expect(needsResolution('123')).toBe(false);
      expect(needsResolution('500521')).toBe(false);
    });

    it('returns true for non-numeric values', () => {
      expect(needsResolution('user@example.com')).toBe(true);
      expect(needsResolution('PRJ-123')).toBe(true);
      expect(needsResolution('John')).toBe(true);
    });
  });

  describe('resolve', () => {
    let mockApi: {
      getPeople: ReturnType<typeof vi.fn>;
      getProjects: ReturnType<typeof vi.fn>;
      getCompanies: ReturnType<typeof vi.fn>;
      getDeals: ReturnType<typeof vi.fn>;
      getServices: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mockApi = {
        getPeople: vi.fn(),
        getProjects: vi.fn(),
        getCompanies: vi.fn(),
        getDeals: vi.fn(),
        getServices: vi.fn(),
      };
    });

    it('returns numeric IDs as-is without API calls', async () => {
      const results = await resolve(mockApi as unknown as ProductiveApi, '123456');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('123456');
      expect(results[0].exact).toBe(true);
      expect(mockApi.getPeople).not.toHaveBeenCalled();
      expect(mockApi.getProjects).not.toHaveBeenCalled();
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
      expect(results[0]).toEqual({
        id: '500521',
        type: 'person',
        label: 'John Doe',
        query: 'john@example.com',
        exact: true,
      });
      expect(mockApi.getPeople).toHaveBeenCalledWith({
        filter: { email: 'john@example.com' },
        perPage: 1,
      });
    });

    it('resolves project by number', async () => {
      mockApi.getProjects.mockResolvedValue({
        data: [
          {
            id: '777332',
            attributes: {
              name: 'Client Website',
            },
          },
        ],
      });

      const results = await resolve(mockApi as unknown as ProductiveApi, 'PRJ-123');

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        id: '777332',
        type: 'project',
        label: 'Client Website',
        query: 'PRJ-123',
        exact: true,
      });
    });

    it('searches company by name when type is specified', async () => {
      mockApi.getCompanies.mockResolvedValue({
        data: [
          { id: '1', attributes: { name: 'Studio Meta' } },
          { id: '2', attributes: { name: 'Meta Corp' } },
        ],
      });

      const results = await resolve(mockApi as unknown as ProductiveApi, 'Meta', {
        type: 'company',
      });

      expect(results).toHaveLength(2);
      expect(results[0].label).toBe('Studio Meta');
      expect(results[1].label).toBe('Meta Corp');
    });

    it('returns first match when option is set', async () => {
      mockApi.getCompanies.mockResolvedValue({
        data: [
          { id: '1', attributes: { name: 'Studio Meta' } },
          { id: '2', attributes: { name: 'Meta Corp' } },
        ],
      });

      const results = await resolve(mockApi as unknown as ProductiveApi, 'Meta', {
        type: 'company',
        first: true,
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('throws ResolveError when no matches found', async () => {
      mockApi.getPeople.mockResolvedValue({ data: [] });

      await expect(
        resolve(mockApi as unknown as ProductiveApi, 'unknown@example.com'),
      ).rejects.toThrow(ResolveError);
    });

    it('throws ResolveError when type cannot be determined', async () => {
      await expect(
        resolve(mockApi as unknown as ProductiveApi, 'ambiguous string'),
      ).rejects.toThrow(/Cannot determine resource type/);
    });
  });

  describe('resolveFilterValue', () => {
    let mockApi: {
      getPeople: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mockApi = {
        getPeople: vi.fn(),
      };
    });

    it('returns numeric IDs as-is', async () => {
      const id = await resolveFilterValue(mockApi as unknown as ProductiveApi, '123456', 'person');
      expect(id).toBe('123456');
      expect(mockApi.getPeople).not.toHaveBeenCalled();
    });

    it('resolves and returns the ID', async () => {
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

      const id = await resolveFilterValue(
        mockApi as unknown as ProductiveApi,
        'john@example.com',
        'person',
      );
      expect(id).toBe('500521');
    });
  });

  describe('resolveFilterIds', () => {
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

    it('resolves multiple filter values', async () => {
      mockApi.getPeople.mockResolvedValue({
        data: [
          {
            id: '500521',
            attributes: { first_name: 'John', last_name: 'Doe' },
          },
        ],
      });
      mockApi.getProjects.mockResolvedValue({
        data: [
          {
            id: '777332',
            attributes: { name: 'Client Website' },
          },
        ],
      });

      const filters = {
        assignee_id: 'john@example.com',
        project_id: 'PRJ-123',
        other_filter: 'keep-as-is',
      };

      const typeMapping: Record<string, ResolvableResourceType> = {
        assignee_id: 'person',
        project_id: 'project',
      };

      const { resolved, metadata } = await resolveFilterIds(
        mockApi as unknown as ProductiveApi,
        filters,
        typeMapping,
      );

      expect(resolved).toEqual({
        assignee_id: '500521',
        project_id: '777332',
        other_filter: 'keep-as-is',
      });

      expect(metadata.assignee_id).toEqual({
        input: 'john@example.com',
        id: '500521',
        label: 'John Doe',
        reusable: true,
      });

      expect(metadata.project_id).toEqual({
        input: 'PRJ-123',
        id: '777332',
        label: 'Client Website',
        reusable: true,
      });

      expect(metadata.other_filter).toBeUndefined();
    });

    it('keeps numeric IDs unchanged', async () => {
      const filters = {
        assignee_id: '500521',
        project_id: '777332',
      };

      const typeMapping: Record<string, ResolvableResourceType> = {
        assignee_id: 'person',
        project_id: 'project',
      };

      const { resolved, metadata } = await resolveFilterIds(
        mockApi as unknown as ProductiveApi,
        filters,
        typeMapping,
      );

      expect(resolved).toEqual(filters);
      expect(Object.keys(metadata)).toHaveLength(0);
      expect(mockApi.getPeople).not.toHaveBeenCalled();
      expect(mockApi.getProjects).not.toHaveBeenCalled();
    });

    it('keeps original value on resolution error', async () => {
      mockApi.getPeople.mockResolvedValue({ data: [] });

      const filters = {
        assignee_id: 'nonexistent@example.com',
      };

      const typeMapping: Record<string, ResolvableResourceType> = {
        assignee_id: 'person',
      };

      const { resolved } = await resolveFilterIds(
        mockApi as unknown as ProductiveApi,
        filters,
        typeMapping,
      );

      expect(resolved.assignee_id).toBe('nonexistent@example.com');
    });
  });

  describe('ResolveError', () => {
    it('serializes to JSON correctly', () => {
      const error = new ResolveError('No person found', 'unknown@example.com', 'person', [
        { id: '1', type: 'person', label: 'John Doe', query: 'unknown', exact: false },
      ]);

      expect(error.toJSON()).toEqual({
        error: 'ResolveError',
        message: 'No person found',
        query: 'unknown@example.com',
        type: 'person',
        suggestions: [
          { id: '1', type: 'person', label: 'John Doe', query: 'unknown', exact: false },
        ],
      });
    });

    it('serializes without suggestions', () => {
      const error = new ResolveError('No person found', 'unknown@example.com', 'person');

      expect(error.toJSON().suggestions).toBeUndefined();
    });
  });

  describe('resolve - additional cases', () => {
    let mockApi: {
      getPeople: ReturnType<typeof vi.fn>;
      getProjects: ReturnType<typeof vi.fn>;
      getCompanies: ReturnType<typeof vi.fn>;
      getDeals: ReturnType<typeof vi.fn>;
      getServices: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mockApi = {
        getPeople: vi.fn(),
        getProjects: vi.fn(),
        getCompanies: vi.fn(),
        getDeals: vi.fn(),
        getServices: vi.fn(),
      };
    });

    it('resolves person by name search when type is explicit', async () => {
      mockApi.getPeople.mockResolvedValue({
        data: [
          { id: '1', attributes: { first_name: 'John', last_name: 'Doe' } },
          { id: '2', attributes: { first_name: 'John', last_name: 'Smith' } },
        ],
      });

      const results = await resolve(mockApi as unknown as ProductiveApi, 'John', {
        type: 'person',
      });

      expect(results).toHaveLength(2);
      expect(results[0].exact).toBe(false);
      expect(mockApi.getPeople).toHaveBeenCalledWith({
        filter: { query: 'John' },
        perPage: 10,
      });
    });

    it('resolves project by name when type is explicit', async () => {
      mockApi.getProjects.mockResolvedValue({
        data: [{ id: '777', attributes: { name: 'Client Project' } }],
      });

      const results = await resolve(mockApi as unknown as ProductiveApi, 'Client', {
        type: 'project',
      });

      expect(results[0].exact).toBe(false);
    });

    it('resolves project with fallback when normalized number not found', async () => {
      mockApi.getProjects
        .mockResolvedValueOnce({ data: [] }) // First try with normalized number
        .mockResolvedValueOnce({
          data: [{ id: '777', attributes: { name: 'Test' } }],
        });

      const results = await resolve(mockApi as unknown as ProductiveApi, 'P-123');

      expect(results[0].id).toBe('777');
      expect(mockApi.getProjects).toHaveBeenCalledTimes(2);
    });

    it('resolves deal by name when type is explicit', async () => {
      mockApi.getDeals.mockResolvedValue({
        data: [{ id: '888', attributes: { name: 'Test Deal' } }],
      });

      const results = await resolve(mockApi as unknown as ProductiveApi, 'Test', {
        type: 'deal',
      });

      expect(results[0].type).toBe('deal');
      expect(results[0].exact).toBe(false);
    });

    it('resolves deal with fallback when normalized number not found', async () => {
      mockApi.getDeals
        .mockResolvedValueOnce({ data: [] }) // First try with normalized number
        .mockResolvedValueOnce({
          data: [{ id: '888', attributes: { name: 'Test' } }],
        });

      const results = await resolve(mockApi as unknown as ProductiveApi, 'DEAL-123');

      expect(results[0].id).toBe('888');
      expect(mockApi.getDeals).toHaveBeenCalledTimes(2);
    });

    it('resolves service by name with project context', async () => {
      mockApi.getServices.mockResolvedValue({
        data: [
          { id: '111', attributes: { name: 'Development' } },
          { id: '222', attributes: { name: 'Design' } },
        ],
      });

      const results = await resolve(mockApi as unknown as ProductiveApi, 'Dev', {
        type: 'service',
        projectId: '777',
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('111');
    });

    it('resolves service with exact match', async () => {
      mockApi.getServices.mockResolvedValue({
        data: [{ id: '111', attributes: { name: 'Development' } }],
      });

      const results = await resolve(mockApi as unknown as ProductiveApi, 'development', {
        type: 'service',
      });

      expect(results[0].exact).toBe(true);
    });

    it('handles empty first_name or last_name', async () => {
      mockApi.getPeople.mockResolvedValue({
        data: [
          { id: '1', attributes: { first_name: '', last_name: 'Doe' } },
          { id: '2', attributes: { first_name: 'John', last_name: '' } },
        ],
      });

      const results = await resolve(mockApi as unknown as ProductiveApi, 'test@example.com');

      expect(results[0].label).toBe('Doe');
    });

    it('handles empty project name', async () => {
      mockApi.getProjects.mockResolvedValue({
        data: [{ id: '777', attributes: { name: '' } }],
      });

      const results = await resolve(mockApi as unknown as ProductiveApi, 'PRJ-123');

      expect(results[0].label).toBe('PRJ-123');
    });

    it('handles empty deal name', async () => {
      mockApi.getDeals.mockResolvedValue({
        data: [{ id: '888', attributes: { name: '' } }],
      });

      const results = await resolve(mockApi as unknown as ProductiveApi, 'D-123');

      expect(results[0].label).toBe('D-123');
    });
  });
});
