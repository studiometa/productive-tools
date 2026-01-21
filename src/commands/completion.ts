/**
 * Shell completion generation command
 */

import { colors } from "../utils/colors.js";

const BASH_COMPLETION = `#!/usr/bin/env bash

_productive_completions() {
  local cur prev commands subcommands options

  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"

  # Main commands
  commands="config projects p time t tasks people services svc budgets cache api completion help"

  # Subcommands for each command
  local config_cmds="set get validate clear"
  local projects_cmds="list ls get"
  local time_cmds="list ls get add update delete"
  local tasks_cmds="list ls get"
  local people_cmds="list ls get"
  local services_cmds="list ls"
  local budgets_cmds="list ls"
  local cache_cmds="status clear"
  local completion_cmds="bash zsh fish"

  # Global options
  options="--format --no-color --no-cache --refresh --page --size --sort --help --version --token --api-token --org-id --organization-id --user-id --base-url"

  # Format options
  local formats="json human csv table"

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
        budgets)
          COMPREPLY=( \$(compgen -W "\${budgets_cmds}" -- "\${cur}") )
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
        --token|--api-token|--org-id|--organization-id|--user-id|--base-url|--page|--size|--sort|set|get|clear)
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
        'budgets:Manage budgets'
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
        budgets)
          local -a budgets_cmds
          budgets_cmds=(
            'list:List budgets'
            'ls:List budgets (alias)'
          )
          _describe 'budgets command' budgets_cmds
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
      _arguments \\
        '(-f --format)'{-f,--format}'[Output format]:format:(json human csv table)' \\
        '--no-color[Disable colored output]' \\
        '--no-cache[Bypass cache for this request]' \\
        '--refresh[Force refresh cached data]' \\
        '(-p --page)'{-p,--page}'[Page number]:page number:' \\
        '(-s --size)'{-s,--size}'[Page size]:page size:' \\
        '--sort[Sort by field]:field:' \\
        '(-h --help)'{-h,--help}'[Show help]' \\
        '(-v --version)'{-v,--version}'[Show version]' \\
        '--token[API token]:token:' \\
        '--api-token[API token]:token:' \\
        '--org-id[Organization ID]:org id:' \\
        '--organization-id[Organization ID]:org id:' \\
        '--user-id[User ID]:user id:' \\
        '--base-url[API base URL]:url:_urls'
      ;;
  esac
}

_productive "$@"
`;

const FISH_COMPLETION = `# Completions for productive CLI

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
complete -c productive -f -n "__fish_use_subcommand" -a "budgets" -d "Manage budgets"
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

# Budgets subcommands
complete -c productive -f -n "__fish_seen_subcommand_from budgets" -a "list" -d "List budgets"
complete -c productive -f -n "__fish_seen_subcommand_from budgets" -a "ls" -d "List budgets (alias)"

# Cache subcommands
complete -c productive -f -n "__fish_seen_subcommand_from cache" -a "status" -d "Show cache statistics"
complete -c productive -f -n "__fish_seen_subcommand_from cache" -a "clear" -d "Clear cached data"

# Completion subcommands
complete -c productive -f -n "__fish_seen_subcommand_from completion" -a "bash" -d "Generate Bash completion script"
complete -c productive -f -n "__fish_seen_subcommand_from completion" -a "zsh" -d "Generate Zsh completion script"
complete -c productive -f -n "__fish_seen_subcommand_from completion" -a "fish" -d "Generate Fish completion script"

# Global options
complete -c productive -s f -l format -d "Output format" -xa "json human csv table"
complete -c productive -l no-color -d "Disable colored output"
complete -c productive -l no-cache -d "Bypass cache for this request"
complete -c productive -l refresh -d "Force refresh cached data"
complete -c productive -s p -l page -d "Page number" -r
complete -c productive -s s -l size -d "Page size" -r
complete -c productive -l sort -d "Sort by field" -r
complete -c productive -s h -l help -d "Show help"
complete -c productive -s v -l version -d "Show version"
complete -c productive -l token -d "API token" -r
complete -c productive -l api-token -d "API token" -r
complete -c productive -l org-id -d "Organization ID" -r
complete -c productive -l organization-id -d "Organization ID" -r
complete -c productive -l user-id -d "User ID" -r
complete -c productive -l base-url -d "API base URL" -r
`;

export function showCompletionHelp(): void {
  console.log(`
${colors.bold("productive completion")} - Generate shell completion scripts

${colors.bold("USAGE:")}
  productive completion <shell>

${colors.bold("SHELLS:")}
  bash                Generate Bash completion script
  zsh                 Generate Zsh completion script
  fish                Generate Fish completion script

${colors.bold("INSTALLATION:")}

  ${colors.bold("Bash:")}
    # Add to ~/.bashrc or ~/.bash_profile
    eval "$(productive completion bash)"

    # Or save to completion directory
    productive completion bash > /usr/local/etc/bash_completion.d/productive

  ${colors.bold("Zsh:")}
    # Add to ~/.zshrc
    eval "$(productive completion zsh)"

    # Or save to completion directory
    productive completion zsh > /usr/local/share/zsh/site-functions/_productive

  ${colors.bold("Fish:")}
    # Save to Fish completion directory
    productive completion fish > ~/.config/fish/completions/productive.fish

${colors.bold("EXAMPLES:")}
  productive completion bash > ~/.bash_completion.d/productive
  productive completion zsh > ~/.zsh/completions/_productive
  productive completion fish > ~/.config/fish/completions/productive.fish
`);
}

export function handleCompletionCommand(args: string[]): void {
  const shell = args[0];

  if (!shell || shell === "help" || shell === "--help" || shell === "-h") {
    showCompletionHelp();
    return;
  }

  switch (shell.toLowerCase()) {
    case "bash":
      console.log(BASH_COMPLETION);
      break;

    case "zsh":
      console.log(ZSH_COMPLETION);
      break;

    case "fish":
      console.log(FISH_COMPLETION);
      break;

    default:
      console.error(
        `${colors.red("✗")} Unknown shell: ${shell}. Supported shells: bash, zsh, fish`,
      );
      console.error(`Run ${colors.cyan("productive completion help")} for usage information.`);
      process.exit(1);
  }
}
