/**
 * Help text for time command
 */

import { colors } from '../../utils/colors.js';

export function showTimeHelp(subcommand?: string): void {
  if (subcommand === 'list' || subcommand === 'ls') {
    console.log(`
${colors.bold('productive time list')} - List time entries

${colors.bold('USAGE:')}
  productive time list [options]

${colors.bold('OPTIONS:')}
  --date <date>       Filter by date (single day or range shortcut)
  --from <date>       Filter entries after this date
  --to <date>         Filter entries before this date
  --mine              Filter by configured user ID (shortcut for --person)
  --person <id>       Filter by person ID
  --project <id>      Filter by project ID
  --service <id>      Filter by service ID
  --task <id>         Filter by task ID
  --company <id>      Filter by company ID
  --deal <id>         Filter by deal ID
  --budget <id>       Filter by budget ID
  --status <status>   Filter by approval status: approved, unapproved, rejected
  --billing-type <t>  Filter by billing type: fixed, actuals, non_billable
  --invoicing-status  Filter by invoicing: not_invoiced, drafted, finalized
  --filter <filters>  Generic filters (comma-separated key=value pairs)
  -p, --page <num>    Page number (default: 1)
  -s, --size <num>    Page size (default: 100)
  --sort <field>      Sort by field (prefix with - for descending)
  -f, --format <fmt>  Output format: json, human, csv, table

${colors.bold('DATE FORMATS:')}
  ISO format:         2024-01-15
  Keywords:           today, yesterday, tomorrow
  Relative:           "2 days ago", "1 week ago", "3 months ago"
  Ranges:             "this week", "last week", "this month", "last month"

${colors.bold('EXAMPLES:')}
  productive time list --date today
  productive time list --date yesterday --mine
  productive time list --date "last week"
  productive time list --date "this month" --project 123
  productive time list --from "3 days ago" --to today
  productive time list --from 2024-01-01 --to 2024-01-31
  productive time list --status approved --mine
  productive time list --status unapproved --date "this week"
  productive time list --task 12345
  productive time list --billing-type actuals --project 123
  productive time list --invoicing-status not_invoiced
  productive time list --filter service_id=123,project_id=456
`);
  } else if (subcommand === 'get') {
    console.log(`
${colors.bold('productive time get')} - Get time entry details

${colors.bold('USAGE:')}
  productive time get <id>

${colors.bold('ARGUMENTS:')}
  <id>                Time entry ID (required)

${colors.bold('OPTIONS:')}
  -f, --format <fmt>  Output format: json, human

${colors.bold('EXAMPLES:')}
  productive time get 12345
  productive time get 12345 --format json
`);
  } else if (subcommand === 'add') {
    console.log(`
${colors.bold('productive time add')} - Create a time entry

${colors.bold('USAGE:')}
  productive time add --service <id> --time <minutes> [options]

${colors.bold('OPTIONS:')}
  --service <id>      Service ID (required)
  --time <minutes>    Duration in minutes (required)
  --date <date>       Date (YYYY-MM-DD, default: today)
  --note <text>       Note/description
  --person <id>       Person ID (default: from config userId)
  -f, --format <fmt>  Output format: json, human

${colors.bold('EXAMPLES:')}
  productive time add --service 123 --time 480 --note "Development work"
  productive time add --service 123 --time 120 --date 2024-01-15
  productive time add --service 123 --time 60 --person 456
`);
  } else if (subcommand === 'update') {
    console.log(`
${colors.bold('productive time update')} - Update a time entry

${colors.bold('USAGE:')}
  productive time update <id> [options]

${colors.bold('ARGUMENTS:')}
  <id>                Time entry ID (required)

${colors.bold('OPTIONS:')}
  --time <minutes>    New duration in minutes
  --date <date>       New date (YYYY-MM-DD)
  --note <text>       New note/description
  -f, --format <fmt>  Output format: json, human

${colors.bold('EXAMPLES:')}
  productive time update 12345 --time 240
  productive time update 12345 --note "Updated description"
  productive time update 12345 --date 2024-01-16 --time 480
`);
  } else if (subcommand === 'delete' || subcommand === 'rm') {
    console.log(`
${colors.bold('productive time delete')} - Delete a time entry

${colors.bold('USAGE:')}
  productive time delete <id>

${colors.bold('ALIASES:')}
  productive time rm <id>

${colors.bold('ARGUMENTS:')}
  <id>                Time entry ID (required)

${colors.bold('OPTIONS:')}
  -f, --format <fmt>  Output format: json, human

${colors.bold('EXAMPLES:')}
  productive time delete 12345
  productive time rm 12345 --format json
`);
  } else {
    console.log(`
${colors.bold('productive time')} - Manage time entries

${colors.bold('USAGE:')}
  productive time <subcommand> [options]

${colors.bold('ALIASES:')}
  productive t

${colors.bold('SUBCOMMANDS:')}
  list, ls            List time entries
  get <id>            Get time entry details
  add                 Create a new time entry
  update <id>         Update a time entry
  delete, rm <id>     Delete a time entry

${colors.bold('COMMON OPTIONS:')}
  -f, --format <fmt>  Output format: json, human, csv, table
  -p, --page <num>    Page number for pagination
  -s, --size <num>    Page size (default: 100)
  -h, --help          Show help for a subcommand

${colors.bold('EXAMPLES:')}
  productive time list --from 2024-01-01
  productive time add --service 123 --time 480
  productive time get 12345
  productive time delete 12345

Run ${colors.cyan('productive time <subcommand> --help')} for subcommand details.
`);
  }
}
