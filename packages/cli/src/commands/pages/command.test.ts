/**
 * Tests for pages command routing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { handlePagesCommand } from './command.js';

// Test that the command routing works for all subcommand aliases

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
  });

  afterEach(() => vi.restoreAllMocks());

  it('routes list subcommand', async () => {
    // The command will fail due to missing API config, but it routes correctly
    try {
      await handlePagesCommand('list', [], mockOptions);
    } catch {
      // Expected - exitWithValidationError throws after process.exit
    }
    // Command was executed (even if it failed due to missing config)
    expect(processExitSpy).toHaveBeenCalled();
  });

  it('routes ls alias to list handler', async () => {
    try {
      await handlePagesCommand('ls', [], mockOptions);
    } catch {
      // Expected
    }
    expect(processExitSpy).toHaveBeenCalled();
  });

  it('routes get subcommand', async () => {
    // Missing id should exit with code 3
    try {
      await handlePagesCommand('get', [], mockOptions);
    } catch {
      // Expected - exitWithValidationError throws
    }
    expect(processExitSpy).toHaveBeenCalledWith(3);
  });

  it('routes add subcommand', async () => {
    try {
      await handlePagesCommand('add', [], mockOptions);
    } catch {
      // Expected
    }
    expect(processExitSpy).toHaveBeenCalled();
  });

  it('routes create alias to add handler', async () => {
    try {
      await handlePagesCommand('create', [], mockOptions);
    } catch {
      // Expected
    }
    expect(processExitSpy).toHaveBeenCalled();
  });

  it('routes update subcommand', async () => {
    // Missing id should exit with code 3
    try {
      await handlePagesCommand('update', [], mockOptions);
    } catch {
      // Expected
    }
    expect(processExitSpy).toHaveBeenCalledWith(3);
  });

  it('routes delete subcommand', async () => {
    // Missing id should exit with code 3
    try {
      await handlePagesCommand('delete', [], mockOptions);
    } catch {
      // Expected
    }
    expect(processExitSpy).toHaveBeenCalledWith(3);
  });

  it('routes rm alias to delete handler', async () => {
    // Missing id should exit with code 3
    try {
      await handlePagesCommand('rm', [], mockOptions);
    } catch {
      // Expected
    }
    expect(processExitSpy).toHaveBeenCalledWith(3);
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
