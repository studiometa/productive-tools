import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { ProductiveApi } from '../../api.js';
import type { CommandContext } from '../../context.js';

import {
  resolveCommandFilters,
  resolveValue,
  tryResolveValue,
  COMMON_FILTER_TYPES,
} from '../resolve-filters.js';
import { ResolveError } from '../resource-resolver.js';

describe('resolve-filters', () => {
  let mockApi: {
    getPeople: ReturnType<typeof vi.fn>;
    getProjects: ReturnType<typeof vi.fn>;
    getCompanies: ReturnType<typeof vi.fn>;
  };

  let mockCtx: CommandContext;

  beforeEach(() => {
    mockApi = {
      getPeople: vi.fn(),
      getProjects: vi.fn(),
      getCompanies: vi.fn(),
    };

    mockCtx = {
      api: mockApi as unknown as ProductiveApi,
      config: {
        organizationId: 'test-org',
        apiToken: 'test-token',
        userId: 'test-user',
        baseUrl: 'https://api.productive.io/api/v2',
      },
      options: { format: 'json' },
      formatter: {
        output: vi.fn(),
        error: vi.fn(),
        success: vi.fn(),
        info: vi.fn(),
      },
      cache: {} as never,
      createSpinner: vi.fn(),
      getPagination: vi.fn(() => ({ page: 1, perPage: 100 })),
      getSort: vi.fn(() => ''),
    } as unknown as CommandContext;
  });

  describe('COMMON_FILTER_TYPES', () => {
    it('includes common person filter types', () => {
      expect(COMMON_FILTER_TYPES.person_id).toBe('person');
      expect(COMMON_FILTER_TYPES.assignee_id).toBe('person');
      expect(COMMON_FILTER_TYPES.creator_id).toBe('person');
      expect(COMMON_FILTER_TYPES.responsible_id).toBe('person');
    });

    it('includes common project filter type', () => {
      expect(COMMON_FILTER_TYPES.project_id).toBe('project');
    });

    it('includes common company filter type', () => {
      expect(COMMON_FILTER_TYPES.company_id).toBe('company');
    });
  });

  describe('resolveCommandFilters', () => {
    it('returns filters unchanged when all values are numeric IDs', async () => {
      const filters = {
        person_id: '123456',
        project_id: '789012',
      };

      const result = await resolveCommandFilters(mockCtx, filters);

      expect(result.resolved).toEqual(filters);
      expect(result.didResolve).toBe(false);
      expect(Object.keys(result.metadata)).toHaveLength(0);
      expect(mockApi.getPeople).not.toHaveBeenCalled();
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

      const filters = {
        assignee_id: 'john@example.com',
      };

      const result = await resolveCommandFilters(mockCtx, filters);

      expect(result.resolved.assignee_id).toBe('500521');
      expect(result.didResolve).toBe(true);
      expect(result.metadata.assignee_id).toEqual({
        input: 'john@example.com',
        id: '500521',
        label: 'John Doe',
        reusable: true,
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

      const filters = {
        project_id: 'PRJ-123',
      };

      const result = await resolveCommandFilters(mockCtx, filters);

      expect(result.resolved.project_id).toBe('777332');
      expect(result.didResolve).toBe(true);
    });

    it('uses custom type mapping', async () => {
      mockApi.getCompanies.mockResolvedValue({
        data: [
          {
            id: '999',
            attributes: { name: 'Test Company' },
          },
        ],
      });

      const filters = {
        custom_company: 'Test Company',
      };

      const result = await resolveCommandFilters(mockCtx, filters, {
        custom_company: 'company',
      });

      expect(result.resolved.custom_company).toBe('999');
    });

    it('keeps filters without type mapping unchanged', async () => {
      const filters = {
        person_id: '123',
        unknown_filter: 'some-value',
      };

      const result = await resolveCommandFilters(mockCtx, filters);

      expect(result.resolved.unknown_filter).toBe('some-value');
    });
  });

  describe('resolveValue', () => {
    it('returns numeric IDs unchanged', async () => {
      const result = await resolveValue(mockCtx, '123456', 'person');
      expect(result).toBe('123456');
      expect(mockApi.getPeople).not.toHaveBeenCalled();
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

      const result = await resolveValue(mockCtx, 'john@example.com', 'person');
      expect(result).toBe('500521');
    });

    it('throws ResolveError when resolution fails', async () => {
      mockApi.getPeople.mockResolvedValue({ data: [] });

      await expect(resolveValue(mockCtx, 'unknown@example.com', 'person')).rejects.toThrow(
        ResolveError,
      );
    });
  });

  describe('tryResolveValue', () => {
    it('returns numeric IDs unchanged', async () => {
      const result = await tryResolveValue(mockCtx, '123456', 'person');
      expect(result).toBe('123456');
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

      const result = await tryResolveValue(mockCtx, 'john@example.com', 'person');
      expect(result).toBe('500521');
    });

    it('returns original value when resolution fails (no throw)', async () => {
      mockApi.getPeople.mockResolvedValue({ data: [] });

      const result = await tryResolveValue(mockCtx, 'unknown@example.com', 'person');
      expect(result).toBe('unknown@example.com');
    });
  });

  describe('resolveCommandFilters - additional cases', () => {
    it('shows resolution info in human format when enabled', async () => {
      const infoSpy = vi.fn();
      mockCtx.options.format = 'human';
      mockCtx.formatter = {
        ...mockCtx.formatter,
        info: infoSpy,
      } as never;

      mockApi.getPeople.mockResolvedValue({
        data: [
          {
            id: '500521',
            attributes: { first_name: 'John', last_name: 'Doe' },
          },
        ],
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await resolveCommandFilters(
        mockCtx,
        { assignee_id: 'john@example.com' },
        COMMON_FILTER_TYPES,
        { showResolutionInfo: true },
      );

      expect(consoleSpy).toHaveBeenCalled();
      const calls = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
      expect(calls).toContain('Resolved');

      consoleSpy.mockRestore();
    });

    it('does not show resolution info in JSON format', async () => {
      mockCtx.options.format = 'json';

      mockApi.getPeople.mockResolvedValue({
        data: [
          {
            id: '500521',
            attributes: { first_name: 'John', last_name: 'Doe' },
          },
        ],
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await resolveCommandFilters(
        mockCtx,
        { assignee_id: 'john@example.com' },
        COMMON_FILTER_TYPES,
        { showResolutionInfo: true },
      );

      // In JSON format, console.log should not be called with resolution info
      const calls = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
      expect(calls).not.toContain('Resolved');

      consoleSpy.mockRestore();
    });

    // Note: Service resolution tests require type='service' which is only passed
    // when the filter type mapping indicates service_id. The resolution is triggered
    // but string names like "Development" don't auto-detect to any type, so the
    // service resolution requires explicit type mapping which is already tested.
  });
});
