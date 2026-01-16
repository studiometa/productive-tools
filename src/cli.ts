#!/usr/bin/env node

import { parseArgs } from './utils/args.js';
import { colors, setColorEnabled } from './utils/colors.js';
import { handleConfigCommand } from './commands/config.js';
import { handleProjectsCommand } from './commands/projects.js';
import { handleTimeCommand } from './commands/time.js';
import { handleTasksCommand } from './commands/tasks.js';
import { handlePeopleCommand } from './commands/people.js';
import { handleServicesCommand } from './commands/services.js';
import { handleBudgetsCommand } from './commands/budgets.js';

const VERSION = '0.1.0';

function showHelp(): void {
  console.log(`
${colors.bold('productive-cli')} v${VERSION}

${colors.bold('USAGE:')}
  productive <command> [subcommand] [options]

${colors.bold('COMMANDS:')}
  config              Manage CLI configuration
    set <key> <val>     Set configuration value
    get [key]           Get configuration value(s)
    validate            Validate configuration
    clear               Clear all configuration

  projects, p         Manage projects
    list, ls            List projects
    get <id>            Get project details

  time, t             Manage time entries
    list, ls            List time entries
    get <id>            Get time entry details
    add                 Create time entry
    update <id>         Update time entry
    delete <id>         Delete time entry

  tasks               Manage tasks
    list, ls            List tasks
    get <id>            Get task details

  people              Manage people
    list, ls            List people
    get <id>            Get person details

  services, svc       Manage services
    list, ls            List services

  budgets             Manage budgets
    list, ls            List budgets

${colors.bold('OPTIONS:')}
  -f, --format <fmt>  Output format: json, human, csv, table (default: human)
  --no-color          Disable colored output
  -p, --page <num>    Page number for pagination
  -s, --size <num>    Page size (default: 100)
  --sort <field>      Sort by field (prefix with - for descending)
  -h, --help          Show help
  -v, --version       Show version

${colors.bold('AUTHENTICATION OPTIONS:')}
  --token <token>     API token (overrides config and env)
  --api-token <token> Alternative API token flag
  --org-id <id>       Organization ID (overrides config and env)
  --organization-id <id>  Alternative organization ID flag
  --user-id <id>      User ID (overrides config and env)
  --base-url <url>    API base URL (optional)

${colors.bold('EXAMPLES:')}
  # Configure via CLI
  productive config set apiToken YOUR_TOKEN
  productive config set organizationId YOUR_ORG_ID
  productive config set userId YOUR_USER_ID

  # Or pass credentials directly
  productive projects list --token YOUR_TOKEN --org-id YOUR_ORG_ID

  # List projects (human-friendly)
  productive projects list

  # List projects (JSON for AI agents)
  productive projects list --format json

  # Create time entry with inline credentials
  productive time add \\
    --token YOUR_TOKEN \\
    --org-id YOUR_ORG_ID \\
    --user-id YOUR_USER_ID \\
    --service 123 \\
    --time 480 \\
    --note "Work"

  # List time entries for date range
  productive time list --from 2024-01-01 --to 2024-01-31

${colors.bold('CREDENTIAL PRIORITY:')}
  Credentials are loaded in this order (highest to lowest priority):
  1. CLI arguments (--token, --org-id, --user-id)
  2. Environment variables (PRODUCTIVE_API_TOKEN, PRODUCTIVE_ORG_ID, etc.)
  3. Config file (~/.config/productive-cli/config.json)

${colors.bold('ENVIRONMENT VARIABLES:')}
  PRODUCTIVE_API_TOKEN      API token
  PRODUCTIVE_ORG_ID         Organization ID
  PRODUCTIVE_USER_ID        User ID
  PRODUCTIVE_BASE_URL       API base URL (optional)
  XDG_CONFIG_HOME           Config directory (respects XDG spec)
  NO_COLOR                  Disable colors

${colors.bold('CONFIGURATION:')}
  Config stored in XDG-compliant location:
  - Linux:   $XDG_CONFIG_HOME/productive-cli/config.json (~/.config)
  - macOS:   $XDG_CONFIG_HOME or ~/Library/Application Support
  - Windows: %APPDATA%\\productive-cli\\config.json

${colors.bold('LEARN MORE:')}
  Documentation: https://github.com/studiometa/productive-cli
  Productive API: https://developer.productive.io/
`);
}

async function main(): Promise<void> {
  const { command, options, positional } = parseArgs();

  // Handle global flags
  if (options.help || options.h) {
    showHelp();
    process.exit(0);
  }

  if (options.version || options.v) {
    console.log(VERSION);
    process.exit(0);
  }

  if (options['no-color']) {
    setColorEnabled(false);
  }

  // Get command and subcommand
  const [mainCommand, subcommand] = command;

  if (!mainCommand) {
    showHelp();
    process.exit(0);
  }

  // Route to appropriate handler
  try {
    switch (mainCommand) {
      case 'config':
        handleConfigCommand(subcommand || 'get', positional, options);
        break;

      case 'projects':
      case 'p':
        await handleProjectsCommand(subcommand || 'list', positional, options);
        break;

      case 'time':
      case 't':
        await handleTimeCommand(subcommand || 'list', positional, options);
        break;

      case 'tasks':
        await handleTasksCommand(subcommand || 'list', positional, options);
        break;

      case 'people':
        await handlePeopleCommand(subcommand || 'list', positional, options);
        break;

      case 'services':
      case 'svc':
        await handleServicesCommand(subcommand || 'list', positional, options);
        break;

      case 'budgets':
        await handleBudgetsCommand(subcommand || 'list', positional, options);
        break;

      default:
        console.error(colors.red(`Unknown command: ${mainCommand}`));
        console.log(`Run ${colors.cyan('productive --help')} for usage information`);
        process.exit(1);
    }
  } catch (error) {
    console.error(colors.red('Fatal error:'), error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(colors.red('Unhandled error:'), error);
  process.exit(1);
});
