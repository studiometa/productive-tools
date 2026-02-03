/**
 * Help text for services command
 */

import { colors } from '../../utils/colors.js';

export function showServicesHelp(subcommand?: string): void {
  if (subcommand === 'list' || subcommand === 'ls') {
    console.log(`
${colors.bold('productive services list')} - List services

${colors.bold('USAGE:')}
  productive services list [options]

${colors.bold('OPTIONS:')}
  --project <id>       Filter by project ID
  --deal <id>          Filter by deal ID
  --task <id>          Filter by task ID
  --person <id>        Filter by person ID (trackable by)
  --budget-status <s>  Filter by budget status: open, delivered
  --billing-type <t>   Filter by billing type: fixed, actuals, none
  --time-tracking      Filter services with time tracking enabled
  --no-time-tracking   Filter services without time tracking
  --filter <filters>   Generic filters (comma-separated key=value pairs)
  -p, --page <num>     Page number (default: 1)
  -s, --size <num>     Page size (default: 100)
  -f, --format <fmt>   Output format: json, human, csv, table

${colors.bold('EXAMPLES:')}
  productive services list
  productive services list --project 12345
  productive services list --budget-status open
  productive services list --billing-type actuals
  productive services list --time-tracking --project 123
  productive services list --filter deal_id=67890
  productive services list --format json -p 2 -s 50
`);
  } else {
    console.log(`
${colors.bold('productive services')} - Manage services

${colors.bold('USAGE:')}
  productive services <subcommand> [options]

${colors.bold('ALIASES:')}
  productive svc

${colors.bold('SUBCOMMANDS:')}
  list, ls            List services

${colors.bold('COMMON OPTIONS:')}
  -f, --format <fmt>  Output format: json, human, csv, table
  -p, --page <num>    Page number for pagination
  -s, --size <num>    Page size (default: 100)
  -h, --help          Show help for a subcommand

${colors.bold('EXAMPLES:')}
  productive services list
  productive svc list --format json

Run ${colors.cyan('productive services list --help')} for subcommand details.
`);
  }
}
