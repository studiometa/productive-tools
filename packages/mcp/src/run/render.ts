/**
 * Markdown rendering for `run_script` results.
 *
 * The tool returns two things (per the MCP structured-output convention):
 * - `structuredContent` — the raw `{ result, output, _run }` object for hosts
 *   that consume structured tool output;
 * - a `text` content block — this human-facing Markdown rendering, so clients
 *   that only display text still get formatted tables/JSON/logs rather than a
 *   single opaque JSON blob.
 *
 * MCP has no "table" content type, so "rendering" here means producing Markdown
 * (tables, fenced code blocks, labelled lines).
 */

import type { OutputEntry } from './engine.js';

export interface RunStats {
  apiCalls: number;
  dryRun: boolean;
  outputTruncated?: boolean;
  recorded?: unknown[];
}

export interface RunRenderInput {
  result: unknown;
  output: OutputEntry[];
  run: RunStats;
}

/** Labels for log-style output entries. */
const LOG_LABELS: Record<string, string> = {
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
  success: '✅',
};

/** Escape a value for use inside a Markdown table cell. */
function cell(value: unknown): string {
  const text =
    value === null || value === undefined
      ? ''
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);
  return text.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

/** Whether a value is a plain (non-array, non-null) object. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Render an array of objects as a Markdown table. */
function markdownTable(rows: Record<string, unknown>[]): string {
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  if (columns.length === 0) return '_(no columns)_';
  const header = `| ${columns.join(' | ')} |`;
  const divider = `| ${columns.map(() => '---').join(' | ')} |`;
  const body = rows.map((row) => `| ${columns.map((c) => cell(row[c])).join(' | ')} |`).join('\n');
  return `${header}\n${divider}\n${body}`;
}

/** Build one row of CSV with RFC-4180-style quoting. */
function csvRow(values: unknown[]): string {
  return values
    .map((v) => {
      const text =
        v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    })
    .join(',');
}

/** Render an array of objects as CSV. */
function toCsv(rows: Record<string, unknown>[]): string {
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const lines = [csvRow(columns), ...rows.map((row) => csvRow(columns.map((c) => row[c])))];
  return lines.join('\n');
}

/** Fenced code block. */
function fence(lang: string, body: string): string {
  return `\`\`\`${lang}\n${body}\n\`\`\``;
}

/** Render a single output entry to Markdown. */
function renderEntry(entry: OutputEntry): string {
  const { type, data } = entry;
  switch (type) {
    case 'table':
      return Array.isArray(data) && data.length > 0 && data.every(isPlainObject)
        ? markdownTable(data as Record<string, unknown>[])
        : fence('json', JSON.stringify(data, null, 2));
    case 'csv':
      return Array.isArray(data) && data.length > 0 && data.every(isPlainObject)
        ? fence('csv', toCsv(data as Record<string, unknown>[]))
        : fence('json', JSON.stringify(data, null, 2));
    case 'json':
      return fence('json', JSON.stringify(data, null, 2));
    case 'text':
    case 'log':
      return String(data);
    default:
      return `${LOG_LABELS[type] ?? `[${type}]`} ${String(data)}`;
  }
}

/** Render the run footer (stats line). */
function renderFooter(run: RunStats): string {
  const bits = [`${run.apiCalls} API call${run.apiCalls === 1 ? '' : 's'}`];
  if (run.dryRun) bits.push('dry run');
  if (run.outputTruncated) bits.push('output truncated');
  if (run.recorded && run.recorded.length > 0) {
    bits.push(`${run.recorded.length} recorded mutation${run.recorded.length === 1 ? '' : 's'}`);
  }
  return `—\n_${bits.join(' · ')}_`;
}

/**
 * Render a run result as human-facing Markdown.
 */
export function renderRunResult(input: RunRenderInput): string {
  const sections: string[] = [];

  if (input.output.length > 0) {
    sections.push(input.output.map(renderEntry).join('\n\n'));
  }

  if (input.result !== null && input.result !== undefined) {
    const body =
      typeof input.result === 'string'
        ? input.result
        : fence('json', JSON.stringify(input.result, null, 2));
    sections.push(`**Result:**\n\n${body}`);
  }

  if (sections.length === 0) {
    sections.push('_Script completed with no output._');
  }

  sections.push(renderFooter(input.run));
  return sections.join('\n\n');
}
