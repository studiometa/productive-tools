import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

import { handleBudgetsCommand } from './command.js';

// Mock the handlers module
vi.mock('./handlers.js', () => ({
  budgetsList: vi.fn().mockResolvedValue(undefined),
  budgetsGet: vi.fn().mockResolvedValue(undefined),
}));

describe('handleBudgetsCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('command routing', () => {
    it('should route list subcommand to budgetsList handler', async () => {
      const { budgetsList } = await import('./handlers.js');

      await handleBudgetsCommand('list', [], {
        format: 'json',
        token: 'test-token',
        'org-id': 'test-org',
      });

      expect(budgetsList).toHaveBeenCalled();
    });

    it('should route ls alias to budgetsList handler', async () => {
      const { budgetsList } = await import('./handlers.js');

      await handleBudgetsCommand('ls', [], {
        format: 'json',
        token: 'test-token',
        'org-id': 'test-org',
      });

      expect(budgetsList).toHaveBeenCalled();
    });

    it('should route get subcommand to budgetsGet handler', async () => {
      const { budgetsGet } = await import('./handlers.js');

      await handleBudgetsCommand('get', ['123'], {
        format: 'json',
        token: 'test-token',
        'org-id': 'test-org',
      });

      expect(budgetsGet).toHaveBeenCalledWith(['123'], expect.anything());
    });

    it('should exit with error for unknown subcommand', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const processExitSpy = vi
        .spyOn(process, 'exit')
        .mockImplementation((code?: string | number | null | undefined): never => {
          throw new Error(`process.exit(${code})`);
        });

      await expect(
        handleBudgetsCommand('unknown', [], {
          format: 'json',
          token: 'test-token',
          'org-id': 'test-org',
        }),
      ).rejects.toThrow('process.exit(1)');

      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown budgets subcommand: unknown'),
      );
    });
  });
});
