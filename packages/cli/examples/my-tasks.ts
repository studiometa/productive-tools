/**
 * List open tasks assigned to the current user.
 *
 * Usage:
 *   productive run examples/my-tasks.ts
 *   productive run examples/my-tasks.ts --limit 10
 *   productive run examples/my-tasks.ts --limit 50 --overdue-only
 */

import { createScript, defineMeta } from '@studiometa/productive-cli/script';

export const meta = defineMeta({
  name: 'My Tasks',
  description: 'List open tasks assigned to you.',
  usage: '[--limit <n>] [--overdue-only]',
});

export default createScript(async ({ client, output, flags }) => {
  const limit = flags.limit ? Number(flags.limit) : 20;
  const overdueOnly = flags['overdue-only'] === true;

  const tasks = await output.spinner('Fetching tasks…', () =>
    client.tasks
      .all({ filter: { assignee_id: process.env.PRODUCTIVE_USER_ID, status: '1' } })
      .toArray(),
  );

  const today = new Date().toISOString().slice(0, 10);

  const filtered = overdueOnly
    ? tasks.filter((t) => t.due_date != null && t.due_date < today)
    : tasks;

  if (filtered.length === 0) {
    output.info(overdueOnly ? 'No overdue tasks — nice work!' : 'No open tasks assigned to you.');
    return;
  }

  output.table(
    filtered.slice(0, limit).map((t) => ({
      id: t.id,
      title: t.title,
      due: t.due_date ?? '—',
      overdue: t.due_date != null && t.due_date < today ? '⚠' : '',
    })),
  );

  if (filtered.length > limit) {
    output.info(`Showing ${limit} of ${filtered.length} tasks. Increase --limit to see more.`);
  }
});
