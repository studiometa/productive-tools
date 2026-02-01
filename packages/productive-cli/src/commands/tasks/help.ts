/**
 * Help text for tasks command
 */

import { colors } from "../../utils/colors.js";

export function showTasksHelp(subcommand?: string): void {
  if (subcommand === "list" || subcommand === "ls") {
    console.log(`
${colors.bold("productive tasks list")} - List tasks

${colors.bold("USAGE:")}
  productive tasks list [options]

${colors.bold("OPTIONS:")}
  --mine              Filter by configured user ID (assignee)
  --status <status>   Filter by status: open, completed, all (default: open)
  --person <id>       Filter by assignee person ID
  --project <id>      Filter by project ID
  --filter <filters>  Generic filters (comma-separated key=value pairs)
  -p, --page <num>    Page number (default: 1)
  -s, --size <num>    Page size (default: 100)
  --sort <field>      Sort by field (prefix with - for descending)
  -f, --format <fmt>  Output format: json, human, csv, table, kanban

${colors.bold("EXAMPLES:")}
  productive tasks list
  productive tasks list --mine
  productive tasks list --mine --status completed
  productive tasks list --status all --project 12345
  productive tasks list --filter assignee_id=123
  productive tasks list --format kanban --project 12345
`);
  } else if (subcommand === "get") {
    console.log(`
${colors.bold("productive tasks get")} - Get task details

${colors.bold("USAGE:")}
  productive tasks get <id>

${colors.bold("ARGUMENTS:")}
  <id>                Task ID (required)

${colors.bold("OPTIONS:")}
  -f, --format <fmt>  Output format: json, human

${colors.bold("EXAMPLES:")}
  productive tasks get 12345
  productive tasks get 12345 --format json
`);
  } else {
    console.log(`
${colors.bold("productive tasks")} - Manage tasks

${colors.bold("USAGE:")}
  productive tasks <subcommand> [options]

${colors.bold("SUBCOMMANDS:")}
  list, ls            List tasks
  get <id>            Get task details

${colors.bold("COMMON OPTIONS:")}
  -f, --format <fmt>  Output format: json, human, csv, table
  -p, --page <num>    Page number for pagination
  -s, --size <num>    Page size (default: 100)
  -h, --help          Show help for a subcommand

${colors.bold("EXAMPLES:")}
  productive tasks list
  productive tasks list --project 12345
  productive tasks get 67890

Run ${colors.cyan("productive tasks <subcommand> --help")} for subcommand details.
`);
  }
}
