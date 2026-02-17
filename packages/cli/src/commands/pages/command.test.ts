/**
 * Tests for pages command routing
 *
 * Note: These tests mock the handlers to test the switch case routing.
 * Handler-level tests are in pages.test.ts which tests handlers directly with mock API.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { handlePagesCommand } from './command.js';

// Mock the handlers module for command routing tests
vi.mock('./handlers.js', () => ({
  pagesList: vi.fn().mockResolvedValue(undefined),
  pagesGet: vi.fn().mockResolvedValue(undefined),
  pagesAdd: vi.fn().mockResolvedValue(undefined),
  pagesUpdate: vi.fn().mockResolvedValue(undefined),
  pagesDelete: vi.fn().mockResolvedValue(undefined),
}));

describe('handlePagesCommand routing', () => {
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  const mockOptions = {
    token: 'test-token',
    'org-id': 'test-org',
    format: 'json',
  };

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    vi.clearAllMocks();
  });

  afterEach(() => vi.restoreAllMocks());

  it('routes list subcommand', async () => {
    await handlePagesCommand('list', [], mockOptions);
    const { pagesList } = await import('./handlers.js');
    expect(pagesList).toHaveBeenCalled();
  });

  it('routes ls alias to list handler', async () => {
    await handlePagesCommand('ls', [], mockOptions);
    const { pagesList } = await import('./handlers.js');
    expect(pagesList).toHaveBeenCalled();
  });

  it('routes get subcommand', async () => {
    await handlePagesCommand('get', ['123'], mockOptions);
    const { pagesGet } = await import('./handlers.js');
    expect(pagesGet).toHaveBeenCalled();
  });

  it('routes add subcommand', async () => {
    await handlePagesCommand('add', [], mockOptions);
    const { pagesAdd } = await import('./handlers.js');
    expect(pagesAdd).toHaveBeenCalled();
  });

  it('routes create alias to add handler', async () => {
    await handlePagesCommand('create', [], mockOptions);
    const { pagesAdd } = await import('./handlers.js');
    expect(pagesAdd).toHaveBeenCalled();
  });

  it('routes update subcommand', async () => {
    await handlePagesCommand('update', ['123'], mockOptions);
    const { pagesUpdate } = await import('./handlers.js');
    expect(pagesUpdate).toHaveBeenCalled();
  });

  it('routes delete subcommand', async () => {
    await handlePagesCommand('delete', ['123'], mockOptions);
    const { pagesDelete } = await import('./handlers.js');
    expect(pagesDelete).toHaveBeenCalled();
  });

  it('routes rm alias to delete handler', async () => {
    await handlePagesCommand('rm', ['123'], mockOptions);
    const { pagesDelete } = await import('./handlers.js');
    expect(pagesDelete).toHaveBeenCalled();
  });

  it('exits with error for unknown subcommand', async () => {
    await handlePagesCommand('unknown', [], mockOptions);
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with error for another invalid subcommand', async () => {
    await handlePagesCommand('invalid', [], mockOptions);
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
