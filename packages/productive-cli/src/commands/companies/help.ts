/**
 * Help text for companies command
 */

import { colors } from '../../utils/colors.js';

export function showCompaniesHelp(subcommand?: string): void {
  if (subcommand === 'list' || subcommand === 'ls') {
    console.log(`
${colors.bold('productive companies list')} - List companies

${colors.bold('USAGE:')}
  productive companies list [options]

${colors.bold('OPTIONS:')}
  --archived          Include archived companies
  --filter <filters>  Generic filters (comma-separated key=value pairs)
  -p, --page <num>    Page number (default: 1)
  -s, --size <num>    Page size (default: 100)
  --sort <field>      Sort by field (prefix with - for descending)
  -f, --format <fmt>  Output format: json, human, csv, table

${colors.bold('EXAMPLES:')}
  productive companies list
  productive companies list --format json
  productive companies list --sort name
  productive companies list --archived
`);
  } else if (subcommand === 'get') {
    console.log(`
${colors.bold('productive companies get')} - Get company details

${colors.bold('USAGE:')}
  productive companies get <id>

${colors.bold('ARGUMENTS:')}
  <id>                Company ID (required)

${colors.bold('OPTIONS:')}
  -f, --format <fmt>  Output format: json, human

${colors.bold('EXAMPLES:')}
  productive companies get 12345
  productive companies get 12345 --format json
`);
  } else if (subcommand === 'add' || subcommand === 'create') {
    console.log(`
${colors.bold('productive companies add')} - Create a new company

${colors.bold('USAGE:')}
  productive companies add [options]

${colors.bold('OPTIONS:')}
  --name <name>           Company name (required)
  --billing-name <name>   Full billing name for invoices
  --vat <vat>             Tax ID / VAT number
  --currency <code>       Default currency (e.g., EUR, USD)
  --code <code>           Company code (auto-generated if not set)
  --domain <domain>       Company domain
  --due-days <days>       Payment due days
  -f, --format <fmt>      Output format: json, human

${colors.bold('EXAMPLES:')}
  productive companies add --name "Acme Corp"
  productive companies add --name "Acme Corp" --currency EUR --vat "FR123456789"
  productive companies add --name "Acme Corp" --billing-name "ACME Corporation Ltd" --due-days 30
`);
  } else if (subcommand === 'update') {
    console.log(`
${colors.bold('productive companies update')} - Update an existing company

${colors.bold('USAGE:')}
  productive companies update <id> [options]

${colors.bold('ARGUMENTS:')}
  <id>                    Company ID (required)

${colors.bold('OPTIONS:')}
  --name <name>           Company name
  --billing-name <name>   Full billing name for invoices
  --vat <vat>             Tax ID / VAT number
  --currency <code>       Default currency
  --code <code>           Company code
  --domain <domain>       Company domain
  --due-days <days>       Payment due days
  -f, --format <fmt>      Output format: json, human

${colors.bold('EXAMPLES:')}
  productive companies update 12345 --name "New Name"
  productive companies update 12345 --currency USD --due-days 45
`);
  } else {
    console.log(`
${colors.bold('productive companies')} - Manage companies (clients)

${colors.bold('USAGE:')}
  productive companies <subcommand> [options]

${colors.bold('SUBCOMMANDS:')}
  list, ls            List companies
  get <id>            Get company details
  add, create         Create a new company
  update <id>         Update an existing company

${colors.bold('COMMON OPTIONS:')}
  -f, --format <fmt>  Output format: json, human, csv, table
  -p, --page <num>    Page number for pagination
  -s, --size <num>    Page size (default: 100)
  -h, --help          Show help for a subcommand

${colors.bold('EXAMPLES:')}
  productive companies list
  productive companies get 12345
  productive companies add --name "New Client"
  productive companies update 12345 --name "Updated Name"

Run ${colors.cyan('productive companies <subcommand> --help')} for subcommand details.
`);
  }
}
