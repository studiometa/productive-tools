/**
 * Scripting-API reference content for `run_script`, surfaced through the global
 * `search_docs` tool (resources / endpoints / scripting all discoverable from
 * one place).
 *
 * This module owns the content as structured sections; `search_docs` is the
 * only consumer (it lists section titles in its table of contents and returns
 * matching section bodies on a query). The resource list is derived from
 * {@link SCRIPT_RESOURCES} so it can't drift from what the prelude exposes.
 */

import { SCRIPT_RESOURCES } from './prelude.js';

export interface DocSection {
  title: string;
  /** One-line description shown in the table of contents. */
  summary: string;
  keywords: string[];
  body: string;
}

export const DOC_SECTIONS: DocSection[] = [
  {
    title: 'Overview',
    summary: 'What run_script is and how the sandbox works.',
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
    summary: 'productive(...) and per-resource list/get/create/update accessors.',
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
      'Results mirror the `productive` tool: `list` returns `{ data, meta }` (e.g. `meta.total_count`),',
      'and records are flattened — read field keys directly (e.g. `id`, `name`, `number`), not JSON:API',
      '`.type`/`.attributes`. Pass `opts` like `{ per_page: 50 }` to bound large queries.',
      '',
      "Example: `const { data } = await productive.tasks.list({ status: 'open' }, { per_page: 50 });`",
    ].join('\n'),
  },
  {
    title: 'api client (raw)',
    summary: 'api.read / api.write for raw API endpoints.',
    keywords: ['api', 'read', 'write', 'raw', 'endpoint', 'path', 'fetch'],
    body: [
      '`api.read(path, opts?)` — raw GET, e.g. `await api.read("/invoices", { page: 2 })`.',
      '`api.write(method, path, body)` — raw POST/PATCH/PUT/DELETE (requires api_write enabled on the server).',
    ].join('\n'),
  },
  {
    title: 'output helpers',
    summary: 'output.json/table/csv/log/... and how they render.',
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
    summary: 'Inputs (args, flags) and returning a result.',
    keywords: ['args', 'flags', 'input', 'parameters', 'return', 'result'],
    body: [
      '`args` (string[]) and `flags` (object) are the values passed in the tool call.',
      '`return <value>` surfaces a JSON-serializable result (also available as `structuredContent.result`).',
    ].join('\n'),
  },
  {
    title: 'resources & actions',
    summary: 'Available resources and how to discover their filters/fields.',
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
    summary: 'Preview mutations without executing them (dry_run).',
    keywords: ['dry_run', 'dry', 'preview', 'mutation', 'safe'],
    body: 'Pass `dry_run: true` to record mutating calls (create/update/delete/start/stop/...) instead of executing them; they are listed under `_run.recorded`.',
  },
  {
    title: 'limits & gating',
    summary: 'Timeouts, memory, budgets, and the enable flag.',
    keywords: ['limit', 'limits', 'timeout', 'memory', 'budget', 'gating', 'enable', 'disabled'],
    body: [
      'Disabled unless the server sets `PRODUCTIVE_MCP_ENABLE_RUN=true`.',
      'Operator-tunable per-run limits: wall-clock timeout, memory, API-call budget, output size, code size.',
    ].join(' '),
  },
  {
    title: 'example',
    summary: 'A complete example script.',
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

/** Section titles, for the documentation table of contents. */
export function docSectionTitles(): string[] {
  return DOC_SECTIONS.map((section) => section.title);
}

/** Find scripting-doc sections matching a query (title, keywords, or body). */
export function findDocSections(query: string): DocSection[] {
  const q = query.trim().toLowerCase();
  if (q === '') return [];
  return DOC_SECTIONS.filter(
    (section) =>
      section.title.toLowerCase().includes(q) ||
      section.keywords.some((k) => k.includes(q) || q.includes(k)) ||
      section.body.toLowerCase().includes(q),
  );
}
