/**
 * Help text for attachments command
 */

import { colors } from '../../utils/colors.js';

export function showAttachmentsHelp(subcommand?: string): void {
  if (subcommand === 'list' || subcommand === 'ls') {
    console.log(`
${colors.bold('productive attachments list')} - List attachments

${colors.bold('USAGE:')}
  productive attachments list [options]

${colors.bold('OPTIONS:')}
  --task <id>         Filter by task ID
  --comment <id>      Filter by comment ID
  --page <id>         Filter by page ID
  --deal <id>         Filter by deal ID
  --filter <filters>  Generic filters (comma-separated key=value pairs)
  -p, --page <num>    Page number (default: 1)
  -s, --size <num>    Page size (default: 100)
  -f, --format <fmt>  Output format: json, human, csv, table

${colors.bold('EXAMPLES:')}
  productive attachments list --task 12345
  productive attachments list --comment 67890
  productive attachments list --deal 11111 --format json
`);
  } else if (subcommand === 'get') {
    console.log(`
${colors.bold('productive attachments get')} - Get attachment details

${colors.bold('USAGE:')}
  productive attachments get <id>

${colors.bold('ARGUMENTS:')}
  <id>                Attachment ID (required)

${colors.bold('OPTIONS:')}
  -f, --format <fmt>  Output format: json, human

${colors.bold('EXAMPLES:')}
  productive attachments get 12345
  productive attachments get 12345 --format json
`);
  } else if (subcommand === 'delete' || subcommand === 'rm') {
    console.log(`
${colors.bold('productive attachments delete')} - Delete an attachment

${colors.bold('USAGE:')}
  productive attachments delete <id>

${colors.bold('ARGUMENTS:')}
  <id>                Attachment ID (required)

${colors.bold('OPTIONS:')}
  -f, --format <fmt>  Output format: json, human

${colors.bold('EXAMPLES:')}
  productive attachments delete 12345
  productive attachments delete 12345 --format json
`);
  } else {
    console.log(`
${colors.bold('productive attachments')} - Manage attachments

${colors.bold('USAGE:')}
  productive attachments <subcommand> [options]

${colors.bold('SUBCOMMANDS:')}
  list, ls            List attachments
  get <id>            Get attachment details
  delete, rm <id>     Delete an attachment

${colors.bold('COMMON OPTIONS:')}
  -f, --format <fmt>  Output format: json, human, csv, table
  -p, --page <num>    Page number for pagination
  -s, --size <num>    Page size (default: 100)
  -h, --help          Show help for a subcommand

${colors.bold('EXAMPLES:')}
  productive attachments list --task 12345
  productive attachments get 67890
  productive attachments delete 67890

Run ${colors.cyan('productive attachments <subcommand> --help')} for subcommand details.
`);
  }
}
