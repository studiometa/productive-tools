/**
 * Help text for deals command
 */

import { colors } from '../../utils/colors.js';

export function showDealsHelp(subcommand?: string): void {
  if (subcommand === 'list' || subcommand === 'ls') {
    console.log(`
${colors.bold('productive deals list')} - List deals

${colors.bold('USAGE:')}
  productive deals list [options]

${colors.bold('OPTIONS:')}
  --company <id>      Filter by company ID
  --status <status>   Filter by status: open, won, lost
  --type <type>       Filter by type: deal, budget
  --filter <filters>  Generic filters (comma-separated key=value pairs)
  -p, --page <num>    Page number (default: 1)
  -s, --size <num>    Page size (default: 100)
  --sort <field>      Sort by field (prefix with - for descending)
  -f, --format <fmt>  Output format: json, human, csv, table

${colors.bold('EXAMPLES:')}
  productive deals list
  productive deals list --status open
  productive deals list --type budget --company 12345
  productive deals list --status won --format json
`);
  } else if (subcommand === 'get') {
    console.log(`
${colors.bold('productive deals get')} - Get deal details

${colors.bold('USAGE:')}
  productive deals get <id>

${colors.bold('ARGUMENTS:')}
  <id>                Deal ID (required)

${colors.bold('OPTIONS:')}
  -f, --format <fmt>  Output format: json, human

${colors.bold('EXAMPLES:')}
  productive deals get 12345
  productive deals get 12345 --format json
`);
  } else if (subcommand === 'add' || subcommand === 'create') {
    console.log(`
${colors.bold('productive deals add')} - Create a new deal

${colors.bold('USAGE:')}
  productive deals add [options]

${colors.bold('OPTIONS:')}
  --name <name>         Deal name (required)
  --company <id>        Company ID (required)
  --date <date>         Start date (YYYY-MM-DD, default: today)
  --budget              Create as budget instead of deal
  --responsible <id>    Responsible person ID
  -f, --format <fmt>    Output format: json, human

${colors.bold('EXAMPLES:')}
  productive deals add --name "New Project" --company 12345
  productive deals add --name "Q1 Budget" --company 12345 --budget
  productive deals add --name "Website Redesign" --company 12345 --responsible 789
`);
  } else if (subcommand === 'update') {
    console.log(`
${colors.bold('productive deals update')} - Update an existing deal

${colors.bold('USAGE:')}
  productive deals update <id> [options]

${colors.bold('ARGUMENTS:')}
  <id>                  Deal ID (required)

${colors.bold('OPTIONS:')}
  --name <name>         Deal name
  --date <date>         Start date (YYYY-MM-DD)
  --end-date <date>     End date (YYYY-MM-DD)
  --responsible <id>    Responsible person ID
  --status <id>         Deal status ID
  -f, --format <fmt>    Output format: json, human

${colors.bold('EXAMPLES:')}
  productive deals update 12345 --name "Updated Name"
  productive deals update 12345 --end-date 2024-12-31
  productive deals update 12345 --responsible 789
`);
  } else {
    console.log(`
${colors.bold('productive deals')} - Manage deals and budgets

${colors.bold('USAGE:')}
  productive deals <subcommand> [options]

${colors.bold('SUBCOMMANDS:')}
  list, ls            List deals
  get <id>            Get deal details
  add, create         Create a new deal
  update <id>         Update an existing deal

${colors.bold('COMMON OPTIONS:')}
  -f, --format <fmt>  Output format: json, human, csv, table
  -p, --page <num>    Page number for pagination
  -s, --size <num>    Page size (default: 100)
  -h, --help          Show help for a subcommand

${colors.bold('EXAMPLES:')}
  productive deals list --status open
  productive deals add --name "New Project" --company 12345
  productive deals get 67890
  productive deals update 67890 --name "Updated Name"

Run ${colors.cyan('productive deals <subcommand> --help')} for subcommand details.
`);
  }
}
