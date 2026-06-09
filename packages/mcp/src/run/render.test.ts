/**
 * Tests for Markdown rendering of run_script results.
 */

import { describe, it, expect } from 'vitest';

import { renderRunResult } from './render.js';

const noStats = { apiCalls: 0, dryRun: false };

describe('renderRunResult', () => {
  it('renders a table entry as a Markdown table', () => {
    const md = renderRunResult({
      result: null,
      output: [
        {
          type: 'table',
          data: [
            { id: 1, name: 'A' },
            { id: 2, name: 'B' },
          ],
        },
      ],
      run: noStats,
    });
    expect(md).toContain('| id | name |');
    expect(md).toContain('| --- | --- |');
    expect(md).toContain('| 1 | A |');
    expect(md).toContain('| 2 | B |');
  });

  it('uses the union of keys as table columns and escapes pipes', () => {
    const md = renderRunResult({
      result: null,
      output: [{ type: 'table', data: [{ a: 'x|y' }, { b: 2 }] }],
      run: noStats,
    });
    expect(md).toContain('| a | b |');
    expect(md).toContain('x\\|y');
  });

  it('falls back to JSON for a non-tabular table payload', () => {
    const md = renderRunResult({
      result: null,
      output: [{ type: 'table', data: 'not-an-array' }],
      run: noStats,
    });
    expect(md).toContain('```json');
    expect(md).toContain('"not-an-array"');
  });

  it('renders csv entries as a fenced csv block with quoting', () => {
    const md = renderRunResult({
      result: null,
      output: [{ type: 'csv', data: [{ a: 'has,comma', b: 1 }] }],
      run: noStats,
    });
    expect(md).toContain('```csv');
    expect(md).toContain('a,b');
    expect(md).toContain('"has,comma",1');
  });

  it('renders json entries as a fenced json block', () => {
    const md = renderRunResult({
      result: null,
      output: [{ type: 'json', data: { hello: 'world' } }],
      run: noStats,
    });
    expect(md).toContain('```json');
    expect(md).toContain('"hello": "world"');
  });

  it('renders text/log entries as plain lines and labels log levels', () => {
    const md = renderRunResult({
      result: null,
      output: [
        { type: 'text', data: 'plain line' },
        { type: 'warn', data: 'be careful' },
        { type: 'success', data: 'done' },
      ],
      run: noStats,
    });
    expect(md).toContain('plain line');
    expect(md).toContain('⚠️ be careful');
    expect(md).toContain('✅ done');
  });

  it('renders a non-string result as a json block and a string result verbatim', () => {
    expect(renderRunResult({ result: { n: 42 }, output: [], run: noStats })).toContain('"n": 42');
    expect(renderRunResult({ result: 'just text', output: [], run: noStats })).toContain(
      '**Result:**\n\njust text',
    );
  });

  it('omits the result section for null/undefined and notes empty runs', () => {
    const md = renderRunResult({ result: null, output: [], run: noStats });
    expect(md).toContain('no output');
    expect(md).not.toContain('**Result:**');
  });

  it('renders a footer with pluralized call count, dry run, and truncation', () => {
    expect(
      renderRunResult({ result: 1, output: [], run: { apiCalls: 1, dryRun: false } }),
    ).toContain('_1 API call_');
    const md = renderRunResult({
      result: 1,
      output: [],
      run: { apiCalls: 3, dryRun: true, outputTruncated: true, recorded: [{}, {}] },
    });
    expect(md).toContain('3 API calls');
    expect(md).toContain('dry run');
    expect(md).toContain('output truncated');
    expect(md).toContain('2 recorded mutations');
  });
});
