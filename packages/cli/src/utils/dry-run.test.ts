/**
 * Tests for dry-run utilities
 */

import { describe, it, expect, vi } from 'vitest';

import type { CommandContext } from '../context.js';

import { isDryRun, handleDryRunOutput } from './dry-run.js';

describe('dry-run utilities', () => {
  describe('isDryRun', () => {
    it('returns true when --dry-run option is set', () => {
      const ctx = {
        options: { 'dry-run': true },
      } as CommandContext;

      expect(isDryRun(ctx)).toBe(true);
    });

    it('returns false when --dry-run option is not set', () => {
      const ctx = {
        options: {},
      } as CommandContext;

      expect(isDryRun(ctx)).toBe(false);
    });

    it('returns false when --dry-run option is false', () => {
      const ctx = {
        options: { 'dry-run': false },
      } as CommandContext;

      expect(isDryRun(ctx)).toBe(false);
    });
  });

  describe('handleDryRunOutput', () => {
    it('outputs JSON format correctly', () => {
      const mockFormatter = { output: vi.fn() };
      const mockSpinner = { succeed: vi.fn(), fail: vi.fn() };
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const ctx = {
        options: { format: 'json' },
        formatter: mockFormatter,
      } as unknown as CommandContext;

      handleDryRunOutput(
        {
          action: 'create',
          resource: 'task',
          payload: { title: 'Test task' },
        },
        ctx,
        mockSpinner as any,
      );

      expect(mockSpinner.succeed).toHaveBeenCalled();
      expect(mockFormatter.output).toHaveBeenCalledWith({
        dry_run: true,
        action: 'create',
        resource: 'task',
        resource_id: undefined,
        payload: { title: 'Test task' },
      });
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('outputs human format correctly for create action', () => {
      const mockFormatter = { output: vi.fn() };
      const mockSpinner = { succeed: vi.fn(), fail: vi.fn() };
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const ctx = {
        options: { format: 'human' },
        formatter: mockFormatter,
      } as unknown as CommandContext;

      handleDryRunOutput(
        {
          action: 'create',
          resource: 'task',
          payload: { title: 'Test task', projectId: '123' },
          description: 'Create new task',
        },
        ctx,
        mockSpinner as any,
      );

      expect(mockSpinner.succeed).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('DRY RUN MODE'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Action:'), 'Create task');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Description:'),
        'Create new task',
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No changes made.'));
      expect(mockFormatter.output).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('outputs human format correctly for update action with resource ID', () => {
      const mockFormatter = { output: vi.fn() };
      const mockSpinner = { succeed: vi.fn(), fail: vi.fn() };
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const ctx = {
        options: { format: 'human' },
        formatter: mockFormatter,
      } as unknown as CommandContext;

      handleDryRunOutput(
        {
          action: 'update',
          resource: 'task',
          resourceId: '456',
          payload: { title: 'Updated task' },
        },
        ctx,
        mockSpinner as any,
      );

      expect(mockSpinner.succeed).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Action:'),
        'Update task 456',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Payload:'),
        expect.stringContaining('title'),
      );

      consoleSpy.mockRestore();
    });

    it('outputs human format correctly for delete action', () => {
      const mockFormatter = { output: vi.fn() };
      const mockSpinner = { succeed: vi.fn(), fail: vi.fn() };
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const ctx = {
        options: { format: 'human' },
        formatter: mockFormatter,
      } as unknown as CommandContext;

      handleDryRunOutput(
        {
          action: 'delete',
          resource: 'task',
          resourceId: '789',
        },
        ctx,
        mockSpinner as any,
      );

      expect(mockSpinner.succeed).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Action:'),
        'Delete task 789',
      );

      consoleSpy.mockRestore();
    });

    it('handles empty payload correctly', () => {
      const mockFormatter = { output: vi.fn() };
      const mockSpinner = { succeed: vi.fn(), fail: vi.fn() };
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const ctx = {
        options: { format: 'human' },
        formatter: mockFormatter,
      } as unknown as CommandContext;

      handleDryRunOutput(
        {
          action: 'start',
          resource: 'timer',
        },
        ctx,
        mockSpinner as any,
      );

      expect(mockSpinner.succeed).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Action:'), 'Start timer');
      // Should not log payload for empty payload
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Payload:'),
        expect.anything(),
      );

      consoleSpy.mockRestore();
    });
  });
});
