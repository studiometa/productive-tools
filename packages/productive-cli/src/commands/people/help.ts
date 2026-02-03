/**
 * Help text for people command
 */

import { colors } from '../../utils/colors.js';

export function showPeopleHelp(subcommand?: string): void {
  if (subcommand === 'list' || subcommand === 'ls') {
    console.log(`
${colors.bold('productive people list')} - List people

${colors.bold('USAGE:')}
  productive people list [options]

${colors.bold('OPTIONS:')}
  --company <id>      Filter by company ID
  --project <id>      Filter by project ID
  --role <id>         Filter by role ID
  --team <name>       Filter by team name
  --type <type>       Filter by person type: user, contact, placeholder
  --status <status>   Filter by status: active, deactivated
  --filter <filters>  Generic filters (comma-separated key=value pairs)
  -p, --page <num>    Page number (default: 1)
  -s, --size <num>    Page size (default: 100)
  --sort <field>      Sort by field (prefix with - for descending)
  -f, --format <fmt>  Output format: json, human, csv, table

${colors.bold('EXAMPLES:')}
  productive people list
  productive people list --company 12345
  productive people list --type user --status active
  productive people list --project 123
  productive people list --filter active=true
  productive people list --format json -p 2 -s 50
`);
  } else if (subcommand === 'get') {
    console.log(`
${colors.bold('productive people get')} - Get person details

${colors.bold('USAGE:')}
  productive people get <id>

${colors.bold('ARGUMENTS:')}
  <id>                Person ID (required)

${colors.bold('OPTIONS:')}
  -f, --format <fmt>  Output format: json, human

${colors.bold('EXAMPLES:')}
  productive people get 12345
  productive people get 12345 --format json
`);
  } else {
    console.log(`
${colors.bold('productive people')} - Manage people

${colors.bold('USAGE:')}
  productive people <subcommand> [options]

${colors.bold('SUBCOMMANDS:')}
  list, ls            List people
  get <id>            Get person details

${colors.bold('COMMON OPTIONS:')}
  -f, --format <fmt>  Output format: json, human, csv, table
  -p, --page <num>    Page number for pagination
  -s, --size <num>    Page size (default: 100)
  -h, --help          Show help for a subcommand

${colors.bold('EXAMPLES:')}
  productive people list
  productive people get 12345

Run ${colors.cyan('productive people <subcommand> --help')} for subcommand details.
`);
  }
}
