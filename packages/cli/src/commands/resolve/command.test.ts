import { describe, it, expect, vi, afterEach } from 'vitest';

import { createTestContext } from '../../context.js';
import { handleResolveCommand } from './command.js';

describe('resolve command routing', () => {
  const mockResolveIdentifier = vi.fn().mockResolvedValue(undefined);
  const mockDetectType = vi.fn().mockResolvedValue(undefined);

  const deps = {
    contextFactory: () => createTestContext(),
    resolveIdentifier: mockResolveIdentifier,
    detectType: mockDetectType,
  };

  afterEach(() => {
    vi.restoreAllMocks();
    mockResolveIdentifier.mockClear();
    mockDetectType.mockClear();
  });

  it('routes "detect" subcommand to detectType', async () => {
    await handleResolveCommand('detect', ['test@example.com'], { format: 'json' }, deps);

    expect(mockDetectType).toHaveBeenCalledWith(['test@example.com'], expect.anything());
  });

  it('routes query to resolveIdentifier', async () => {
    await handleResolveCommand('test@example.com', [], { format: 'json' }, deps);

    expect(mockResolveIdentifier).toHaveBeenCalledWith(
      ['test@example.com'],
      expect.anything(),
    );
  });

  it('combines subcommand and args as query for resolveIdentifier', async () => {
    await handleResolveCommand('john', ['doe'], { format: 'json' }, deps);

    expect(mockResolveIdentifier).toHaveBeenCalledWith(['john', 'doe'], expect.anything());
  });

  it('exits with error when no query provided', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await handleResolveCommand(undefined, [], { format: 'json' }, deps);

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Query argument is required'),
    );
  });
});
