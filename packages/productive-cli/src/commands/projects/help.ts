/**
 * Help text for projects command
 */

import { colors } from '../../utils/colors.js';

export function showProjectsHelp(subcommand?: string): void {
  if (subcommand === 'list' || subcommand === 'ls') {
    console.log(`
${colors.bold('productive projects list')} - List projects

${colors.bold('USAGE:')}
  productive projects list [options]

${colors.bold('OPTIONS:')}
  --company <id>      Filter by company ID
  --responsible <id>  Filter by project manager ID
  --person <id>       Filter by team member ID
  --type <type>       Filter by project type: internal, client
  --status <status>   Filter by status: active, archived
  --filter <filters>  Generic filters (comma-separated key=value pairs)
  -p, --page <num>    Page number (default: 1)
  -s, --size <num>    Page size (default: 100)
  --sort <field>      Sort by field (prefix with - for descending)
  -f, --format <fmt>  Output format: json, human, csv, table

${colors.bold('EXAMPLES:')}
  productive projects list
  productive projects list --company 12345
  productive projects list --type client
  productive projects list --status active
  productive projects list --responsible 456
  productive projects list --filter archived=false
  productive projects list --format json
  productive projects list --sort -created_at
`);
  } else if (subcommand === 'get') {
    console.log(`
${colors.bold('productive projects get')} - Get project details

${colors.bold('USAGE:')}
  productive projects get <id>

${colors.bold('ARGUMENTS:')}
  <id>                Project ID (required)

${colors.bold('OPTIONS:')}
  -f, --format <fmt>  Output format: json, human

${colors.bold('EXAMPLES:')}
  productive projects get 12345
  productive projects get 12345 --format json
`);
  } else {
    console.log(`
${colors.bold('productive projects')} - Manage projects

${colors.bold('USAGE:')}
  productive projects <subcommand> [options]

${colors.bold('ALIASES:')}
  productive p

${colors.bold('SUBCOMMANDS:')}
  list, ls            List projects
  get <id>            Get project details

${colors.bold('COMMON OPTIONS:')}
  -f, --format <fmt>  Output format: json, human, csv, table
  -p, --page <num>    Page number for pagination
  -s, --size <num>    Page size (default: 100)
  -h, --help          Show help for a subcommand

${colors.bold('EXAMPLES:')}
  productive projects list
  productive projects get 12345

Run ${colors.cyan('productive projects <subcommand> --help')} for subcommand details.
`);
  }
}
