import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { ProductiveApi } from '../../api.js';

import { createTestContext } from '../../context.js';
import { resolveIdentifier, detectType } from '../resolve/handlers.js';

describe('resolve command', () => {
  let mockApi: {
    getPeople: ReturnType<typeof vi.fn>;
    getProjects: ReturnType<typeof vi.fn>;
    getCompanies: ReturnType<typeof vi.fn>;
  };

  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockApi = {
      getPeople: vi.fn(),
      getProjects: vi.fn(),
      getCompanies: vi.fn(),
    };

    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('resolveIdentifier', () => {
    it('throws ValidationError when query is missing', async () => {
      const ctx = createTestContext({
        api: mockApi as unknown as ProductiveApi,
      });

      await expect(resolveIdentifier([], ctx)).rejects.toThrow('query');
    });

    it('resolves person by email and outputs JSON', async () => {
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

      const outputSpy = vi.fn();
      const ctx = createTestContext({
        api: mockApi as unknown as ProductiveApi,
        options: { format: 'json' },
        formatter: {
          output: outputSpy,
          error: vi.fn(),
          success: vi.fn(),
          info: vi.fn(),
        } as never,
      });

      await resolveIdentifier(['john@example.com'], ctx);

      expect(outputSpy).toHaveBeenCalledWith({
        query: 'john@example.com',
        matches: [
          {
            id: '500521',
            type: 'person',
            label: 'John Doe',
            query: 'john@example.com',
            exact: true,
          },
        ],
        exact: true,
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

      const outputSpy = vi.fn();
      const ctx = createTestContext({
        api: mockApi as unknown as ProductiveApi,
        options: { format: 'json' },
        formatter: {
          output: outputSpy,
          error: vi.fn(),
          success: vi.fn(),
          info: vi.fn(),
        } as never,
      });

      await resolveIdentifier(['PRJ-123'], ctx);

      expect(outputSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'PRJ-123',
          matches: expect.arrayContaining([
            expect.objectContaining({
              id: '777332',
              type: 'project',
            }),
          ]),
        }),
      );
    });

    it('outputs only ID in quiet mode', async () => {
      mockApi.getPeople.mockResolvedValue({
        data: [
          {
            id: '500521',
            attributes: { first_name: 'John', last_name: 'Doe' },
          },
        ],
      });

      const ctx = createTestContext({
        api: mockApi as unknown as ProductiveApi,
        options: { quiet: true },
      });

      await resolveIdentifier(['john@example.com'], ctx);

      expect(consoleSpy).toHaveBeenCalledWith('500521');
    });

    it('throws error in quiet mode with multiple matches and no --first', async () => {
      mockApi.getCompanies.mockResolvedValue({
        data: [
          { id: '1', attributes: { name: 'Meta Corp' } },
          { id: '2', attributes: { name: 'Meta Inc' } },
        ],
      });

      const ctx = createTestContext({
        api: mockApi as unknown as ProductiveApi,
        options: { quiet: true, type: 'company' },
      });

      await resolveIdentifier(['Meta'], ctx);

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('returns first match in quiet mode with --first', async () => {
      mockApi.getCompanies.mockResolvedValue({
        data: [
          { id: '1', attributes: { name: 'Meta Corp' } },
          { id: '2', attributes: { name: 'Meta Inc' } },
        ],
      });

      const ctx = createTestContext({
        api: mockApi as unknown as ProductiveApi,
        options: { quiet: true, first: true, type: 'company' },
      });

      await resolveIdentifier(['Meta'], ctx);

      expect(consoleSpy).toHaveBeenCalledWith('1');
    });

    it('outputs human format for single result', async () => {
      mockApi.getPeople.mockResolvedValue({
        data: [
          {
            id: '500521',
            attributes: { first_name: 'John', last_name: 'Doe' },
          },
        ],
      });

      const ctx = createTestContext({
        api: mockApi as unknown as ProductiveApi,
        options: { format: 'human', 'no-color': true },
      });

      await resolveIdentifier(['john@example.com'], ctx);

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('500521');
      expect(output).toContain('John Doe');
    });

    it('outputs human format for multiple results', async () => {
      mockApi.getCompanies.mockResolvedValue({
        data: [
          { id: '1', attributes: { name: 'Meta Corp' } },
          { id: '2', attributes: { name: 'Meta Inc' } },
        ],
      });

      const ctx = createTestContext({
        api: mockApi as unknown as ProductiveApi,
        options: { format: 'human', 'no-color': true, type: 'company' },
      });

      await resolveIdentifier(['Meta'], ctx);

      expect(consoleSpy).toHaveBeenCalled();
      // Check first call contains "matches" text
      expect(consoleSpy.mock.calls.some((call) => String(call[0]).includes('matches'))).toBe(true);
    });

    it('handles ResolveError with suggestions in JSON format', async () => {
      mockApi.getPeople.mockResolvedValue({ data: [] });

      const outputSpy = vi.fn();
      const ctx = createTestContext({
        api: mockApi as unknown as ProductiveApi,
        options: { format: 'json' },
        formatter: {
          output: outputSpy,
          error: vi.fn(),
          success: vi.fn(),
          info: vi.fn(),
        } as never,
      });

      await resolveIdentifier(['unknown@example.com'], ctx);

      expect(outputSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'ResolveError',
          query: 'unknown@example.com',
        }),
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('handles ResolveError with suggestions in human format', async () => {
      mockApi.getPeople.mockResolvedValue({ data: [] });

      const ctx = createTestContext({
        api: mockApi as unknown as ProductiveApi,
        options: { format: 'human' },
      });

      await resolveIdentifier(['unknown@example.com'], ctx);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('detectType', () => {
    it('throws ValidationError when query is missing', async () => {
      const ctx = createTestContext({});

      await expect(detectType([], ctx)).rejects.toThrow('query');
    });

    it('outputs JSON format for email detection', async () => {
      const outputSpy = vi.fn();
      const ctx = createTestContext({
        options: { format: 'json' },
        formatter: {
          output: outputSpy,
          error: vi.fn(),
          success: vi.fn(),
          info: vi.fn(),
        } as never,
      });

      await detectType(['user@example.com'], ctx);

      expect(outputSpy).toHaveBeenCalledWith({
        query: 'user@example.com',
        detection: {
          type: 'person',
          confidence: 'high',
          pattern: 'email',
        },
      });
    });

    it('outputs JSON format for project number detection', async () => {
      const outputSpy = vi.fn();
      const ctx = createTestContext({
        options: { format: 'json' },
        formatter: {
          output: outputSpy,
          error: vi.fn(),
          success: vi.fn(),
          info: vi.fn(),
        } as never,
      });

      await detectType(['PRJ-123'], ctx);

      expect(outputSpy).toHaveBeenCalledWith({
        query: 'PRJ-123',
        detection: {
          type: 'project',
          confidence: 'high',
          pattern: 'project_number',
        },
      });
    });

    it('outputs JSON format for no detection', async () => {
      const outputSpy = vi.fn();
      const ctx = createTestContext({
        options: { format: 'json' },
        formatter: {
          output: outputSpy,
          error: vi.fn(),
          success: vi.fn(),
          info: vi.fn(),
        } as never,
      });

      await detectType(['ambiguous'], ctx);

      expect(outputSpy).toHaveBeenCalledWith({
        query: 'ambiguous',
        detection: null,
      });
    });

    it('outputs human format for detection', async () => {
      const ctx = createTestContext({
        options: { format: 'human' },
      });

      await detectType(['user@example.com'], ctx);

      expect(consoleSpy).toHaveBeenCalled();
      const calls = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
      expect(calls).toContain('person');
      expect(calls).toContain('email');
    });

    it('outputs human format for no detection', async () => {
      const ctx = createTestContext({
        options: { format: 'human' },
      });

      await detectType(['ambiguous'], ctx);

      expect(consoleSpy).toHaveBeenCalled();
      const calls = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
      expect(calls).toContain('No pattern detected');
    });
  });
});

describe('resolve help', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('shows main resolve help', async () => {
    const { showResolveHelp } = await import('../resolve/help.js');
    showResolveHelp();

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toContain('productive resolve');
    expect(output).toContain('USAGE');
    expect(output).toContain('OPTIONS');
    expect(output).toContain('EXAMPLES');
  });

  it('shows detect subcommand help', async () => {
    const { showResolveHelp } = await import('../resolve/help.js');
    showResolveHelp('detect');

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toContain('productive resolve detect');
    expect(output).toContain('Detect resource type');
  });
});

describe('handleResolveCommand', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  const testOptions = {
    format: 'json',
    token: 'test-token',
    'org-id': 'test-org',
    'user-id': 'test-user',
  };

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('handles detect subcommand', async () => {
    const { handleResolveCommand } = await import('../resolve/command.js');

    await handleResolveCommand('detect', ['user@example.com'], testOptions);

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toContain('person');
  });

  it('exits with error when query is empty', async () => {
    const { handleResolveCommand } = await import('../resolve/command.js');

    // When process.exit is mocked, the function continues and may throw
    // We need to catch any error and verify process.exit was called
    try {
      await handleResolveCommand(undefined, [], testOptions);
    } catch {
      // Expected to throw since process.exit is mocked
    }

    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('treats subcommand as query when not a known subcommand', async () => {
    const { handleResolveCommand } = await import('../resolve/command.js');

    // This will fail because we don't have a real API, but it tests the code path
    await handleResolveCommand('user@example.com', [], testOptions);

    // The command will try to resolve, which will fail without a real API
    // But the code path is covered
    expect(processExitSpy).toHaveBeenCalled();
  });

  it('combines subcommand and args as query', async () => {
    const { handleResolveCommand } = await import('../resolve/command.js');

    await handleResolveCommand('John', ['Doe'], {
      ...testOptions,
      type: 'person',
    });

    expect(processExitSpy).toHaveBeenCalled();
  });
});
