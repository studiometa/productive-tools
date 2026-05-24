/**
 * Tests for dry-run functionality in time handlers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { createTestContext } from '../../context.js';
import { timeAdd, timeUpdate, timeDelete } from './handlers.js';

describe('time handlers dry-run', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit() was called');
    });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('timeAdd', () => {
    it('shows dry-run output without making API call', async () => {
      const mockApi = {
        // createTimeEntry should not be called in dry-run mode
      };

      const mockFormatter = {
        output: vi.fn(),
        success: vi.fn(),
        error: vi.fn(),
      };

      const ctx = createTestContext({
        api: mockApi as any,
        formatter: mockFormatter as any,
        options: {
          'dry-run': true,
          format: 'human',
          service: '123',
          time: '480',
          person: '456',
          note: 'Test work',
        },
        config: { userId: '456', apiToken: 'test', organizationId: '789', baseUrl: 'test' },
      });

      await timeAdd(ctx);

      // Should show dry-run output but not call API
      const logCalls = consoleSpy.mock.calls.flat();
      expect(logCalls.some((call) => String(call).includes('DRY RUN MODE'))).toBe(true);
      expect(logCalls.some((call) => String(call).includes('Create time entry'))).toBe(true);
      expect(logCalls.some((call) => String(call).includes('8h 0m for service 123'))).toBe(true);
      expect(logCalls.some((call) => String(call).includes('No changes made'))).toBe(true);
      expect(mockFormatter.success).not.toHaveBeenCalled();
    });

    it('outputs JSON format in dry-run mode', async () => {
      const mockApi = {};
      const mockFormatter = { output: vi.fn() };

      const ctx = createTestContext({
        api: mockApi as any,
        formatter: mockFormatter as any,
        options: {
          'dry-run': true,
          format: 'json',
          service: '123',
          time: '480',
          person: '456',
        },
        config: { userId: '456', apiToken: 'test', organizationId: '789', baseUrl: 'test' },
      });

      await timeAdd(ctx);

      expect(mockFormatter.output).toHaveBeenCalledWith({
        dry_run: true,
        action: 'create',
        resource: 'time entry',
        resource_id: undefined,
        payload: {
          personId: '456',
          serviceId: '123',
          time: 480,
          date: undefined,
          note: undefined,
        },
      });
    });

    it('still validates required fields in dry-run mode', async () => {
      const mockFormatter = { error: vi.fn() };

      const ctx = createTestContext({
        formatter: mockFormatter as any,
        options: {
          'dry-run': true,
          // Missing required fields
        },
        config: { apiToken: 'test', organizationId: '789', baseUrl: 'test' },
      });

      try {
        await timeAdd(ctx);
      } catch (error) {
        // Expect process.exit to be called due to validation error
        expect(String(error)).toContain('process.exit() was called');
      }

      // Should still validate and show error, not dry-run output
      expect(mockFormatter.error).toHaveBeenCalled();
      const logCalls = consoleSpy.mock.calls.flat();
      expect(logCalls.some((call) => String(call).includes('DRY RUN MODE'))).toBe(false);
    });
  });

  describe('timeUpdate', () => {
    it('shows dry-run output for update operation', async () => {
      const mockApi = {};
      const mockFormatter = { output: vi.fn() };

      const ctx = createTestContext({
        api: mockApi as any,
        formatter: mockFormatter as any,
        options: {
          'dry-run': true,
          format: 'human',
          time: '240',
          note: 'Updated work',
        },
      });

      await timeUpdate(['123'], ctx);

      const logCalls = consoleSpy.mock.calls.flat();
      expect(logCalls.some((call) => String(call).includes('DRY RUN MODE'))).toBe(true);
      expect(logCalls.some((call) => String(call).includes('Update time entry 123'))).toBe(true);
      expect(logCalls.some((call) => String(call).includes('No changes made'))).toBe(true);
    });

    it('validates no updates provided even in dry-run mode', async () => {
      const mockFormatter = { error: vi.fn() };

      const ctx = createTestContext({
        formatter: mockFormatter as any,
        options: {
          'dry-run': true,
          // No update fields provided
        },
      });

      try {
        await timeUpdate(['123'], ctx);
      } catch (error) {
        // Expect process.exit to be called due to validation error
        expect(String(error)).toContain('process.exit() was called');
      }

      // Should still validate and show error
      expect(mockFormatter.error).toHaveBeenCalled();
      const logCalls = consoleSpy.mock.calls.flat();
      expect(logCalls.some((call) => String(call).includes('DRY RUN MODE'))).toBe(false);
    });
  });

  describe('timeDelete', () => {
    it('shows dry-run output for delete operation', async () => {
      const mockApi = {};
      const mockFormatter = { output: vi.fn() };

      const ctx = createTestContext({
        api: mockApi as any,
        formatter: mockFormatter as any,
        options: {
          'dry-run': true,
          format: 'human',
        },
      });

      await timeDelete(['456'], ctx);

      const logCalls = consoleSpy.mock.calls.flat();
      expect(logCalls.some((call) => String(call).includes('DRY RUN MODE'))).toBe(true);
      expect(logCalls.some((call) => String(call).includes('Delete time entry 456'))).toBe(true);
      expect(logCalls.some((call) => String(call).includes('No changes made'))).toBe(true);
    });

    it('outputs JSON format for delete in dry-run mode', async () => {
      const mockApi = {};
      const mockFormatter = { output: vi.fn() };

      const ctx = createTestContext({
        api: mockApi as any,
        formatter: mockFormatter as any,
        options: {
          'dry-run': true,
          format: 'json',
        },
      });

      await timeDelete(['456'], ctx);

      expect(mockFormatter.output).toHaveBeenCalledWith({
        dry_run: true,
        action: 'delete',
        resource: 'time entry',
        resource_id: '456',
        payload: {},
      });
    });
  });
});
