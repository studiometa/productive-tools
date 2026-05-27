/**
 * List active projects, with optional search and format flags.
 *
 * Usage:
 *   productive run examples/project-list.ts
 *   productive run examples/project-list.ts --include-archived
 *   productive run examples/project-list.ts --search "website"
 *   productive run examples/project-list.ts --format json
 *
 * Flags:
 *   --search <term>      Filter projects by name (case-insensitive substring match)
 *   --include-archived   Include archived projects (default: active only)
 *   --format <fmt>       Output format: table (default), csv, or json
 */

import { createScript, defineMeta } from '@studiometa/productive-cli/script';

export const meta = defineMeta({
  name: 'Project List',
  description: 'List active projects with optional search and format.',
  usage: '[--search <term>] [--include-archived] [--format table|csv|json]',
});

export default createScript(async ({ client, output, flags }) => {
  const search = flags.search as string | undefined;
  const includeArchived = flags['include-archived'] === true;
  const format = (flags.format as string | undefined) ?? 'table';

  const filter: Record<string, string> = {};
  if (!includeArchived) filter.status = 'active';

  const projects = await output.spinner('Fetching projects…', () =>
    client.projects.all({ filter }).toArray(),
  );

  const matched = search
    ? projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects;

  if (matched.length === 0) {
    output.info(search ? `No projects matching "${search}".` : 'No projects found.');
    return;
  }

  const rows = matched.map((p) => ({
    id: p.id,
    number: p.project_number ?? '—',
    name: p.name,
    archived: p.archived ? 'yes' : 'no',
  }));

  if (format === 'csv') {
    output.csv(rows);
  } else if (format === 'json') {
    output.json(rows);
  } else {
    output.table(rows);
    output.info(`${matched.length} project${matched.length === 1 ? '' : 's'} found`);
  }
});
