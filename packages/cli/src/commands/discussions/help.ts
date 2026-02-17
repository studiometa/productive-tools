/**
 * Help text for discussions command
 */

import { colors } from '../../utils/colors.js';

export function showDiscussionsHelp(subcommand?: string): void {
  if (subcommand === 'list' || subcommand === 'ls') {
    console.log(`
${colors.bold('productive discussions list')} - List discussions

${colors.bold('USAGE:')}
  productive discussions list [options]

${colors.bold('OPTIONS:')}
  --page-id <id>      Filter by page ID
  --status <status>   Filter by status: active, resolved
  --filter <filters>  Generic filters (comma-separated key=value pairs)
  -p, --page <num>    Page number (default: 1)
  -s, --size <num>    Page size (default: 100)
  --sort <field>      Sort by field (prefix with - for descending)
  -f, --format <fmt>  Output format: json, human, csv, table

${colors.bold('EXAMPLES:')}
  productive discussions list
  productive discussions list --page-id 12345
  productive discussions list --status active
`);
  } else if (subcommand === 'get') {
    console.log(`
${colors.bold('productive discussions get')} - Get discussion details

${colors.bold('USAGE:')}
  productive discussions get <id>

${colors.bold('ARGUMENTS:')}
  <id>                Discussion ID (required)

${colors.bold('OPTIONS:')}
  -f, --format <fmt>  Output format: json, human

${colors.bold('EXAMPLES:')}
  productive discussions get 12345
  productive discussions get 12345 --format json
`);
  } else if (subcommand === 'add' || subcommand === 'create') {
    console.log(`
${colors.bold('productive discussions add')} - Create a new discussion

${colors.bold('USAGE:')}
  productive discussions add [options]

${colors.bold('OPTIONS:')}
  --body <text>         Discussion body (required)
  --page-id <id>        Page ID (required)
  --title <title>       Discussion title
  -f, --format <fmt>    Output format: json, human

${colors.bold('EXAMPLES:')}
  productive discussions add --body "Review this section" --page-id 123
  productive discussions add --title "Feedback" --body "Content needs update" --page-id 123
`);
  } else if (subcommand === 'update') {
    console.log(`
${colors.bold('productive discussions update')} - Update an existing discussion

${colors.bold('USAGE:')}
  productive discussions update <id> [options]

${colors.bold('ARGUMENTS:')}
  <id>                  Discussion ID (required)

${colors.bold('OPTIONS:')}
  --title <title>       New discussion title
  --body <text>         New discussion body
  -f, --format <fmt>    Output format: json, human

${colors.bold('EXAMPLES:')}
  productive discussions update 12345 --title "Updated title"
  productive discussions update 12345 --body "New content"
`);
  } else if (subcommand === 'delete' || subcommand === 'rm') {
    console.log(`
${colors.bold('productive discussions delete')} - Delete a discussion

${colors.bold('USAGE:')}
  productive discussions delete <id>

${colors.bold('ARGUMENTS:')}
  <id>                Discussion ID (required)

${colors.bold('EXAMPLES:')}
  productive discussions delete 12345
`);
  } else if (subcommand === 'resolve') {
    console.log(`
${colors.bold('productive discussions resolve')} - Resolve a discussion

${colors.bold('USAGE:')}
  productive discussions resolve <id>

${colors.bold('ARGUMENTS:')}
  <id>                Discussion ID (required)

${colors.bold('EXAMPLES:')}
  productive discussions resolve 12345
`);
  } else if (subcommand === 'reopen') {
    console.log(`
${colors.bold('productive discussions reopen')} - Reopen a resolved discussion

${colors.bold('USAGE:')}
  productive discussions reopen <id>

${colors.bold('ARGUMENTS:')}
  <id>                Discussion ID (required)

${colors.bold('EXAMPLES:')}
  productive discussions reopen 12345
`);
  } else {
    console.log(`
${colors.bold('productive discussions')} - Manage discussions on pages

${colors.bold('USAGE:')}
  productive discussions <subcommand> [options]

${colors.bold('SUBCOMMANDS:')}
  list, ls            List discussions
  get <id>            Get discussion details
  add, create         Create a new discussion
  update <id>         Update an existing discussion
  delete, rm <id>     Delete a discussion
  resolve <id>        Resolve a discussion
  reopen <id>         Reopen a resolved discussion

${colors.bold('COMMON OPTIONS:')}
  -f, --format <fmt>  Output format: json, human, csv, table
  -p, --page <num>    Page number for pagination
  -s, --size <num>    Page size (default: 100)
  -h, --help          Show help for a subcommand

${colors.bold('EXAMPLES:')}
  productive discussions list --page-id 12345
  productive discussions get 67890
  productive discussions add --body "Review needed" --page-id 123
  productive discussions resolve 67890
  productive discussions reopen 67890

Run ${colors.cyan('productive discussions <subcommand> --help')} for subcommand details.
`);
  }
}
