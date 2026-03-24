import { describe, it, expect, vi, afterEach } from 'vitest';

import { createTestContext } from '../../context.js';
import { createCommandRouter } from '../../utils/command-router.js';
import { companiesCommandConfig } from './command.js';
import { companiesList, companiesGet, companiesAdd, companiesUpdate } from './handlers.js';

describe('companies command wiring', () => {
  it('uses "companies" as resource name', () => {
    expect(companiesCommandConfig.resource).toBe('companies');
  });

  it('wires list and ls to companiesList', () => {
    expect(companiesCommandConfig.handlers.list).toBe(companiesList);
    expect(companiesCommandConfig.handlers.ls).toBe(companiesList);
  });

  it('wires get to companiesGet as args handler', () => {
    expect(companiesCommandConfig.handlers.get).toEqual([companiesGet, 'args']);
  });

  it('wires add and create to companiesAdd', () => {
    expect(companiesCommandConfig.handlers.add).toBe(companiesAdd);
    expect(companiesCommandConfig.handlers.create).toBe(companiesAdd);
  });

  it('wires update to companiesUpdate as args handler', () => {
    expect(companiesCommandConfig.handlers.update).toEqual([companiesUpdate, 'args']);
  });
});

describe('companies command routing', () => {
  const mockCompaniesList = vi.fn().mockResolvedValue(undefined);
  const mockCompaniesGet = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);
  const mockCompaniesAdd = vi.fn().mockResolvedValue(undefined);
  const mockCompaniesUpdate = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);

  const router = createCommandRouter({
    resource: 'companies',
    handlers: {
      list: mockCompaniesList,
      ls: mockCompaniesList,
      get: [mockCompaniesGet, 'args'],
      add: mockCompaniesAdd,
      create: mockCompaniesAdd,
      update: [mockCompaniesUpdate, 'args'],
    },
    contextFactory: (options) => createTestContext({ options }),
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockCompaniesList.mockClear();
    mockCompaniesGet.mockClear();
    mockCompaniesAdd.mockClear();
    mockCompaniesUpdate.mockClear();
  });

  it('routes "list" subcommand to companiesList handler', async () => {
    await router('list', [], { format: 'json' });
    expect(mockCompaniesList).toHaveBeenCalled();
  });

  it('routes "ls" alias to companiesList handler', async () => {
    await router('ls', [], { format: 'json' });
    expect(mockCompaniesList).toHaveBeenCalled();
  });

  it('routes "get" subcommand to companiesGet handler', async () => {
    await router('get', ['123'], { format: 'json' });
    expect(mockCompaniesGet).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('routes "add" subcommand to companiesAdd handler', async () => {
    await router('add', [], { format: 'json' });
    expect(mockCompaniesAdd).toHaveBeenCalled();
  });

  it('routes "create" alias to companiesAdd handler', async () => {
    await router('create', [], { format: 'json' });
    expect(mockCompaniesAdd).toHaveBeenCalled();
  });

  it('routes "update" subcommand to companiesUpdate handler', async () => {
    await router('update', ['123'], { format: 'json' });
    expect(mockCompaniesUpdate).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('exits with error for unknown subcommand', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await router('unknown', [], { format: 'json' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown companies subcommand: unknown'),
    );
  });
});
