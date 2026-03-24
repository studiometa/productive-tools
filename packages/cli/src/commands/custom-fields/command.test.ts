import { describe, it, expect, vi, afterEach } from 'vitest';

import { createTestContext } from '../../context.js';
import { createCommandRouter } from '../../utils/command-router.js';
import { customFieldsCommandConfig } from './command.js';
import { customFieldsGet, customFieldsList } from './handlers.js';

describe('custom-fields command wiring', () => {
  it('uses "custom-fields" as resource name', () => {
    expect(customFieldsCommandConfig.resource).toBe('custom-fields');
  });

  it('wires list and ls to customFieldsList', () => {
    expect(customFieldsCommandConfig.handlers.list).toBe(customFieldsList);
    expect(customFieldsCommandConfig.handlers.ls).toBe(customFieldsList);
  });

  it('wires get to customFieldsGet as args handler', () => {
    expect(customFieldsCommandConfig.handlers.get).toEqual([customFieldsGet, 'args']);
  });
});

describe('custom-fields command routing', () => {
  const mockCustomFieldsList = vi.fn().mockResolvedValue(undefined);
  const mockCustomFieldsGet = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);

  const router = createCommandRouter({
    resource: 'custom-fields',
    handlers: {
      list: mockCustomFieldsList,
      ls: mockCustomFieldsList,
      get: [mockCustomFieldsGet, 'args'],
    },
    contextFactory: (options) => createTestContext({ options }),
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockCustomFieldsList.mockClear();
    mockCustomFieldsGet.mockClear();
  });

  it('routes "list" subcommand to customFieldsList handler', async () => {
    await router('list', [], { format: 'json' });
    expect(mockCustomFieldsList).toHaveBeenCalled();
  });

  it('routes "ls" alias to customFieldsList handler', async () => {
    await router('ls', [], { format: 'json' });
    expect(mockCustomFieldsList).toHaveBeenCalled();
  });

  it('routes "get" subcommand to customFieldsGet handler', async () => {
    await router('get', ['123'], { format: 'json' });
    expect(mockCustomFieldsGet).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('exits with error for unknown subcommand', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await router('unknown', [], { format: 'json' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown custom-fields subcommand: unknown'),
    );
  });
});
