/**
 * Help text for `productive run`.
 */

import { colors } from '../../utils/colors.js';

export function showRunHelp(): void {
  console.log(`
${colors.bold('productive run')} - Run a JavaScript/TypeScript script with a pre-configured Productive SDK client

${colors.bold('ALIASES:')}
  productive script

${colors.bold('USAGE:')}
  productive run <script> [args...]

${colors.bold('ARGUMENTS:')}
  <script>            Path to a .ts, .js, or .mjs script file
  [args...]           Arguments forwarded to the script as \`args\`

${colors.bold('DESCRIPTION:')}
  Executes a script with credentials already loaded from the CLI config
  (keychain, config file, environment variables, or CLI flags).

  Inside the script, you have access to a fully configured Productive SDK
  client via two patterns:

  ${colors.bold('Pattern A — default export')} (recommended, full type safety):

    ${colors.cyan("import type { ScriptContext } from '@studiometa/productive-cli/script';")}

    ${colors.cyan('export default async function ({ client, output, args, flags }: ScriptContext) {')}
    ${colors.cyan('  const from = flags.from as string | undefined;')}
    ${colors.cyan('  const projects = await client.projects.list().toArray();')}
    ${colors.cyan('  output.table(projects.map(p => ({ id: p.id, name: p.attributes.name })));')}
    ${colors.cyan('}')}

  ${colors.bold('Pattern B — globals')} (quick scripts, no imports):

    ${colors.cyan('const tasks = await productive.tasks.list().toArray();')}
    ${colors.cyan('output.json(tasks);')}

${colors.bold('AVAILABLE GLOBALS:')}
  productive          Pre-configured Productive SDK client
  output              Output utilities (see below)
  args                Positional arguments after the script path (strings only)
  flags               Named flags parsed from the script arguments

${colors.bold('OUTPUT UTILITIES:')}
  output.table(data)        Render an array of objects as an ASCII table
  output.json(data)         Print data as formatted JSON
  output.csv(data)          Print an array of objects as CSV
  output.print(text)        Print plain text
  output.success(msg)       Green ✓ message
  output.error(msg)         Red ✗ message (stderr)
  output.warn(msg)          Yellow ⚠ message
  output.info(msg)          Blue info message
  output.spinner(msg)             Start a spinner, returns { update, stop, fail }
  output.spinner(msg, asyncFn)    Run asyncFn, auto-stop spinner; returns Promise

${colors.bold('TYPESCRIPT SUPPORT:')}
  .ts and .mts files are executed using Node.js built-in TypeScript stripping
  (--experimental-strip-types). This covers type annotations, interfaces,
  generics, and type assertions. Decorators and legacy \`enum\` are also
  supported via --experimental-transform-types.

  No additional tools (tsx, ts-node, etc.) are required.

${colors.bold('OPTIONS:')}
  --token <token>     API token (overrides config)
  --org-id <id>       Organization ID (overrides config)
  --user-id <id>      User ID (overrides config)
  --base-url <url>    API base URL (overrides config)
  -h, --help          Show this help

${colors.bold('EXAMPLES:')}
  # Run a TypeScript script
  productive run ./scripts/weekly-report.ts

  # Pass named flags (available as \`flags.from\`, \`flags.to\`, \`flags.mine\`)
  productive run ./scripts/export-time.ts --from 2025-01-01 --to 2025-01-31 --mine

  # Override credentials for this run
  productive run ./scripts/audit.ts --token $TOKEN --org-id $ORG_ID

  # Quick one-off with inline credentials
  productive run ./scripts/list-projects.js
`);
}
