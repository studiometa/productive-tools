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
  productive run [run-options] <script> [script args...]

${colors.bold('ARGUMENTS:')}
  <script>            Path to a .ts, .js, or .mjs script file
  [script args...]    Arguments forwarded to the script verbatim, parsed into
                      \`args\` (positionals) and \`flags\` (named)

${colors.bold('DESCRIPTION:')}
  Executes a script with credentials already loaded from the CLI config
  (keychain, config file, environment variables, or CLI flags).

  Flags placed ${colors.bold('before')} the script path configure \`run\` itself (credentials,
  --dry-run, --list). Everything ${colors.bold('after')} the script path is forwarded to the
  script untouched, so the script can define its own --flags freely.

  Use \`--list\` to discover scripts in a directory (defaults to \`./scripts\`)
  without running any of them. Scripts can export a \`meta\` object to provide
  a name, description, and usage hint shown in the listing.

  Inside the script, you have access to a fully configured Productive SDK
  client via two patterns:

  ${colors.bold('Pattern A — helpers')} (recommended, full type inference):

    ${colors.cyan("import { defineMeta, createScript } from '@studiometa/productive-cli/script';")}

    ${colors.cyan('export const meta = defineMeta({')}
    ${colors.cyan("  name: 'My Report',")}
    ${colors.cyan("  description: 'Generates a weekly summary.',")}
    ${colors.cyan("  usage: '--from <date> --to <date>',")}
    ${colors.cyan('});')}

    ${colors.cyan('export default createScript(async ({ client, output, flags }) => {')}
    ${colors.cyan('  const from = flags.from as string | undefined;')}
    ${colors.cyan('  const projects = await client.projects.all().toArray();')}
    ${colors.cyan('  output.table(projects.map((p) => ({ id: p.id, name: p.name })));')}
    ${colors.cyan('});')}

  ${colors.bold('Pattern A (alt) — explicit types')} (when you prefer annotations):

    ${colors.cyan("import type { ScriptContext, ScriptMeta } from '@studiometa/productive-cli/script';")}

    ${colors.cyan("export const meta: ScriptMeta = { name: 'My Report' };")}

    ${colors.cyan('export default async function ({ client, output }: ScriptContext) {')}
    ${colors.cyan('  const projects = await client.projects.all().toArray();')}
    ${colors.cyan('  output.table(projects.map((p) => ({ id: p.id, name: p.name })));')}
    ${colors.cyan('}')}

  ${colors.bold('Pattern B — globals')} (quick scripts, no imports):

    ${colors.cyan('const tasks = await productive.tasks.all().toArray();')}
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

  Source maps are enabled (--enable-source-maps) for all scripts so that
  stack traces always point to the original source line, not the stripped
  output. This applies to .js files with external source maps as well.

  No additional tools (tsx, ts-node, etc.) are required.

${colors.bold('OPTIONS:')}
  --token <token>     API token (overrides config)
  --org-id <id>       Organization ID (overrides config)
  --user-id <id>      User ID (overrides config)
  --base-url <url>    API base URL (overrides config)
  --dry-run           Record mutating calls (POST/PATCH/DELETE) without executing them
  --list [dir]        List scripts in [dir] (default: ./scripts) with metadata
  -h, --help          Show this help

${colors.bold('EXAMPLES:')}
  # Run a TypeScript script
  productive run ./scripts/weekly-report.ts

  # Pass named flags (available as \`flags.from\`, \`flags.to\`, \`flags.mine\`)
  productive run ./scripts/export-time.ts --from 2025-01-01 --to 2025-01-31 --mine

  # Override credentials for this run (run-options go BEFORE the script path)
  productive run --token $TOKEN --org-id $ORG_ID ./scripts/audit.ts

  # Test a script without making any mutating API calls
  productive run --dry-run ./scripts/bulk-update.ts

  # List all scripts in ./scripts/ with their descriptions
  productive run --list

  # List scripts in a custom directory
  productive run --list ./automation

  # Quick one-off with inline credentials
  productive run ./scripts/list-projects.js
`);
}
