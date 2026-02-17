/**
 * Help text for pages command
 */

import { colors } from '../../utils/colors.js';

export function showPagesHelp(subcommand?: string): void {
  if (subcommand === 'list' || subcommand === 'ls') {
    console.log(`
${colors.bold('productive pages list')} - List pages (docs)

${colors.bold('USAGE:')}
  productive pages list [options]

${colors.bold('OPTIONS:')}
  --project <id>      Filter by project ID
  --creator <id>      Filter by creator person ID
  --filter <filters>  Generic filters (comma-separated key=value pairs)
  -p, --page <num>    Page number (default: 1)
  -s, --size <num>    Page size (default: 100)
  --sort <field>      Sort by field (prefix with - for descending)
  -f, --format <fmt>  Output format: json, human, csv, table

${colors.bold('EXAMPLES:')}
  productive pages list
  productive pages list --project 12345
  productive pages list --creator 456
`);
  } else if (subcommand === 'get') {
    console.log(`
${colors.bold('productive pages get')} - Get page details

${colors.bold('USAGE:')}
  productive pages get <id>

${colors.bold('ARGUMENTS:')}
  <id>                Page ID (required)

${colors.bold('OPTIONS:')}
  -f, --format <fmt>  Output format: json, human

${colors.bold('EXAMPLES:')}
  productive pages get 12345
  productive pages get 12345 --format json
`);
  } else if (subcommand === 'add' || subcommand === 'create') {
    console.log(`
${colors.bold('productive pages add')} - Create a new page

${colors.bold('USAGE:')}
  productive pages add [options]

${colors.bold('OPTIONS:')}
  --title <title>       Page title (required)
  --project <id>        Project ID (required)
  --body <text>         Page body content
  --parent-page <id>    Parent page ID (for sub-pages)
  -f, --format <fmt>    Output format: json, human

${colors.bold('EXAMPLES:')}
  productive pages add --title "Getting Started" --project 123
  productive pages add --title "Sub Page" --project 123 --parent-page 456
`);
  } else if (subcommand === 'update') {
    console.log(`
${colors.bold('productive pages update')} - Update an existing page

${colors.bold('USAGE:')}
  productive pages update <id> [options]

${colors.bold('ARGUMENTS:')}
  <id>                  Page ID (required)

${colors.bold('OPTIONS:')}
  --title <title>       New page title
  --body <text>         New page body
  -f, --format <fmt>    Output format: json, human

${colors.bold('EXAMPLES:')}
  productive pages update 12345 --title "Updated Title"
  productive pages update 12345 --body "New content"
`);
  } else if (subcommand === 'delete' || subcommand === 'rm') {
    console.log(`
${colors.bold('productive pages delete')} - Delete a page

${colors.bold('USAGE:')}
  productive pages delete <id>

${colors.bold('ARGUMENTS:')}
  <id>                Page ID (required)

${colors.bold('EXAMPLES:')}
  productive pages delete 12345
`);
  } else {
    console.log(`
${colors.bold('productive pages')} - Manage pages (docs)

${colors.bold('USAGE:')}
  productive pages <subcommand> [options]

${colors.bold('SUBCOMMANDS:')}
  list, ls            List pages
  get <id>            Get page details
  add, create         Create a new page
  update <id>         Update an existing page
  delete, rm <id>     Delete a page

${colors.bold('COMMON OPTIONS:')}
  -f, --format <fmt>  Output format: json, human, csv, table
  -p, --page <num>    Page number for pagination
  -s, --size <num>    Page size (default: 100)
  -h, --help          Show help for a subcommand

${colors.bold('EXAMPLES:')}
  productive pages list
  productive pages list --project 12345
  productive pages get 67890
  productive pages add --title "New page" --project 123
  productive pages update 67890 --title "Updated"
  productive pages delete 67890

Run ${colors.cyan('productive pages <subcommand> --help')} for subcommand details.
`);
  }
}
