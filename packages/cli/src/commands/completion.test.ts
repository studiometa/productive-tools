/**
 * Tests for completion command
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { handleCompletionCommand, showCompletionHelp } from './completion.js';

// Mock node:fs module
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  chmodSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

// Mock node:os module
vi.mock('node:os', () => ({
  homedir: vi.fn().mockReturnValue('/mock/home'),
}));

// Mock colors
vi.mock('../utils/colors.js', () => ({
  colors: {
    red: (str: string) => str,
    green: (str: string) => str,
    cyan: (str: string) => str,
    bold: (str: string) => str,
  },
}));

describe('completion command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    const fs = await import('node:fs');
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.mkdirSync).mockImplementation(() => '');
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    vi.mocked(fs.chmodSync).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('showCompletionHelp', () => {
    it('should display help information', () => {
      showCompletionHelp();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('productive completion'));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Install shell completion'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('bash'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('zsh'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('fish'));
    });
  });

  describe('handleCompletionCommand', () => {
    it('should show help when no shell specified', () => {
      handleCompletionCommand([]);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('productive completion'));
    });

    it('should show help when help requested', () => {
      handleCompletionCommand(['help']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('productive completion'));
    });

    it('should print bash completion script when --print flag used', () => {
      handleCompletionCommand(['bash'], { print: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('_productive_completions'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'config projects p time t tasks people services svc companies comments attachments timers deals bookings pages discussions activities custom-fields reports resolve cache api completion help',
        ),
      );
    });

    it('should print zsh completion script when --print flag used', () => {
      handleCompletionCommand(['zsh'], { print: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('#compdef productive'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('_productive'));
    });

    it('should print fish completion script when --print flag used', () => {
      handleCompletionCommand(['fish'], { print: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('complete -c productive'));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"Manage CLI configuration"'),
      );
    });

    it('should exit with error for unknown shell', () => {
      handleCompletionCommand(['unknown']);

      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown shell: unknown'),
      );
    });

    it('should install bash completion to user directory', async () => {
      const fs = await import('node:fs');
      vi.mocked(fs.existsSync).mockReturnValue(false); // No system dirs exist

      // Clear all previous calls
      vi.mocked(fs.mkdirSync).mockClear();
      vi.mocked(fs.writeFileSync).mockClear();
      vi.mocked(fs.chmodSync).mockClear();

      handleCompletionCommand(['bash']);

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        '/mock/home/.local/share/bash-completion/completions',
        { recursive: true },
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/mock/home/.local/share/bash-completion/completions/productive',
        expect.stringContaining('_productive_completions'),
        'utf8',
      );
      expect(fs.chmodSync).toHaveBeenCalledWith(
        '/mock/home/.local/share/bash-completion/completions/productive',
        0o755,
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Installed bash completion'),
      );
    });

    it('should install zsh completion to user directory', async () => {
      const fs = await import('node:fs');
      vi.mocked(fs.existsSync).mockReturnValue(false); // No system dirs exist

      // Clear all previous calls
      vi.mocked(fs.mkdirSync).mockClear();
      vi.mocked(fs.writeFileSync).mockClear();

      handleCompletionCommand(['zsh']);

      expect(fs.mkdirSync).toHaveBeenCalledWith('/mock/home/.local/share/zsh/site-functions', {
        recursive: true,
      });
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/mock/home/.local/share/zsh/site-functions/_productive',
        expect.stringContaining('#compdef productive'),
        'utf8',
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Installed zsh completion'),
      );
    });

    it('should install fish completion to XDG config directory', async () => {
      const fs = await import('node:fs');

      // Clear all previous calls and mock XDG_CONFIG_HOME to be unset
      vi.mocked(fs.mkdirSync).mockClear();
      vi.mocked(fs.writeFileSync).mockClear();
      const originalXDG = process.env.XDG_CONFIG_HOME;
      delete process.env.XDG_CONFIG_HOME;

      handleCompletionCommand(['fish']);

      expect(fs.mkdirSync).toHaveBeenCalledWith('/mock/home/.config/fish/completions', {
        recursive: true,
      });
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/mock/home/.config/fish/completions/productive.fish',
        expect.stringContaining('complete -c productive'),
        'utf8',
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Installed fish completion'),
      );

      // Restore original env var
      if (originalXDG) {
        process.env.XDG_CONFIG_HOME = originalXDG;
      }
    });

    it('should handle write errors gracefully', async () => {
      const fs = await import('node:fs');

      // Clear all previous calls and setup error
      vi.mocked(fs.mkdirSync).mockClear();
      vi.mocked(fs.writeFileSync).mockClear();
      vi.mocked(fs.writeFileSync).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      handleCompletionCommand(['bash']);

      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to install completion'),
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Permission denied'));
    });

    it('should include all current resources in bash completion', () => {
      handleCompletionCommand(['bash'], { print: true });

      const expectedResources = [
        'config',
        'projects',
        'p',
        'time',
        't',
        'tasks',
        'people',
        'services',
        'svc',
        'companies',
        'comments',
        'attachments',
        'timers',
        'deals',
        'bookings',
        'pages',
        'discussions',
        'activities',
        'custom-fields',
        'reports',
        'resolve',
        'cache',
        'api',
        'completion',
        'help',
      ];

      const output = consoleLogSpy.mock.calls.map((call) => call[0]).join('\\n');
      expectedResources.forEach((resource) => {
        expect(output).toContain(resource);
      });
    });

    it('should include all current subcommands in completion', () => {
      handleCompletionCommand(['bash'], { print: true });

      const output = consoleLogSpy.mock.calls.map((call) => call[0]).join('\\n');

      // Check for key subcommands
      expect(output).toContain('local tasks_cmds="list ls get add create update"');
      expect(output).toContain(
        'local discussions_cmds="list ls get add create update delete rm resolve reopen"',
      );
      expect(output).toContain('local timers_cmds="list ls get start stop"');
      expect(output).toContain('local attachments_cmds="list ls get delete rm"');
      expect(output).toContain('local activities_cmds="list ls"');
      expect(output).toContain('local resolve_cmds="detect"');
    });
  });
});
