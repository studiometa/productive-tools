/**
 * Help text for budgets command
 */

import { colors } from '../../utils/colors.js';

export function showBudgetsHelp(subcommand?: string): void {
  if (subcommand === 'list' || subcommand === 'ls') {
    console.log(`
${colors.bold('productive budgets list')} - List budgets

${colors.bold('USAGE:')}
  productive budgets list [options]

${colors.bold('OPTIONS:')}
  --project <id>      Filter by project ID
  --company <id>      Filter by company ID
  --filter <filters>  Generic filters (comma-separated key=value pairs)
  -p, --page <num>    Page number (default: 1)
  -s, --size <num>    Page size (default: 100)
  -f, --format <fmt>  Output format: json, human, csv, table

${colors.bold('EXAMPLES:')}
  productive budgets list
  productive budgets list --project 12345
  productive budgets list --company 67890
  productive budgets list --filter status=1
`);
  } else {
    console.log(`
${colors.bold('productive budgets')} - Manage budgets

${colors.bold('USAGE:')}
  productive budgets <subcommand> [options]

${colors.bold('SUBCOMMANDS:')}
  list, ls            List budgets

${colors.bold('COMMON OPTIONS:')}
  -f, --format <fmt>  Output format: json, human, csv, table
  -p, --page <num>    Page number for pagination
  -s, --size <num>    Page size (default: 100)
  -h, --help          Show help for a subcommand

${colors.bold('EXAMPLES:')}
  productive budgets list
  productive budgets list --project 12345

Run ${colors.cyan('productive budgets list --help')} for subcommand details.
`);
  }
}
