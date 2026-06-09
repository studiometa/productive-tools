/**
 * Scripting-API reference for `run_script`, served by the companion
 * `run_script_search_docs` tool.
 *
 * Keeping the full reference here (returned in a tool *response*) rather than in
 * the `run_script` tool's `inputSchema`/`description` keeps the tool definition
 * small while still making the API discoverable on demand.
 *
 * The resource list is derived from {@link SCRIPT_RESOURCES} so it can't drift
 * from what the prelude actually exposes.
 */

import { SCRIPT_RESOURCES } from './prelude.js';

export interface DocSection {
  title: string;
  keywords: string[];
  body: string;
}

export const DOC_SECTIONS: DocSection[] = [
  {
    title: 'Overview',
    keywords: ['overview', 'intro', 'sandbox', 'how', 'start'],
    body: [
      '`run_script` runs JavaScript/TypeScript in a sandboxed QuickJS isolate. There is no direct',
      'network or filesystem access — the injected client performs Productive API calls on the host.',
      'Write code using the globals below and `return` a value to surface it as the result.',
      'No `import`/`require`: use the injected globals only.',
    ].join(' '),
  },
  {
    title: 'productive client',
    keywords: [
      'productive',
      'client',
      'resource',
      'action',
      'list',
      'get',
      'create',
      'update',
      'call',
    ],
    body: [
      '`productive(resource, action, params)` — low-level call, mirrors the `productive` tool.',
      'Per-resource accessors (all async — `await` them):',
      '- `productive.<resource>.list(filter?, opts?)`',
      '- `productive.<resource>.get(id, opts?)`',
      '- `productive.<resource>.create(params)`',
      '- `productive.<resource>.update(id, params)`',
      '',
      "Example: `const tasks = await productive.tasks.list({ status: 'open' });`",
    ].join('\n'),
  },
  {
    title: 'api client (raw)',
    keywords: ['api', 'read', 'write', 'raw', 'endpoint', 'path', 'fetch'],
    body: [
      '`api.read(path, opts?)` — raw GET, e.g. `await api.read("/invoices", { page: 2 })`.',
      '`api.write(method, path, body)` — raw POST/PATCH/PUT/DELETE (requires api_write enabled on the server).',
    ].join('\n'),
  },
  {
    title: 'output helpers',
    keywords: [
      'output',
      'table',
      'csv',
      'json',
      'log',
      'print',
      'info',
      'warn',
      'error',
      'success',
      'render',
    ],
    body: [
      'Buffer output that is returned alongside the result and rendered to Markdown:',
      '- `output.json(data)` — fenced JSON block',
      '- `output.table(rows)` — Markdown table (rows = array of objects)',
      '- `output.csv(rows)` — fenced CSV block',
      '- `output.text(s)` / `output.log(...args)` — plain lines',
      '- `output.info/warn/error/success(msg)` — labelled lines',
    ].join('\n'),
  },
  {
    title: 'args, flags & result',
    keywords: ['args', 'flags', 'input', 'parameters', 'return', 'result'],
    body: [
      '`args` (string[]) and `flags` (object) are the values passed in the tool call.',
      '`return <value>` surfaces a JSON-serializable result (also available as `structuredContent.result`).',
    ].join('\n'),
  },
  {
    title: 'resources & actions',
    keywords: ['resources', 'actions', 'help', 'schema', 'filters', 'fields', 'includes'],
    body: [
      `Resource accessors: ${SCRIPT_RESOURCES.join(', ')}.`,
      'Actions, filters, and fields mirror the `productive` tool — call `productive` with action="help"',
      'or action="schema" for a resource to discover them. Use the low-level',
      '`productive(resource, action, params)` for actions without an accessor (e.g. delete, resolve,',
      'reports, summaries, workflows).',
    ].join(' '),
  },
  {
    title: 'dry run',
    keywords: ['dry_run', 'dry', 'preview', 'mutation', 'safe'],
    body: 'Pass `dry_run: true` to record mutating calls (create/update/delete/start/stop/...) instead of executing them; they are listed under `_run.recorded`.',
  },
  {
    title: 'limits & gating',
    keywords: ['limit', 'limits', 'timeout', 'memory', 'budget', 'gating', 'enable', 'disabled'],
    body: [
      'Disabled unless the server sets `PRODUCTIVE_MCP_ENABLE_RUN=true`.',
      'Operator-tunable per-run limits: wall-clock timeout, memory, API-call budget, output size, code size.',
    ].join(' '),
  },
  {
    title: 'example',
    keywords: ['example', 'examples', 'sample'],
    body: [
      '```js',
      'const projects = await productive.projects.list();',
      'const open = await productive.tasks.list({ status: "open" });',
      'output.json({ projects: projects, openTasks: open });',
      "return 'summary ready';",
      '```',
    ].join('\n'),
  },
];

/** Render a single section as Markdown. */
function renderSection(section: DocSection): string {
  return `## ${section.title}\n\n${section.body}`;
}

/**
 * Return the scripting-API reference, optionally filtered by a query. With no
 * query the full reference is returned; with a query, only matching sections
 * (falling back to a topic index when nothing matches).
 */
export function searchDocs(query?: string): string {
  const header = '# run_script scripting API';
  const q = query?.trim().toLowerCase();

  if (!q) {
    return `${header}\n\n${DOC_SECTIONS.map(renderSection).join('\n\n')}`;
  }

  const matches = DOC_SECTIONS.filter(
    (section) =>
      section.title.toLowerCase().includes(q) ||
      section.keywords.some((k) => k.includes(q) || q.includes(k)) ||
      section.body.toLowerCase().includes(q),
  );

  if (matches.length === 0) {
    const topics = DOC_SECTIONS.map((s) => s.title).join(', ');
    return `${header}\n\nNo sections matched "${query}". Available topics: ${topics}.`;
  }

  return `${header}\n\n${matches.map(renderSection).join('\n\n')}`;
}
