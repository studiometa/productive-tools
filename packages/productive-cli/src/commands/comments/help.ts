/**
 * Help text for comments command
 */

import { colors } from '../../utils/colors.js';

export function showCommentsHelp(subcommand?: string): void {
  if (subcommand === 'list' || subcommand === 'ls') {
    console.log(`
${colors.bold('productive comments list')} - List comments

${colors.bold('USAGE:')}
  productive comments list [options]

${colors.bold('OPTIONS:')}
  --task <id>         Filter by task ID
  --deal <id>         Filter by deal ID
  --project <id>      Filter by project ID
  --filter <filters>  Generic filters (comma-separated key=value pairs)
  -p, --page <num>    Page number (default: 1)
  -s, --size <num>    Page size (default: 100)
  -f, --format <fmt>  Output format: json, human, csv, table

${colors.bold('EXAMPLES:')}
  productive comments list --task 12345
  productive comments list --deal 67890
  productive comments list --project 11111 --format json
`);
  } else if (subcommand === 'get') {
    console.log(`
${colors.bold('productive comments get')} - Get comment details

${colors.bold('USAGE:')}
  productive comments get <id>

${colors.bold('ARGUMENTS:')}
  <id>                Comment ID (required)

${colors.bold('OPTIONS:')}
  -f, --format <fmt>  Output format: json, human

${colors.bold('EXAMPLES:')}
  productive comments get 12345
  productive comments get 12345 --format json
`);
  } else if (subcommand === 'add' || subcommand === 'create') {
    console.log(`
${colors.bold('productive comments add')} - Add a comment

${colors.bold('USAGE:')}
  productive comments add [options]

${colors.bold('OPTIONS:')}
  --body <text>       Comment text (required)
  --task <id>         Add comment to task
  --deal <id>         Add comment to deal
  --company <id>      Add comment to company
  --invoice <id>      Add comment to invoice
  --person <id>       Add comment to person
  --discussion <id>   Add comment to discussion
  -f, --format <fmt>  Output format: json, human

${colors.bold('NOTE:')}
  Exactly one parent resource (--task, --deal, etc.) must be specified.

${colors.bold('EXAMPLES:')}
  productive comments add --task 12345 --body "This looks good!"
  productive comments add --deal 67890 --body "Budget approved"
  productive comments add --company 11111 --body "Updated contact info"
`);
  } else if (subcommand === 'update') {
    console.log(`
${colors.bold('productive comments update')} - Update a comment

${colors.bold('USAGE:')}
  productive comments update <id> [options]

${colors.bold('ARGUMENTS:')}
  <id>                Comment ID (required)

${colors.bold('OPTIONS:')}
  --body <text>       New comment text
  -f, --format <fmt>  Output format: json, human

${colors.bold('EXAMPLES:')}
  productive comments update 12345 --body "Updated comment text"
`);
  } else {
    console.log(`
${colors.bold('productive comments')} - Manage comments

${colors.bold('USAGE:')}
  productive comments <subcommand> [options]

${colors.bold('SUBCOMMANDS:')}
  list, ls            List comments
  get <id>            Get comment details
  add, create         Add a new comment
  update <id>         Update a comment

${colors.bold('COMMON OPTIONS:')}
  -f, --format <fmt>  Output format: json, human, csv, table
  -p, --page <num>    Page number for pagination
  -s, --size <num>    Page size (default: 100)
  -h, --help          Show help for a subcommand

${colors.bold('EXAMPLES:')}
  productive comments list --task 12345
  productive comments add --task 12345 --body "Great progress!"
  productive comments get 67890
  productive comments update 67890 --body "Updated text"

Run ${colors.cyan('productive comments <subcommand> --help')} for subcommand details.
`);
  }
}
