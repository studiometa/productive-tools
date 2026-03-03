import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { ProductiveApi } from '../../api.js';

import { createTestContext } from '../../context.js';
import { customFieldsGet, customFieldsList } from './handlers.js';

describe('custom-fields handlers', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockCustomFields = [
    {
      id: '42236',
      type: 'custom_fields',
      attributes: {
        name: 'Semaine',
        data_type: 3,
        customizable_type: 'Task',
        archived: false,
        required: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-15T00:00:00Z',
      },
    },
    {
      id: '41487',
      type: 'custom_fields',
      attributes: {
        name: 'Points',
        data_type: 2,
        customizable_type: 'Task',
        archived: false,
        required: false,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-15T00:00:00Z',
      },
    },
  ];

  describe('customFieldsList', () => {
    it('should list custom fields in human format', async () => {
      const getCustomFields = vi.fn().mockResolvedValue({
        data: mockCustomFields,
        meta: { total_count: 2, current_page: 1, total_pages: 1 },
      });

      const ctx = createTestContext({
        api: { getCustomFields } as unknown as ProductiveApi,
      });

      await customFieldsList(ctx);

      expect(getCustomFields).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should list custom fields in json format', async () => {
      const getCustomFields = vi.fn().mockResolvedValue({
        data: mockCustomFields,
        meta: { total_count: 2, current_page: 1, total_pages: 1 },
      });

      const ctx = createTestContext({
        api: { getCustomFields } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await customFieldsList(ctx);

      expect(getCustomFields).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls
        .map((c) => c[0])
        .filter((s) => typeof s === 'string')
        .join('');
      expect(output).toContain('Semaine');
    });

    it('should list custom fields in csv format', async () => {
      const getCustomFields = vi.fn().mockResolvedValue({
        data: mockCustomFields,
        meta: { total_count: 2 },
      });

      const ctx = createTestContext({
        api: { getCustomFields } as unknown as ProductiveApi,
        options: { format: 'csv' },
      });

      await customFieldsList(ctx);

      expect(getCustomFields).toHaveBeenCalled();
    });

    it('should pass type filter', async () => {
      const getCustomFields = vi.fn().mockResolvedValue({
        data: [],
        meta: {},
      });

      const ctx = createTestContext({
        api: { getCustomFields } as unknown as ProductiveApi,
        options: { type: 'Task' },
      });

      await customFieldsList(ctx);

      expect(getCustomFields).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ customizable_type: 'Task' }),
        }),
      );
    });

    it('should pass archived filter', async () => {
      const getCustomFields = vi.fn().mockResolvedValue({
        data: [],
        meta: {},
      });

      const ctx = createTestContext({
        api: { getCustomFields } as unknown as ProductiveApi,
        options: { archived: 'false' },
      });

      await customFieldsList(ctx);

      expect(getCustomFields).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ archived: 'false' }),
        }),
      );
    });

    it('should pass generic filter option', async () => {
      const getCustomFields = vi.fn().mockResolvedValue({
        data: [],
        meta: {},
      });

      const ctx = createTestContext({
        api: { getCustomFields } as unknown as ProductiveApi,
        options: { filter: 'status=active,priority=high' },
      });

      await customFieldsList(ctx);

      expect(getCustomFields).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ status: 'active', priority: 'high' }),
        }),
      );
    });

    it('should pass include option', async () => {
      const getCustomFields = vi.fn().mockResolvedValue({
        data: [],
        meta: {},
      });

      const ctx = createTestContext({
        api: { getCustomFields } as unknown as ProductiveApi,
        options: { include: 'options' },
      });

      await customFieldsList(ctx);

      expect(getCustomFields).toHaveBeenCalledWith(
        expect.objectContaining({
          include: ['options'],
        }),
      );
    });

    it('should list custom fields in table format', async () => {
      const getCustomFields = vi.fn().mockResolvedValue({
        data: mockCustomFields,
        meta: { total_count: 2 },
      });

      const ctx = createTestContext({
        api: { getCustomFields } as unknown as ProductiveApi,
        options: { format: 'table' },
      });

      await customFieldsList(ctx);

      expect(getCustomFields).toHaveBeenCalled();
    });
  });

  describe('customFieldsGet', () => {
    const mockSingleField = {
      data: {
        id: '42236',
        type: 'custom_fields',
        attributes: {
          name: 'Semaine',
          data_type: 3,
          customizable_type: 'Task',
          archived: false,
          required: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-15T00:00:00Z',
        },
      },
      included: [
        {
          id: '417421',
          type: 'custom_field_options',
          attributes: { value: '2026-09', archived: false },
          relationships: {
            custom_field: { data: { type: 'custom_fields', id: '42236' } },
          },
        },
      ],
    };

    it('should get a custom field by ID', async () => {
      const getCustomField = vi.fn().mockResolvedValue(mockSingleField);

      const ctx = createTestContext({
        api: { getCustomField } as unknown as ProductiveApi,
      });

      await customFieldsGet(['42236'], ctx);

      expect(getCustomField).toHaveBeenCalledWith('42236', { include: ['options'] });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should get a custom field in json format', async () => {
      const getCustomField = vi.fn().mockResolvedValue(mockSingleField);

      const ctx = createTestContext({
        api: { getCustomField } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await customFieldsGet(['42236'], ctx);

      expect(getCustomField).toHaveBeenCalled();
    });

    it('should get a custom field in csv format', async () => {
      const getCustomField = vi.fn().mockResolvedValue(mockSingleField);

      const ctx = createTestContext({
        api: { getCustomField } as unknown as ProductiveApi,
        options: { format: 'csv' },
      });

      await customFieldsGet(['42236'], ctx);

      expect(getCustomField).toHaveBeenCalled();
    });

    it('should get a custom field with custom include', async () => {
      const getCustomField = vi.fn().mockResolvedValue(mockSingleField);

      const ctx = createTestContext({
        api: { getCustomField } as unknown as ProductiveApi,
        options: { include: 'options,custom_field' },
      });

      await customFieldsGet(['42236'], ctx);

      expect(getCustomField).toHaveBeenCalledWith('42236', {
        include: ['options', 'custom_field'],
      });
    });

    it('should get a custom field in table format', async () => {
      const getCustomField = vi.fn().mockResolvedValue(mockSingleField);

      const ctx = createTestContext({
        api: { getCustomField } as unknown as ProductiveApi,
        options: { format: 'table' },
      });

      await customFieldsGet(['42236'], ctx);

      expect(getCustomField).toHaveBeenCalled();
    });

    it('should show error when no ID provided', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const ctx = createTestContext({
        api: {} as unknown as ProductiveApi,
      });

      await customFieldsGet([], ctx);

      // The error output contains the missing ID message
      const allOutput = [
        ...consoleLogSpy.mock.calls.map((c) => String(c[0])),
        ...errorSpy.mock.calls.map((c) => String(c[0])),
      ].join(' ');
      expect(allOutput).toContain('Missing custom field ID');
      errorSpy.mockRestore();
    });
  });
});
