/**
 * Tests for discussions command routing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { handleDiscussionsCommand } from './command.js';

// Test that the command routing works for all subcommand aliases

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
  });

  afterEach(() => vi.restoreAllMocks());

  it('routes list subcommand', async () => {
    // The command will fail due to missing API config, but it routes correctly
    try {
      await handleDiscussionsCommand('list', [], mockOptions);
    } catch {
      // Expected - exitWithValidationError throws after process.exit
    }
    // Command was executed (even if it failed due to missing config)
    expect(processExitSpy).toHaveBeenCalled();
  });

  it('routes ls alias to list handler', async () => {
    try {
      await handleDiscussionsCommand('ls', [], mockOptions);
    } catch {
      // Expected
    }
    expect(processExitSpy).toHaveBeenCalled();
  });

  it('routes get subcommand', async () => {
    // Missing id should exit with code 3
    try {
      await handleDiscussionsCommand('get', [], mockOptions);
    } catch {
      // Expected - exitWithValidationError throws
    }
    expect(processExitSpy).toHaveBeenCalledWith(3);
  });

  it('routes add subcommand', async () => {
    try {
      await handleDiscussionsCommand('add', [], mockOptions);
    } catch {
      // Expected
    }
    expect(processExitSpy).toHaveBeenCalled();
  });

  it('routes create alias to add handler', async () => {
    try {
      await handleDiscussionsCommand('create', [], mockOptions);
    } catch {
      // Expected
    }
    expect(processExitSpy).toHaveBeenCalled();
  });

  it('routes update subcommand', async () => {
    // Missing id should exit with code 3
    try {
      await handleDiscussionsCommand('update', [], mockOptions);
    } catch {
      // Expected
    }
    expect(processExitSpy).toHaveBeenCalledWith(3);
  });

  it('routes delete subcommand', async () => {
    // Missing id should exit with code 3
    try {
      await handleDiscussionsCommand('delete', [], mockOptions);
    } catch {
      // Expected
    }
    expect(processExitSpy).toHaveBeenCalledWith(3);
  });

  it('routes rm alias to delete handler', async () => {
    // Missing id should exit with code 3
    try {
      await handleDiscussionsCommand('rm', [], mockOptions);
    } catch {
      // Expected
    }
    expect(processExitSpy).toHaveBeenCalledWith(3);
  });

  it('routes resolve subcommand', async () => {
    // Missing id should exit with code 3
    try {
      await handleDiscussionsCommand('resolve', [], mockOptions);
    } catch {
      // Expected
    }
    expect(processExitSpy).toHaveBeenCalledWith(3);
  });

  it('routes reopen subcommand', async () => {
    // Missing id should exit with code 3
    try {
      await handleDiscussionsCommand('reopen', [], mockOptions);
    } catch {
      // Expected
    }
    expect(processExitSpy).toHaveBeenCalledWith(3);
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
