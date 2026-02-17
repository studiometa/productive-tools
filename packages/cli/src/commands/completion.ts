/**
 * Shell completion installation command
 */

import { existsSync, mkdirSync, writeFileSync, chmodSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { colors } from '../utils/colors.js';

const BASH_COMPLETION = `#!/usr/bin/env bash

_productive_completions() {
  local cur prev commands subcommands options

  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"

  # Main commands
  commands="config projects p time t tasks people services svc cache api completion help"

  # Subcommands for each command
  local config_cmds="set get validate clear"
  local projects_cmds="list ls get"
  local time_cmds="list ls get add update delete"
  local tasks_cmds="list ls get"
  local people_cmds="list ls get"
  local services_cmds="list ls"
  local cache_cmds="status clear"
  local completion_cmds="bash zsh fish"

  # Global options
  options="--format --no-color --no-cache --refresh --page --size --sort --help --version --token --api-token --org-id --organization-id --user-id --base-url"

  # Format options
  local formats="json human csv table"

  # Helper to get dynamic completions
  _get_completions() {
    local type=\$1
    productive __completion_helper "\${type}" 2>/dev/null | cut -d: -f2
  }

  # Completion logic
  case "\${COMP_CWORD}" in
    1)
      # Complete main commands
      COMPREPLY=( \$(compgen -W "\${commands}" -- "\${cur}") )
      ;;
    2)
      # Complete subcommands based on main command
      case "\${prev}" in
        config)
          COMPREPLY=( \$(compgen -W "\${config_cmds}" -- "\${cur}") )
          ;;
        projects|p)
          COMPREPLY=( \$(compgen -W "\${projects_cmds}" -- "\${cur}") )
          ;;
        time|t)
          COMPREPLY=( \$(compgen -W "\${time_cmds}" -- "\${cur}") )
          ;;
        tasks)
          COMPREPLY=( \$(compgen -W "\${tasks_cmds}" -- "\${cur}") )
          ;;
        people)
          COMPREPLY=( \$(compgen -W "\${people_cmds}" -- "\${cur}") )
          ;;
        services|svc)
          COMPREPLY=( \$(compgen -W "\${services_cmds}" -- "\${cur}") )
          ;;
        cache)
          COMPREPLY=( \$(compgen -W "\${cache_cmds}" -- "\${cur}") )
          ;;
        completion)
          COMPREPLY=( \$(compgen -W "\${completion_cmds}" -- "\${cur}") )
          ;;
        *)
          COMPREPLY=( \$(compgen -W "\${options}" -- "\${cur}") )
          ;;
      esac
      ;;
    *)
      # Complete options and their values
      case "\${prev}" in
        --format|-f)
          COMPREPLY=( \$(compgen -W "\${formats}" -- "\${cur}") )
          ;;
        set)
          # Complete config keys for 'config set'
          local keys=\$(_get_completions "config-keys")
          COMPREPLY=( \$(compgen -W "\${keys}" -- "\${cur}") )
          ;;
        get)
          # Check if we're in 'config get' context
          if [[ "\${COMP_WORDS[1]}" == "config" ]]; then
            local keys=\$(_get_completions "config-keys")
            COMPREPLY=( \$(compgen -W "\${keys}" -- "\${cur}") )
          else
            # For other 'get' commands, try to complete IDs from projects
            local ids=\$(_get_completions "projects")
            COMPREPLY=( \$(compgen -W "\${ids}" -- "\${cur}") )
          fi
          ;;
        --project)
          # Complete project names
          local projects=\$(_get_completions "projects")
          COMPREPLY=( \$(compgen -W "\${projects}" -- "\${cur}") )
          ;;
        --service)
          # Complete service names
          local services=\$(_get_completions "services")
          COMPREPLY=( \$(compgen -W "\${services}" -- "\${cur}") )
          ;;
        --assignee|--person)
          # Complete person names
          local people=\$(_get_completions "people")
          COMPREPLY=( \$(compgen -W "\${people}" -- "\${cur}") )
          ;;
        --token|--api-token|--org-id|--organization-id|--user-id|--base-url|--page|--size|--sort|clear)
          # No completion for values
          COMPREPLY=()
          ;;
        *)
          COMPREPLY=( \$(compgen -W "\${options}" -- "\${cur}") )
          ;;
      esac
      ;;
  esac

  return 0
}

complete -F _productive_completions productive
`;

const ZSH_COMPLETION = `#compdef productive

_productive() {
  local line state

  # Helper to get dynamic completions
  _get_productive_completions() {
    local type=$1
    productive __completion_helper "$type" 2>/dev/null | while IFS=: read -r id name; do
      echo "$name"
    done
  }

  _arguments -C \\
    '1: :->command' \\
    '2: :->subcommand' \\
    '*: :->args'

  case $state in
    command)
      local -a commands
      commands=(
        'config:Manage CLI configuration'
        'projects:Manage projects'
        'p:Manage projects (alias)'
        'time:Manage time entries'
        't:Manage time entries (alias)'
        'tasks:Manage tasks'
        'people:Manage people'
        'services:Manage services'
        'svc:Manage services (alias)'
        'cache:Manage CLI cache'
        'api:Make custom API requests'
        'completion:Generate shell completion script'
        'help:Show help'
      )
      _describe 'command' commands
      ;;
    subcommand)
      case $line[1] in
        config)
          local -a config_cmds
          config_cmds=(
            'set:Set configuration value'
            'get:Get configuration value(s)'
            'validate:Validate configuration'
            'clear:Clear all configuration'
          )
          _describe 'config command' config_cmds
          ;;
        projects|p)
          local -a projects_cmds
          projects_cmds=(
            'list:List projects'
            'ls:List projects (alias)'
            'get:Get project details'
          )
          _describe 'projects command' projects_cmds
          ;;
        time|t)
          local -a time_cmds
          time_cmds=(
            'list:List time entries'
            'ls:List time entries (alias)'
            'get:Get time entry details'
            'add:Create time entry'
            'update:Update time entry'
            'delete:Delete time entry'
          )
          _describe 'time command' time_cmds
          ;;
        tasks)
          local -a tasks_cmds
          tasks_cmds=(
            'list:List tasks'
            'ls:List tasks (alias)'
            'get:Get task details'
          )
          _describe 'tasks command' tasks_cmds
          ;;
        people)
          local -a people_cmds
          people_cmds=(
            'list:List people'
            'ls:List people (alias)'
            'get:Get person details'
          )
          _describe 'people command' people_cmds
          ;;
        services|svc)
          local -a services_cmds
          services_cmds=(
            'list:List services'
            'ls:List services (alias)'
          )
          _describe 'services command' services_cmds
          ;;
        cache)
          local -a cache_cmds
          cache_cmds=(
            'status:Show cache statistics'
            'clear:Clear cached data'
          )
          _describe 'cache command' cache_cmds
          ;;
        completion)
          local -a completion_cmds
          completion_cmds=(
            'bash:Generate Bash completion script'
            'zsh:Generate Zsh completion script'
            'fish:Generate Fish completion script'
          )
          _describe 'completion shell' completion_cmds
          ;;
      esac
      ;;
    args)
      # Dynamic completions for config keys
      local -a config_keys
      config_keys=(\${(f)"\$(_get_productive_completions config-keys)"})

      # Dynamic completions for projects
      local -a projects
      projects=(\${(f)"\$(_get_productive_completions projects)"})

      # Dynamic completions for services
      local -a services
      services=(\${(f)"\$(_get_productive_completions services)"})

      # Dynamic completions for people
      local -a people
      people=(\${(f)"\$(_get_productive_completions people)"})

      _arguments \\
        '(-f --format)'{-f,--format}'[Output format]:format:(json human csv table)' \\
        '--no-color[Disable colored output]' \\
        '--no-cache[Bypass cache for this request]' \\
        '--refresh[Force refresh cached data]' \\
        '(-p --page)'{-p,--page}'[Page number]:page number:' \\
        '(-s --size)'{-s,--size}'[Page size]:page size:' \\
        '--sort[Sort by field]:field:' \\
        '--project[Project]:project:(\$projects)' \\
        '--service[Service]:service:(\$services)' \\
        '--assignee[Assignee]:assignee:(\$people)' \\
        '--person[Person]:person:(\$people)' \\
        '(-h --help)'{-h,--help}'[Show help]' \\
        '(-v --version)'{-v,--version}'[Show version]' \\
        '--token[API token]:token:' \\
        '--api-token[API token]:token:' \\
        '--org-id[Organization ID]:org id:' \\
        '--organization-id[Organization ID]:org id:' \\
        '--user-id[User ID]:user id:' \\
        '--base-url[API base URL]:url:_urls' \\
        '*::arg:->arg_completion'

      # Handle positional arguments based on context
      case $line[2] in
        set)
          if [[ $line[1] == "config" ]]; then
            _describe 'config key' config_keys
          fi
          ;;
        get)
          if [[ $line[1] == "config" ]]; then
            _describe 'config key' config_keys
          fi
          ;;
      esac
      ;;
  esac
}

_productive "$@"
`;

const FISH_COMPLETION = `# Completions for productive CLI

# Helper functions for dynamic completions
function __productive_get_projects
    productive __completion_helper projects 2>/dev/null | string split0 | while read -d : id name
        echo "$name"
    end
end

function __productive_get_services
    productive __completion_helper services 2>/dev/null | string split0 | while read -d : id name
        echo "$name"
    end
end

function __productive_get_people
    productive __completion_helper people 2>/dev/null | string split0 | while read -d : id name
        echo "$name"
    end
end

function __productive_get_config_keys
    productive __completion_helper config-keys 2>/dev/null
end

# Main commands
complete -c productive -f -n "__fish_use_subcommand" -a "config" -d "Manage CLI configuration"
complete -c productive -f -n "__fish_use_subcommand" -a "projects" -d "Manage projects"
complete -c productive -f -n "__fish_use_subcommand" -a "p" -d "Manage projects (alias)"
complete -c productive -f -n "__fish_use_subcommand" -a "time" -d "Manage time entries"
complete -c productive -f -n "__fish_use_subcommand" -a "t" -d "Manage time entries (alias)"
complete -c productive -f -n "__fish_use_subcommand" -a "tasks" -d "Manage tasks"
complete -c productive -f -n "__fish_use_subcommand" -a "people" -d "Manage people"
complete -c productive -f -n "__fish_use_subcommand" -a "services" -d "Manage services"
complete -c productive -f -n "__fish_use_subcommand" -a "svc" -d "Manage services (alias)"
complete -c productive -f -n "__fish_use_subcommand" -a "cache" -d "Manage CLI cache"
complete -c productive -f -n "__fish_use_subcommand" -a "api" -d "Make custom API requests"
complete -c productive -f -n "__fish_use_subcommand" -a "completion" -d "Generate shell completion script"
complete -c productive -f -n "__fish_use_subcommand" -a "help" -d "Show help"

# Config subcommands
complete -c productive -f -n "__fish_seen_subcommand_from config" -a "set" -d "Set configuration value"
complete -c productive -f -n "__fish_seen_subcommand_from config" -a "get" -d "Get configuration value(s)"
complete -c productive -f -n "__fish_seen_subcommand_from config" -a "validate" -d "Validate configuration"
complete -c productive -f -n "__fish_seen_subcommand_from config" -a "clear" -d "Clear all configuration"

# Projects subcommands
complete -c productive -f -n "__fish_seen_subcommand_from projects p" -a "list" -d "List projects"
complete -c productive -f -n "__fish_seen_subcommand_from projects p" -a "ls" -d "List projects (alias)"
complete -c productive -f -n "__fish_seen_subcommand_from projects p" -a "get" -d "Get project details"

# Time subcommands
complete -c productive -f -n "__fish_seen_subcommand_from time t" -a "list" -d "List time entries"
complete -c productive -f -n "__fish_seen_subcommand_from time t" -a "ls" -d "List time entries (alias)"
complete -c productive -f -n "__fish_seen_subcommand_from time t" -a "get" -d "Get time entry details"
complete -c productive -f -n "__fish_seen_subcommand_from time t" -a "add" -d "Create time entry"
complete -c productive -f -n "__fish_seen_subcommand_from time t" -a "update" -d "Update time entry"
complete -c productive -f -n "__fish_seen_subcommand_from time t" -a "delete" -d "Delete time entry"

# Tasks subcommands
complete -c productive -f -n "__fish_seen_subcommand_from tasks" -a "list" -d "List tasks"
complete -c productive -f -n "__fish_seen_subcommand_from tasks" -a "ls" -d "List tasks (alias)"
complete -c productive -f -n "__fish_seen_subcommand_from tasks" -a "get" -d "Get task details"

# People subcommands
complete -c productive -f -n "__fish_seen_subcommand_from people" -a "list" -d "List people"
complete -c productive -f -n "__fish_seen_subcommand_from people" -a "ls" -d "List people (alias)"
complete -c productive -f -n "__fish_seen_subcommand_from people" -a "get" -d "Get person details"

# Services subcommands
complete -c productive -f -n "__fish_seen_subcommand_from services svc" -a "list" -d "List services"
complete -c productive -f -n "__fish_seen_subcommand_from services svc" -a "ls" -d "List services (alias)"

# Cache subcommands
complete -c productive -f -n "__fish_seen_subcommand_from cache" -a "status" -d "Show cache statistics"
complete -c productive -f -n "__fish_seen_subcommand_from cache" -a "clear" -d "Clear cached data"

# Completion subcommands
complete -c productive -f -n "__fish_seen_subcommand_from completion" -a "bash" -d "Install Bash completion"
complete -c productive -f -n "__fish_seen_subcommand_from completion" -a "zsh" -d "Install Zsh completion"
complete -c productive -f -n "__fish_seen_subcommand_from completion" -a "fish" -d "Install Fish completion"

# Config key completions for 'config set' and 'config get'
complete -c productive -f -n "__fish_seen_subcommand_from config; and __fish_seen_subcommand_from set get" -a "(__productive_get_config_keys)"

# Global options
complete -c productive -s f -l format -d "Output format" -xa "json human csv table"
complete -c productive -l no-color -d "Disable colored output"
complete -c productive -l no-cache -d "Bypass cache for this request"
complete -c productive -l refresh -d "Force refresh cached data"
complete -c productive -s p -l page -d "Page number" -r
complete -c productive -s s -l size -d "Page size" -r
complete -c productive -l sort -d "Sort by field" -r
complete -c productive -l project -d "Project" -xa "(__productive_get_projects)"
complete -c productive -l service -d "Service" -xa "(__productive_get_services)"
complete -c productive -l assignee -d "Assignee" -xa "(__productive_get_people)"
complete -c productive -l person -d "Person" -xa "(__productive_get_people)"
complete -c productive -s h -l help -d "Show help"
complete -c productive -s v -l version -d "Show version"
complete -c productive -l token -d "API token" -r
complete -c productive -l api-token -d "API token" -r
complete -c productive -l org-id -d "Organization ID" -r
complete -c productive -l organization-id -d "Organization ID" -r
complete -c productive -l user-id -d "User ID" -r
complete -c productive -l base-url -d "API base URL" -r
`;

/**
 * Get the appropriate completion directory for the shell
 */
function getCompletionPath(shell: string): string | null {
  const home = homedir();

  switch (shell) {
    case 'bash': {
      // Check common bash completion directories
      const paths = [
        '/usr/local/etc/bash_completion.d',
        '/etc/bash_completion.d',
        join(home, '.local/share/bash-completion/completions'),
        join(home, '.bash_completion.d'),
      ];

      // Return first writable directory, or create user directory
      for (const dir of paths) {
        if (existsSync(dir)) {
          try {
            // Test if directory is writable
            const testFile = join(dir, '.write-test');
            writeFileSync(testFile, '');
            require('fs').unlinkSync(testFile);
            return join(dir, 'productive');
          } catch {
            continue;
          }
        }
      }

      // Create user-local directory if none are writable
      const userPath = join(home, '.local/share/bash-completion/completions');
      mkdirSync(userPath, { recursive: true });
      return join(userPath, 'productive');
    }

    case 'zsh': {
      // Check common zsh completion directories
      const paths = [
        join(home, '.local/share/zsh/site-functions'),
        join(home, '.zsh/completions'),
        '/usr/local/share/zsh/site-functions',
      ];

      // Return first writable directory, or create user directory
      for (const dir of paths) {
        if (existsSync(dir)) {
          try {
            const testFile = join(dir, '.write-test');
            writeFileSync(testFile, '');
            require('fs').unlinkSync(testFile);
            return join(dir, '_productive');
          } catch {
            continue;
          }
        }
      }

      // Create user-local directory if none are writable
      const userPath = join(home, '.local/share/zsh/site-functions');
      mkdirSync(userPath, { recursive: true });
      return join(userPath, '_productive');
    }

    case 'fish': {
      // Fish uses XDG directories
      const configHome = process.env.XDG_CONFIG_HOME || join(home, '.config');
      const fishPath = join(configHome, 'fish/completions');
      mkdirSync(fishPath, { recursive: true });
      return join(fishPath, 'productive.fish');
    }

    default:
      return null;
  }
}

export function showCompletionHelp(): void {
  console.log(`
${colors.bold('productive completion')} - Install shell completion

${colors.bold('USAGE:')}
  productive completion <shell> [--print]

${colors.bold('SHELLS:')}
  bash                Install Bash completion
  zsh                 Install Zsh completion
  fish                Install Fish completion

${colors.bold('OPTIONS:')}
  --print             Print completion script instead of installing

${colors.bold('INSTALLATION:')}
  The completion script is automatically installed to the appropriate
  standard directory for your shell. After installation, restart your
  shell to activate completions.

  ${colors.bold('Bash:')}
    productive completion bash
    # Installs to: ~/.local/share/bash-completion/completions/productive
    # Then run: exec bash

  ${colors.bold('Zsh:')}
    productive completion zsh
    # Installs to: ~/.local/share/zsh/site-functions/_productive
    # Then run: exec zsh
    # Note: Ensure fpath includes the installation directory

  ${colors.bold('Fish:')}
    productive completion fish
    # Installs to: ~/.config/fish/completions/productive.fish
    # Completions are loaded automatically

${colors.bold('PRINT ONLY:')}
  Use --print to output the script without installing:

  productive completion bash --print > my-completion.sh
  productive completion zsh --print | less

${colors.bold('TROUBLESHOOTING:')}
  ${colors.bold('Bash:')} If completions don't work, ensure bash-completion is installed
  and add this to your ~/.bashrc if not already present:

    if [ -f ~/.local/share/bash-completion/completions/productive ]; then
      . ~/.local/share/bash-completion/completions/productive
    fi

  ${colors.bold('Zsh:')} If completions don't work, ensure the directory is in fpath.
  Add this to your ~/.zshrc before compinit:

    fpath=(~/.local/share/zsh/site-functions $fpath)
`);
}

export function handleCompletionCommand(
  args: string[],
  options: Record<string, unknown> = {},
): void {
  const shell = args[0];
  const shouldPrint = options.print !== undefined || args.includes('--print');

  if (!shell || shell === 'help' || shell === '--help' || shell === '-h') {
    showCompletionHelp();
    return;
  }

  const shellLower = shell.toLowerCase();

  // Get completion script
  let script: string;
  switch (shellLower) {
    case 'bash':
      script = BASH_COMPLETION;
      break;
    case 'zsh':
      script = ZSH_COMPLETION;
      break;
    case 'fish':
      script = FISH_COMPLETION;
      break;
    default:
      console.error(
        `${colors.red('✗')} Unknown shell: ${shell}. Supported shells: bash, zsh, fish`,
      );
      console.error(`Run ${colors.cyan('productive completion help')} for usage information.`);
      process.exit(1);
  }

  // If --print flag, just output the script
  if (shouldPrint) {
    console.log(script);
    return;
  }

  // Otherwise, install to appropriate directory
  const installPath = getCompletionPath(shellLower);

  if (!installPath) {
    console.error(`${colors.red('✗')} Could not determine installation path for ${shell}`);
    process.exit(1);
  }

  try {
    writeFileSync(installPath, script, 'utf8');

    // Make executable for bash
    if (shellLower === 'bash') {
      chmodSync(installPath, 0o755);
    }

    console.log(
      `${colors.green('✓')} Installed ${shell} completion to ${colors.cyan(installPath)}`,
    );
    console.log();
    console.log(`${colors.bold('Next steps:')}`);

    switch (shellLower) {
      case 'bash':
        console.log(`  1. Restart your shell: ${colors.cyan('exec bash')}`);
        console.log(`  2. Or source your profile: ${colors.cyan('source ~/.bashrc')}`);
        break;
      case 'zsh':
        console.log(
          `  1. Ensure ${colors.cyan('~/.local/share/zsh/site-functions')} is in your $fpath`,
        );
        console.log(`  2. Restart your shell: ${colors.cyan('exec zsh')}`);
        console.log(`  3. Or run: ${colors.cyan('autoload -U compinit && compinit')}`);
        break;
      case 'fish':
        console.log(`  Completions are loaded automatically. Restart fish if needed.`);
        break;
    }
  } catch (error) {
    console.error(
      `${colors.red('✗')} Failed to install completion: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}
