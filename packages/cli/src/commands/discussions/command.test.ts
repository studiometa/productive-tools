/**
 * Tests for discussions command routing
 *
 * Note: These tests mock the handlers to test the switch case routing.
 * Handler-level tests are in discussions.test.ts which tests handlers directly with mock API.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { handleDiscussionsCommand } from './command.js';

// Mock the handlers module for command routing tests
vi.mock('./handlers.js', () => ({
  discussionsList: vi.fn().mockResolvedValue(undefined),
  discussionsGet: vi.fn().mockResolvedValue(undefined),
  discussionsAdd: vi.fn().mockResolvedValue(undefined),
  discussionsUpdate: vi.fn().mockResolvedValue(undefined),
  discussionsDelete: vi.fn().mockResolvedValue(undefined),
  discussionsResolve: vi.fn().mockResolvedValue(undefined),
  discussionsReopen: vi.fn().mockResolvedValue(undefined),
}));

describe('handleDiscussionsCommand routing', () => {
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
    await handleDiscussionsCommand('list', [], mockOptions);
    const { discussionsList } = await import('./handlers.js');
    expect(discussionsList).toHaveBeenCalled();
  });

  it('routes ls alias to list handler', async () => {
    await handleDiscussionsCommand('ls', [], mockOptions);
    const { discussionsList } = await import('./handlers.js');
    expect(discussionsList).toHaveBeenCalled();
  });

  it('routes get subcommand', async () => {
    await handleDiscussionsCommand('get', ['123'], mockOptions);
    const { discussionsGet } = await import('./handlers.js');
    expect(discussionsGet).toHaveBeenCalled();
  });

  it('routes add subcommand', async () => {
    await handleDiscussionsCommand('add', [], mockOptions);
    const { discussionsAdd } = await import('./handlers.js');
    expect(discussionsAdd).toHaveBeenCalled();
  });

  it('routes create alias to add handler', async () => {
    await handleDiscussionsCommand('create', [], mockOptions);
    const { discussionsAdd } = await import('./handlers.js');
    expect(discussionsAdd).toHaveBeenCalled();
  });

  it('routes update subcommand', async () => {
    await handleDiscussionsCommand('update', ['123'], mockOptions);
    const { discussionsUpdate } = await import('./handlers.js');
    expect(discussionsUpdate).toHaveBeenCalled();
  });

  it('routes delete subcommand', async () => {
    await handleDiscussionsCommand('delete', ['123'], mockOptions);
    const { discussionsDelete } = await import('./handlers.js');
    expect(discussionsDelete).toHaveBeenCalled();
  });

  it('routes rm alias to delete handler', async () => {
    await handleDiscussionsCommand('rm', ['123'], mockOptions);
    const { discussionsDelete } = await import('./handlers.js');
    expect(discussionsDelete).toHaveBeenCalled();
  });

  it('routes resolve subcommand', async () => {
    await handleDiscussionsCommand('resolve', ['123'], mockOptions);
    const { discussionsResolve } = await import('./handlers.js');
    expect(discussionsResolve).toHaveBeenCalled();
  });

  it('routes reopen subcommand', async () => {
    await handleDiscussionsCommand('reopen', ['123'], mockOptions);
    const { discussionsReopen } = await import('./handlers.js');
    expect(discussionsReopen).toHaveBeenCalled();
  });

  it('exits with error for unknown subcommand', async () => {
    await handleDiscussionsCommand('unknown', [], mockOptions);
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with error for another invalid subcommand', async () => {
    await handleDiscussionsCommand('invalid', [], mockOptions);
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
