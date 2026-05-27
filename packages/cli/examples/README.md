# productive run — examples

Ready-to-run script examples for `productive run`. Copy any file to your own
`scripts/` directory and adjust as needed.

## Running an example

```bash
# From the repo root (using the built CLI)
productive run packages/cli/examples/my-tasks.ts

# Pass flags
productive run packages/cli/examples/time-report.ts --from 2025-01-01 --to 2025-01-31

# Preview mutations without executing them
productive run --dry-run packages/cli/examples/log-time.ts --service-id 12345 --hours 2
```

## Examples

| File                                   | Description                                              |
| -------------------------------------- | -------------------------------------------------------- |
| [`my-tasks.ts`](./my-tasks.ts)         | List open tasks assigned to you, with optional `--limit` |
| [`time-report.ts`](./time-report.ts)   | Export time entries for a date range to CSV              |
| [`log-time.ts`](./log-time.ts)         | Log a time entry for today (or a custom date)            |
| [`project-list.ts`](./project-list.ts) | List active projects, optionally including archived ones |

## Authoring your own scripts

```typescript
import { defineMeta, createScript } from '@studiometa/productive-cli/script';

export const meta = defineMeta({
  name: 'My Script',
  description: 'One-line description shown by productive run --list.',
  usage: '[--flag <value>]',
});

export default createScript(async ({ client, output, flags }) => {
  // client   → pre-configured Productive SDK client
  // output   → output.table(), .csv(), .json(), .spinner(), .info(), …
  // flags    → parsed flags: --from 2025-01-01 → flags.from === '2025-01-01'
  // args     → positional args after the script path
});
```

SDK tips:

- `.all({ filter: { … } }).toArray()` — fetch all pages into an array
- `.list({ filter: { … } })` — fetch a single page (returns `{ data, meta }`)
- All resource types use flat attribute access: `task.title`, not `task.attributes.title`
- `process.env.PRODUCTIVE_USER_ID` — the authenticated user's ID (injected automatically)
