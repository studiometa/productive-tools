/**
 * Log a time entry for today (or a custom date).
 *
 * Requires a service ID — find one with: productive services list
 *
 * Usage:
 *   productive run examples/log-time.ts --service-id <id> --hours 2
 *   productive run examples/log-time.ts --service-id <id> --hours 1.5 --note "Fixed login bug"
 *   productive run examples/log-time.ts --service-id <id> --hours 3 --date 2025-01-15
 *
 *   # Preview without creating anything:
 *   productive run --dry-run examples/log-time.ts --service-id <id> --hours 2
 *
 * Flags:
 *   --service-id <id>   Service (budget line) to log time against, required
 *   --hours <n>         Hours to log (decimals ok: 1.5 = 1h30), required
 *   --note <text>       Optional note for the time entry
 *   --date <YYYY-MM-DD> Date to log for (default: today)
 */

import { createScript, defineMeta } from '@studiometa/productive-cli/script';

export const meta = defineMeta({
  name: 'Log Time',
  description: 'Log a time entry for today or a custom date.',
  usage: '--service-id <id> --hours <n> [--note <text>] [--date <YYYY-MM-DD>]',
});

export default createScript(async ({ client, output, flags }) => {
  const serviceId = flags['service-id'] as string | undefined;
  const hoursRaw = flags.hours as string | number | undefined;
  const note = flags.note as string | undefined;
  const date = (flags.date as string | undefined) ?? new Date().toISOString().slice(0, 10);

  if (!serviceId) {
    output.error('--service-id is required. Find service IDs with: productive services list');
    process.exit(1);
  }
  if (hoursRaw == null) {
    output.error('--hours is required. Example: --hours 2 or --hours 1.5');
    process.exit(1);
  }

  const hours = Number(hoursRaw);
  if (Number.isNaN(hours) || hours <= 0) {
    output.error(`Invalid --hours value: "${hoursRaw}". Must be a positive number.`);
    process.exit(1);
  }

  const minutes = Math.round(hours * 60);
  const personId = process.env.PRODUCTIVE_USER_ID;

  if (!personId) {
    output.error('PRODUCTIVE_USER_ID is not set. Run: productive whoami');
    process.exit(1);
  }

  const spin = output.spinner(`Logging ${hours}h on service ${serviceId} for ${date}…`);

  const entry = await client.time
    .create({ person_id: personId, service_id: serviceId, date, time: minutes, note })
    .catch((err: unknown) => {
      spin.fail(err instanceof Error ? err.message : String(err));
      process.exit(1);
    });

  spin.stop(`Logged ${hours}h (entry #${entry.data.id})`);
  output.success(`${hours}h logged on ${date}${note ? ` — "${note}"` : ''}`);
});
