/**
 * Help text for bookings command
 */

import { colors } from "../../utils/colors.js";

export function showBookingsHelp(subcommand?: string): void {
  if (subcommand === "list" || subcommand === "ls") {
    console.log(`
${colors.bold("productive bookings list")} - List bookings

${colors.bold("USAGE:")}
  productive bookings list [options]

${colors.bold("OPTIONS:")}
  --mine              Filter by configured user ID
  --person <id>       Filter by person ID
  --from <date>       Filter bookings starting after date (YYYY-MM-DD)
  --to <date>         Filter bookings ending before date (YYYY-MM-DD)
  --filter <filters>  Generic filters (comma-separated key=value pairs)
  -p, --page <num>    Page number (default: 1)
  -s, --size <num>    Page size (default: 100)
  --sort <field>      Sort by field (default: started_on)
  -f, --format <fmt>  Output format: json, human, csv, table

${colors.bold("EXAMPLES:")}
  productive bookings list --mine
  productive bookings list --person 12345 --from 2024-01-01 --to 2024-01-31
  productive bookings list --format json
`);
  } else if (subcommand === "get") {
    console.log(`
${colors.bold("productive bookings get")} - Get booking details

${colors.bold("USAGE:")}
  productive bookings get <id>

${colors.bold("ARGUMENTS:")}
  <id>                Booking ID (required)

${colors.bold("OPTIONS:")}
  -f, --format <fmt>  Output format: json, human

${colors.bold("EXAMPLES:")}
  productive bookings get 12345
  productive bookings get 12345 --format json
`);
  } else if (subcommand === "add" || subcommand === "create") {
    console.log(`
${colors.bold("productive bookings add")} - Create a new booking

${colors.bold("USAGE:")}
  productive bookings add [options]

${colors.bold("OPTIONS:")}
  --person <id>         Person ID (default: configured userId)
  --service <id>        Service ID (for budget bookings)
  --event <id>          Event ID (for absence bookings)
  --from <date>         Start date (YYYY-MM-DD, required)
  --to <date>           End date (YYYY-MM-DD, required)
  --time <minutes>      Time per day in minutes (for per day method)
  --total-time <mins>   Total time in minutes (for total hours method)
  --percentage <pct>    Percentage of available time (for percentage method)
  --tentative           Create as tentative booking
  --note <text>         Booking note
  -f, --format <fmt>    Output format: json, human

${colors.bold("NOTE:")}
  Either --service (for budget bookings) or --event (for absence bookings) must be specified.

${colors.bold("EXAMPLES:")}
  productive bookings add --service 123 --from 2024-01-15 --to 2024-01-19 --time 480
  productive bookings add --event 456 --from 2024-01-20 --to 2024-01-20 --tentative
  productive bookings add --service 123 --from 2024-02-01 --to 2024-02-28 --percentage 50
`);
  } else if (subcommand === "update") {
    console.log(`
${colors.bold("productive bookings update")} - Update an existing booking

${colors.bold("USAGE:")}
  productive bookings update <id> [options]

${colors.bold("ARGUMENTS:")}
  <id>                  Booking ID (required)

${colors.bold("OPTIONS:")}
  --from <date>         Start date (YYYY-MM-DD)
  --to <date>           End date (YYYY-MM-DD)
  --time <minutes>      Time per day in minutes
  --total-time <mins>   Total time in minutes
  --percentage <pct>    Percentage of available time
  --tentative           Mark as tentative
  --confirm             Confirm tentative booking
  --note <text>         Booking note
  -f, --format <fmt>    Output format: json, human

${colors.bold("EXAMPLES:")}
  productive bookings update 12345 --to 2024-01-20
  productive bookings update 12345 --confirm
  productive bookings update 12345 --time 240 --note "Half day"
`);
  } else {
    console.log(`
${colors.bold("productive bookings")} - Manage resource bookings

${colors.bold("USAGE:")}
  productive bookings <subcommand> [options]

${colors.bold("SUBCOMMANDS:")}
  list, ls            List bookings
  get <id>            Get booking details
  add, create         Create a new booking
  update <id>         Update an existing booking

${colors.bold("COMMON OPTIONS:")}
  -f, --format <fmt>  Output format: json, human, csv, table
  -p, --page <num>    Page number for pagination
  -s, --size <num>    Page size (default: 100)
  -h, --help          Show help for a subcommand

${colors.bold("EXAMPLES:")}
  productive bookings list --mine --from 2024-01-01
  productive bookings add --service 123 --from 2024-01-15 --to 2024-01-19 --time 480
  productive bookings update 67890 --confirm

Run ${colors.cyan("productive bookings <subcommand> --help")} for subcommand details.
`);
  }
}
