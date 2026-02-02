/**
 * Help text for reports command
 */

import { colors } from "../../utils/colors.js";

export function showReportsHelp(subcommand?: string): void {
  if (subcommand === "time") {
    console.log(`
${colors.bold("productive reports time")} - Time reports

${colors.bold("USAGE:")}
  productive reports time [options]

${colors.bold("OPTIONS:")}
  --from <date>       Filter by start date (YYYY-MM-DD)
  --to <date>         Filter by end date (YYYY-MM-DD)
  --person <id>       Filter by person ID
  --project <id>      Filter by project ID
  --group <field>     Group by: person, project, service, deal (default: person)
  --filter <filters>  Generic filters (comma-separated key=value pairs)
  -p, --page <num>    Page number (default: 1)
  -s, --size <num>    Page size (default: 100)
  -f, --format <fmt>  Output format: json, human (default: json)

${colors.bold("EXAMPLES:")}
  productive reports time --from 2024-01-01 --to 2024-01-31
  productive reports time --group project --format json
  productive reports time --person 12345 --from 2024-01-01
`);
  } else if (subcommand === "project" || subcommand === "projects") {
    console.log(`
${colors.bold("productive reports project")} - Project reports

${colors.bold("USAGE:")}
  productive reports project [options]

${colors.bold("OPTIONS:")}
  --company <id>      Filter by company ID
  --group <field>     Group by: project, company (default: project)
  --filter <filters>  Generic filters (comma-separated key=value pairs)
  -p, --page <num>    Page number (default: 1)
  -s, --size <num>    Page size (default: 100)
  -f, --format <fmt>  Output format: json, human (default: json)

${colors.bold("EXAMPLES:")}
  productive reports project --format json
  productive reports project --company 12345
`);
  } else if (subcommand === "budget" || subcommand === "budgets") {
    console.log(`
${colors.bold("productive reports budget")} - Budget reports

${colors.bold("USAGE:")}
  productive reports budget [options]

${colors.bold("OPTIONS:")}
  --company <id>      Filter by company ID
  --group <field>     Group by: deal, company (default: deal)
  --filter <filters>  Generic filters (comma-separated key=value pairs)
  -p, --page <num>    Page number (default: 1)
  -s, --size <num>    Page size (default: 100)
  -f, --format <fmt>  Output format: json, human (default: json)

${colors.bold("EXAMPLES:")}
  productive reports budget --format json
  productive reports budget --company 12345
`);
  } else if (subcommand === "person" || subcommand === "people") {
    console.log(`
${colors.bold("productive reports person")} - Person reports

${colors.bold("USAGE:")}
  productive reports person [options]

${colors.bold("OPTIONS:")}
  --from <date>       Filter by start date (YYYY-MM-DD)
  --to <date>         Filter by end date (YYYY-MM-DD)
  --group <field>     Group by: person, team (default: person)
  --filter <filters>  Generic filters (comma-separated key=value pairs)
  -p, --page <num>    Page number (default: 1)
  -s, --size <num>    Page size (default: 100)
  -f, --format <fmt>  Output format: json, human (default: json)

${colors.bold("EXAMPLES:")}
  productive reports person --format json
  productive reports person --from 2024-01-01 --to 2024-01-31
`);
  } else {
    console.log(`
${colors.bold("productive reports")} - Generate reports

${colors.bold("USAGE:")}
  productive reports <type> [options]

${colors.bold("REPORT TYPES:")}
  time                Time tracking reports
  project             Project reports (revenue, cost, profit)
  budget              Budget reports (time budgets)
  person              Person/team reports

${colors.bold("COMMON OPTIONS:")}
  --from <date>       Filter by start date (YYYY-MM-DD)
  --to <date>         Filter by end date (YYYY-MM-DD)
  --group <field>     Group results by field
  --filter <filters>  Generic filters (comma-separated key=value pairs)
  -f, --format <fmt>  Output format: json, human (default: json)
  -p, --page <num>    Page number for pagination
  -s, --size <num>    Page size (default: 100)
  -h, --help          Show help for a report type

${colors.bold("EXAMPLES:")}
  productive reports time --from 2024-01-01 --to 2024-01-31
  productive reports project --company 12345 --format json
  productive reports budget --group deal
  productive reports person --from 2024-01-01

Run ${colors.cyan("productive reports <type> --help")} for report-specific options.
`);
  }
}
