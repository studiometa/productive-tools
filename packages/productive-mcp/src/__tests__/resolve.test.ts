import type { ProductiveApi } from '@studiometa/productive-cli';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { HandlerContext } from '../handlers/types.js';

import {
  detectResourceType,
  isNumericId,
  resolve,
  resolveFilters,
  resolveFilterValue,
  handleResolve,
  FILTER_TYPE_MAPPING,
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

    it('is case-insensitive for project numbers', () => {
      expect(detectResourceType('prj-123')).toBe('project');
      expect(detectResourceType('Prj-456')).toBe('project');
    });

    it('is case-insensitive for deal numbers', () => {
      expect(detectResourceType('deal-123')).toBe('deal');
      expect(detectResourceType('Deal-456')).toBe('deal');
    });
  });

  describe('isNumericId', () => {
    it('returns true for numeric strings', () => {
      expect(isNumericId('123')).toBe(true);
      expect(isNumericId('0')).toBe(true);
      expect(isNumericId('999999')).toBe(true);
    });

    it('returns false for non-numeric strings', () => {
      expect(isNumericId('abc')).toBe(false);
      expect(isNumericId('user@example.com')).toBe(false);
      expect(isNumericId('PRJ-123')).toBe(false);
      expect(isNumericId('')).toBe(false);
    });
  });

  describe('FILTER_TYPE_MAPPING', () => {
    it('maps person-related filters', () => {
      expect(FILTER_TYPE_MAPPING.person_id).toBe('person');
      expect(FILTER_TYPE_MAPPING.assignee_id).toBe('person');
      expect(FILTER_TYPE_MAPPING.creator_id).toBe('person');
      expect(FILTER_TYPE_MAPPING.responsible_id).toBe('person');
    });

    it('maps other resource filters', () => {
      expect(FILTER_TYPE_MAPPING.project_id).toBe('project');
      expect(FILTER_TYPE_MAPPING.company_id).toBe('company');
      expect(FILTER_TYPE_MAPPING.deal_id).toBe('deal');
      expect(FILTER_TYPE_MAPPING.service_id).toBe('service');
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

    it('returns numeric IDs as-is', async () => {
      const results = await resolve(mockApi as unknown as ProductiveApi, '123456');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('123456');
      expect(results[0].exact).toBe(true);
    });

    it('uses explicit type for numeric IDs', async () => {
      const results = await resolve(mockApi as unknown as ProductiveApi, '123456', 'person');

      expect(results[0].type).toBe('person');
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

    it('resolves person by name search', async () => {
      mockApi.getPeople.mockResolvedValue({
        data: [
          { id: '1', attributes: { first_name: 'John', last_name: 'Doe' } },
          { id: '2', attributes: { first_name: 'John', last_name: 'Smith' } },
        ],
      });

      const results = await resolve(mockApi as unknown as ProductiveApi, 'John', 'person');

      expect(results).toHaveLength(2);
      expect(results[0].exact).toBe(false);
    });

    it('resolves project by number', async () => {
      mockApi.getProjects.mockResolvedValue({
        data: [{ id: '777', attributes: { name: 'Test Project' } }],
      });

      const results = await resolve(mockApi as unknown as ProductiveApi, 'PRJ-123');

      expect(results[0].id).toBe('777');
      expect(results[0].type).toBe('project');
    });

    it('resolves project by name search', async () => {
      mockApi.getProjects.mockResolvedValue({
        data: [{ id: '777', attributes: { name: 'Client Project' } }],
      });

      const results = await resolve(mockApi as unknown as ProductiveApi, 'Client', 'project');

      expect(results[0].exact).toBe(false);
    });

    it('resolves project with fallback for unnormalized number', async () => {
      mockApi.getProjects
        .mockResolvedValueOnce({ data: [] }) // First try fails
        .mockResolvedValueOnce({
          data: [{ id: '777', attributes: { name: 'Test' } }],
        });

      const results = await resolve(mockApi as unknown as ProductiveApi, 'P-123');

      expect(results[0].id).toBe('777');
    });

    it('resolves company by name', async () => {
      mockApi.getCompanies.mockResolvedValue({
        data: [{ id: '999', attributes: { name: 'Test Company' } }],
      });

      const results = await resolve(mockApi as unknown as ProductiveApi, 'Test', 'company');

      expect(results[0].id).toBe('999');
      expect(results[0].type).toBe('company');
    });

    it('resolves deal by number', async () => {
      mockApi.getDeals.mockResolvedValue({
        data: [{ id: '888', attributes: { name: 'Test Deal' } }],
      });

      const results = await resolve(mockApi as unknown as ProductiveApi, 'D-123');

      expect(results[0].id).toBe('888');
      expect(results[0].type).toBe('deal');
    });

    it('resolves deal by name search', async () => {
      mockApi.getDeals.mockResolvedValue({
        data: [{ id: '888', attributes: { name: 'Test Deal' } }],
      });

      const results = await resolve(mockApi as unknown as ProductiveApi, 'Test', 'deal');

      expect(results[0].exact).toBe(false);
    });

    it('resolves deal with fallback for unnormalized number', async () => {
      mockApi.getDeals
        .mockResolvedValueOnce({ data: [] }) // First try fails
        .mockResolvedValueOnce({
          data: [{ id: '888', attributes: { name: 'Test' } }],
        });

      const results = await resolve(mockApi as unknown as ProductiveApi, 'DEAL-123');

      expect(results[0].id).toBe('888');
    });

    it('resolves service by name with project context', async () => {
      mockApi.getServices.mockResolvedValue({
        data: [
          { id: '111', attributes: { name: 'Development' } },
          { id: '222', attributes: { name: 'Design' } },
        ],
      });

      const results = await resolve(mockApi as unknown as ProductiveApi, 'Dev', 'service', '777');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('111');
      expect(mockApi.getServices).toHaveBeenCalledWith({
        filter: { project_id: '777' },
        perPage: 200,
      });
    });

    it('resolves service with exact match', async () => {
      mockApi.getServices.mockResolvedValue({
        data: [{ id: '111', attributes: { name: 'Development' } }],
      });

      const results = await resolve(mockApi as unknown as ProductiveApi, 'development', 'service');

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

  describe('resolveFilterValue', () => {
    let mockApi: {
      getPeople: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mockApi = {
        getPeople: vi.fn(),
      };
    });

    it('returns numeric IDs unchanged', async () => {
      const result = await resolveFilterValue(
        mockApi as unknown as ProductiveApi,
        '123456',
        'person',
      );

      expect(result).toBe('123456');
      expect(mockApi.getPeople).not.toHaveBeenCalled();
    });

    it('resolves email to person ID', async () => {
      mockApi.getPeople.mockResolvedValue({
        data: [{ id: '500521', attributes: { first_name: 'John', last_name: 'Doe' } }],
      });

      const result = await resolveFilterValue(
        mockApi as unknown as ProductiveApi,
        'john@example.com',
        'person',
      );

      expect(result).toBe('500521');
    });
  });

  describe('resolveFilters', () => {
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

    it('resolves multiple filters', async () => {
      mockApi.getPeople.mockResolvedValue({
        data: [{ id: '500521', attributes: { first_name: 'John', last_name: 'Doe' } }],
      });
      mockApi.getProjects.mockResolvedValue({
        data: [{ id: '777', attributes: { name: 'Test Project' } }],
      });

      const { resolved, metadata } = await resolveFilters(mockApi as unknown as ProductiveApi, {
        person_id: 'john@example.com',
        project_id: 'PRJ-123',
      });

      expect(resolved.person_id).toBe('500521');
      expect(resolved.project_id).toBe('777');
      expect(Object.keys(metadata)).toHaveLength(2);
    });

    it('keeps filters without type mapping unchanged', async () => {
      const { resolved } = await resolveFilters(mockApi as unknown as ProductiveApi, {
        unknown_filter: 'value',
      });

      expect(resolved.unknown_filter).toBe('value');
    });

    it('keeps original value on resolution error', async () => {
      mockApi.getPeople.mockResolvedValue({ data: [] });

      const { resolved } = await resolveFilters(mockApi as unknown as ProductiveApi, {
        person_id: 'unknown@example.com',
      });

      expect(resolved.person_id).toBe('unknown@example.com');
    });
  });

  describe('handleResolve', () => {
    let mockApi: {
      getPeople: ReturnType<typeof vi.fn>;
      getCompanies: ReturnType<typeof vi.fn>;
    };

    let mockCtx: HandlerContext;

    beforeEach(() => {
      mockApi = {
        getPeople: vi.fn(),
        getCompanies: vi.fn(),
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

    it('returns exact: true for single exact match', async () => {
      mockApi.getPeople.mockResolvedValue({
        data: [{ id: '500521', attributes: { first_name: 'John', last_name: 'Doe' } }],
      });

      const result = await handleResolve({ query: 'john@example.com' }, mockCtx);

      const content = JSON.parse(result.content[0].text as string);
      expect(content.exact).toBe(true);
    });

    it('returns exact: false for multiple matches', async () => {
      mockApi.getCompanies.mockResolvedValue({
        data: [
          { id: '1', attributes: { name: 'Meta Corp' } },
          { id: '2', attributes: { name: 'Meta Inc' } },
        ],
      });

      const result = await handleResolve({ query: 'Meta', type: 'company' }, mockCtx);

      const content = JSON.parse(result.content[0].text as string);
      expect(content.exact).toBe(false);
    });

    it('uses explicit type when provided', async () => {
      mockApi.getCompanies.mockResolvedValue({
        data: [{ id: '123', attributes: { name: 'Test Company' } }],
      });

      const result = await handleResolve({ query: 'Test', type: 'company' }, mockCtx);

      expect(mockApi.getCompanies).toHaveBeenCalled();
      const content = JSON.parse(result.content[0].text as string);
      expect(content.matches[0].type).toBe('company');
    });

    it('returns error for no matches', async () => {
      mockApi.getPeople.mockResolvedValue({ data: [] });

      const result = await handleResolve({ query: 'unknown@example.com' }, mockCtx);

      expect(result.isError).toBe(true);
    });

    it('returns error for ambiguous query without type', async () => {
      const result = await handleResolve({ query: 'ambiguous' }, mockCtx);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Cannot determine resource type');
    });
  });
});
