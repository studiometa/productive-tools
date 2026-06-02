import { describe, it, expect, vi, afterEach } from 'vitest';

import { createTestContext } from '../../context.js';
import { createCommandRouter } from '../../utils/command-router.js';
import { servicesCommandConfig } from './command.js';
import { servicesGet, servicesList } from './handlers.js';

describe('services command wiring', () => {
  it('uses "services" as resource name', () => {
    expect(servicesCommandConfig.resource).toBe('services');
  });

  it('wires list and ls to servicesList', () => {
    expect(servicesCommandConfig.handlers.list).toBe(servicesList);
    expect(servicesCommandConfig.handlers.ls).toBe(servicesList);
  });

  it('wires get to servicesGet as args handler', () => {
    expect(servicesCommandConfig.handlers.get).toEqual([servicesGet, 'args']);
  });
});

describe('services command routing', () => {
  const mockServicesList = vi.fn().mockResolvedValue(undefined);
  const mockServicesGet = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);

  const router = createCommandRouter({
    resource: 'services',
    handlers: {
      list: mockServicesList,
      ls: mockServicesList,
      get: [mockServicesGet, 'args'],
    },
    contextFactory: (options) => createTestContext({ options }),
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockServicesList.mockClear();
    mockServicesGet.mockClear();
  });

  it('routes "list" subcommand to servicesList handler', async () => {
    await router('list', [], { format: 'json' });
    expect(mockServicesList).toHaveBeenCalled();
  });

  it('routes "ls" alias to servicesList handler', async () => {
    await router('ls', [], { format: 'json' });
    expect(mockServicesList).toHaveBeenCalled();
  });

  it('routes "get" subcommand to servicesGet handler', async () => {
    await router('get', ['123'], { format: 'json' });
    expect(mockServicesGet).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('exits with error for unknown subcommand', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await router('unknown', [], { format: 'json' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown services subcommand: unknown'),
    );
  });
});
