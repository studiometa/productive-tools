/**
 * Tests for the run_script handler.
 */

import { describe, it, expect, vi } from 'vitest';

import type { ProductiveCredentials } from '../auth.js';
import type { ToolExecutor } from '../run/bridge.js';
import type { ToolResult } from './types.js';

import { handleRunScript } from './run.js';

const credentials: ProductiveCredentials = {
  apiToken: 'test-token',
  organizationId: 'test-org',
  userId: 'test-user',
};

const enabledEnv = { PRODUCTIVE_MCP_ENABLE_RUN: 'true' } as NodeJS.ProcessEnv;

function jsonOk(data: unknown): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data) }] };
}

function parse(result: ToolResult): Record<string, unknown> {
  if (result.structuredContent) return result.structuredContent as Record<string, unknown>;
  throw new Error('expected structuredContent');
}

function text(result: ToolResult): string {
  const content = result.content[0];
  if (content?.type === 'text') return content.text;
  throw new Error('unexpected result');
}

describe('handleRunScript', () => {
  it('is disabled unless explicitly enabled', async () => {
    const exec = vi.fn() as unknown as ToolExecutor;
    const result = await handleRunScript(
      { code: 'return 1;' },
      credentials,
      exec,
      {} as NodeJS.ProcessEnv,
    );
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('PRODUCTIVE_MCP_ENABLE_RUN');
    expect(exec).not.toHaveBeenCalled();
  });

  it('requires non-empty code', async () => {
    const exec = vi.fn() as unknown as ToolExecutor;
    const result = await handleRunScript({ code: '   ' }, credentials, exec, enabledEnv);
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('code is required');
  });

  it('rejects code exceeding the size limit', async () => {
    const exec = vi.fn() as unknown as ToolExecutor;
    const bigCode = `/*${'x'.repeat(1100)}*/ return 1;`;
    const result = await handleRunScript({ code: bigCode }, credentials, exec, {
      PRODUCTIVE_MCP_ENABLE_RUN: 'true',
      PRODUCTIVE_MCP_RUN_MAX_CODE_KB: '1',
    } as unknown as NodeJS.ProcessEnv);
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('too large');
    expect(exec).not.toHaveBeenCalled();
  });

  it('runs a script and returns its result plus run stats', async () => {
    const exec = vi.fn(async () => jsonOk([{ id: '1' }])) as ToolExecutor;
    const result = await handleRunScript(
      { code: `const t = await productive.tasks.list(); return t.length;` },
      credentials,
      exec,
      enabledEnv,
    );
    const body = parse(result);
    expect(body.result).toBe(1);
    expect(body._run).toMatchObject({ apiCalls: 1, dryRun: false });
    expect(exec).toHaveBeenCalledWith(
      'productive',
      expect.objectContaining({ resource: 'tasks' }),
      credentials,
    );
  });

  it('captures buffered output in structuredContent', async () => {
    const exec = vi.fn(async () => jsonOk({})) as ToolExecutor;
    const result = await handleRunScript(
      { code: `output.json({ hello: 'world' });` },
      credentials,
      exec,
      enabledEnv,
    );
    const body = parse(result);
    expect(body.output).toEqual([{ type: 'json', data: { hello: 'world' } }]);
  });

  it('renders the text block as Markdown', async () => {
    const exec = vi.fn(async () => jsonOk({})) as ToolExecutor;
    const result = await handleRunScript(
      {
        code: `output.table([{ id: 1, name: 'A' }]); return 'done';`,
      },
      credentials,
      exec,
      enabledEnv,
    );
    const md = text(result);
    expect(md).toContain('| id | name |');
    expect(md).toContain('| 1 | A |');
    expect(md).toContain('**Result:**');
    // structuredContent still carries the raw data.
    expect(parse(result).result).toBe('done');
  });

  it('records mutating calls in dry-run mode without executing them', async () => {
    const exec = vi.fn() as unknown as ToolExecutor;
    const result = await handleRunScript(
      {
        code: `await productive.tasks.create({ title: 'X', project_id: '1', task_list_id: '2' }); return 'ok';`,
        dry_run: true,
      },
      credentials,
      exec,
      enabledEnv,
    );
    const body = parse(result);
    expect(body.result).toBe('ok');
    expect(body._run).toMatchObject({ dryRun: true });
    expect((body._run as { recorded: unknown[] }).recorded).toHaveLength(1);
    expect(exec).not.toHaveBeenCalled();
  });

  it('passes args and flags to the script', async () => {
    const exec = vi.fn() as unknown as ToolExecutor;
    const result = await handleRunScript(
      { code: `return { args, flags };`, args: ['a', 1], flags: { mine: true } },
      credentials,
      exec,
      enabledEnv,
    );
    const body = parse(result);
    expect(body.result).toEqual({ args: ['a', '1'], flags: { mine: true } });
  });

  it('returns an error result when the script throws', async () => {
    const exec = vi.fn() as unknown as ToolExecutor;
    const result = await handleRunScript(
      { code: `throw new Error('kaboom');` },
      credentials,
      exec,
      enabledEnv,
    );
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('kaboom');
  });
});
