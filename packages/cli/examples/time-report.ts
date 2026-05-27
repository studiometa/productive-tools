/**
 * Export time entries for a date range.
 *
 * Usage:
 *   productive run examples/time-report.ts --from 2025-01-01 --to 2025-01-31
 *   productive run examples/time-report.ts --from 2025-01-01 --to 2025-01-31 --format csv
 *   productive run examples/time-report.ts --from 2025-01-01 --to 2025-01-31 --mine
 *
 * Flags:
 *   --from <date>    Start date (YYYY-MM-DD), required
 *   --to <date>      End date (YYYY-MM-DD), required
 *   --mine           Filter to your own entries only (default: all team entries)
 *   --format <fmt>   Output format: table (default), csv, or json
 */

import { createScript, defineMeta } from '@studiometa/productive-cli/script';

export const meta = defineMeta({
  name: 'Time Report',
  description: 'Export time entries for a date range.',
  usage: '--from <YYYY-MM-DD> --to <YYYY-MM-DD> [--mine] [--format table|csv|json]',
});

export default createScript(async ({ client, output, flags }) => {
  const from = flags.from as string | undefined;
  const to = flags.to as string | undefined;
  const format = (flags.format as string | undefined) ?? 'table';

  if (!from || !to) {
    output.error('--from and --to are required. Example: --from 2025-01-01 --to 2025-01-31');
    process.exit(1);
  }

  const filter: Record<string, string> = {
    after: from,
    before: to,
  };

  if (flags.mine) {
    filter.person_id = process.env.PRODUCTIVE_USER_ID ?? '';
  }

  const entries = await output.spinner(`Fetching time entries from ${from} to ${to}…`, () =>
    client.time.all({ filter }).toArray(),
  );

  if (entries.length === 0) {
    output.info('No time entries found for the selected period.');
    return;
  }

  // Productive stores time in minutes — convert to decimal hours for readability
  const rows = entries.map((e) => ({
    id: e.id,
    date: e.date,
    hours: (e.time / 60).toFixed(2),
    note: e.note ?? '',
  }));

  const totalMinutes = entries.reduce((sum, e) => sum + e.time, 0);
  const totalHours = (totalMinutes / 60).toFixed(2);

  if (format === 'csv') {
    output.csv(rows);
  } else if (format === 'json') {
    output.json(rows);
  } else {
    output.table(rows);
    output.info(`Total: ${totalHours}h across ${entries.length} entries`);
  }
});
