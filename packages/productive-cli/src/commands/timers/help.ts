/**
 * Help text for timers command
 */

import { colors } from '../../utils/colors.js';

export function showTimersHelp(subcommand?: string): void {
  if (subcommand === 'list' || subcommand === 'ls') {
    console.log(`
${colors.bold('productive timers list')} - List timers

${colors.bold('USAGE:')}
  productive timers list [options]

${colors.bold('OPTIONS:')}
  --mine              Filter by configured user ID
  --person <id>       Filter by person ID
  --filter <filters>  Generic filters (comma-separated key=value pairs)
  -p, --page <num>    Page number (default: 1)
  -s, --size <num>    Page size (default: 100)
  --sort <field>      Sort by field (default: -started_at)
  -f, --format <fmt>  Output format: json, human, csv, table

${colors.bold('EXAMPLES:')}
  productive timers list
  productive timers list --mine
  productive timers list --person 12345
`);
  } else if (subcommand === 'get') {
    console.log(`
${colors.bold('productive timers get')} - Get timer details

${colors.bold('USAGE:')}
  productive timers get <id>

${colors.bold('ARGUMENTS:')}
  <id>                Timer ID (required)

${colors.bold('OPTIONS:')}
  -f, --format <fmt>  Output format: json, human

${colors.bold('EXAMPLES:')}
  productive timers get 12345
  productive timers get 12345 --format json
`);
  } else if (subcommand === 'start') {
    console.log(`
${colors.bold('productive timers start')} - Start a new timer

${colors.bold('USAGE:')}
  productive timers start [options]

${colors.bold('OPTIONS:')}
  --service <id>      Start timer for service (creates new time entry)
  --time-entry <id>   Start timer for existing time entry
  -f, --format <fmt>  Output format: json, human

${colors.bold('NOTE:')}
  Either --service or --time-entry must be specified.
  Using --service will create a new time entry for today.

${colors.bold('EXAMPLES:')}
  productive timers start --service 12345
  productive timers start --time-entry 67890
`);
  } else if (subcommand === 'stop') {
    console.log(`
${colors.bold('productive timers stop')} - Stop a running timer

${colors.bold('USAGE:')}
  productive timers stop <id>

${colors.bold('ARGUMENTS:')}
  <id>                Timer ID (required)

${colors.bold('OPTIONS:')}
  -f, --format <fmt>  Output format: json, human

${colors.bold('EXAMPLES:')}
  productive timers stop 12345
`);
  } else {
    console.log(`
${colors.bold('productive timers')} - Manage timers (real-time tracking)

${colors.bold('USAGE:')}
  productive timers <subcommand> [options]

${colors.bold('SUBCOMMANDS:')}
  list, ls            List timers
  get <id>            Get timer details
  start               Start a new timer
  stop <id>           Stop a running timer

${colors.bold('COMMON OPTIONS:')}
  -f, --format <fmt>  Output format: json, human, csv, table
  -p, --page <num>    Page number for pagination
  -s, --size <num>    Page size (default: 100)
  -h, --help          Show help for a subcommand

${colors.bold('EXAMPLES:')}
  productive timers list --mine
  productive timers start --service 12345
  productive timers stop 67890

Run ${colors.cyan('productive timers <subcommand> --help')} for subcommand details.
`);
  }
}
