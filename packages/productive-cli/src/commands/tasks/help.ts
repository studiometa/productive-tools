/**
 * Help text for tasks command
 */

import { colors } from '../../utils/colors.js';

export function showTasksHelp(subcommand?: string): void {
  if (subcommand === 'list' || subcommand === 'ls') {
    console.log(`
${colors.bold('productive tasks list')} - List tasks

${colors.bold('USAGE:')}
  productive tasks list [options]

${colors.bold('OPTIONS:')}
  --mine              Filter by configured user ID (assignee)
  --status <status>   Filter by status: open, completed, all (default: open)
  --person <id>       Filter by assignee person ID
  --project <id>      Filter by project ID
  --filter <filters>  Generic filters (comma-separated key=value pairs)
  -p, --page <num>    Page number (default: 1)
  -s, --size <num>    Page size (default: 100)
  --sort <field>      Sort by field (prefix with - for descending)
  -f, --format <fmt>  Output format: json, human, csv, table, kanban

${colors.bold('EXAMPLES:')}
  productive tasks list
  productive tasks list --mine
  productive tasks list --mine --status completed
  productive tasks list --status all --project 12345
  productive tasks list --filter assignee_id=123
  productive tasks list --format kanban --project 12345
`);
  } else if (subcommand === 'get') {
    console.log(`
${colors.bold('productive tasks get')} - Get task details

${colors.bold('USAGE:')}
  productive tasks get <id>

${colors.bold('ARGUMENTS:')}
  <id>                Task ID (required)

${colors.bold('OPTIONS:')}
  -f, --format <fmt>  Output format: json, human

${colors.bold('EXAMPLES:')}
  productive tasks get 12345
  productive tasks get 12345 --format json
`);
  } else if (subcommand === 'add' || subcommand === 'create') {
    console.log(`
${colors.bold('productive tasks add')} - Create a new task

${colors.bold('USAGE:')}
  productive tasks add [options]

${colors.bold('OPTIONS:')}
  --title <title>       Task title (required)
  --project <id>        Project ID (required)
  --task-list <id>      Task list ID (required)
  --assignee <id>       Assignee person ID
  --description <text>  Task description
  --due-date <date>     Due date (YYYY-MM-DD)
  --start-date <date>   Start date (YYYY-MM-DD)
  --estimate <minutes>  Initial estimate in minutes
  --status <id>         Workflow status ID
  --private             Mark task as private
  -f, --format <fmt>    Output format: json, human

${colors.bold('EXAMPLES:')}
  productive tasks add --title "New feature" --project 123 --task-list 456
  productive tasks add --title "Bug fix" --project 123 --task-list 456 --assignee 789
  productive tasks add --title "Review" --project 123 --task-list 456 --due-date 2024-12-31 --estimate 120
`);
  } else if (subcommand === 'update') {
    console.log(`
${colors.bold('productive tasks update')} - Update an existing task

${colors.bold('USAGE:')}
  productive tasks update <id> [options]

${colors.bold('ARGUMENTS:')}
  <id>                  Task ID (required)

${colors.bold('OPTIONS:')}
  --title <title>       New task title
  --description <text>  New description
  --due-date <date>     Due date (YYYY-MM-DD)
  --start-date <date>   Start date (YYYY-MM-DD)
  --estimate <minutes>  Initial estimate in minutes
  --assignee <id>       Assignee person ID
  --status <id>         Workflow status ID
  --private             Mark task as private
  -f, --format <fmt>    Output format: json, human

${colors.bold('EXAMPLES:')}
  productive tasks update 12345 --title "Updated title"
  productive tasks update 12345 --assignee 789 --status 456
  productive tasks update 12345 --due-date 2024-12-31
`);
  } else {
    console.log(`
${colors.bold('productive tasks')} - Manage tasks

${colors.bold('USAGE:')}
  productive tasks <subcommand> [options]

${colors.bold('SUBCOMMANDS:')}
  list, ls            List tasks
  get <id>            Get task details
  add, create         Create a new task
  update <id>         Update an existing task

${colors.bold('COMMON OPTIONS:')}
  -f, --format <fmt>  Output format: json, human, csv, table
  -p, --page <num>    Page number for pagination
  -s, --size <num>    Page size (default: 100)
  -h, --help          Show help for a subcommand

${colors.bold('EXAMPLES:')}
  productive tasks list
  productive tasks list --project 12345
  productive tasks get 67890
  productive tasks add --title "New task" --project 123 --task-list 456
  productive tasks update 67890 --status 789

Run ${colors.cyan('productive tasks <subcommand> --help')} for subcommand details.
`);
  }
}
