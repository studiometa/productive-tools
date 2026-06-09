/**
 * MCP integration tests — run_script tool
 *
 * Spawns the real productive-mcp binary and drives the sandboxed run_script
 * tool end-to-end against the JSON:API mock server. The script reaches the
 * mock API only through the host bridge.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { createMcpStdioClient, type McpStdioClient } from '../helpers/mcp-client.js';
import { startMockServer, type MockServer } from '../helpers/mock-server.js';

type RunResult = {
  isError?: boolean;
  content: Array<{ type: string; text?: string }>;
  structuredContent?: { result?: unknown; output?: unknown; _run?: Record<string, unknown> };
};

function textOf(result: RunResult): string {
  const first = result.content[0];
  return first?.type === 'text' ? (first.text ?? '') : '';
}

describe('MCP: run_script tool', () => {
  let mockServer: MockServer;
  let enabled: McpStdioClient;
  let disabled: McpStdioClient;

  beforeAll(async () => {
    mockServer = await startMockServer();
    enabled = await createMcpStdioClient(mockServer.apiUrl, { PRODUCTIVE_MCP_ENABLE_RUN: 'true' });
    disabled = await createMcpStdioClient(mockServer.apiUrl);
  });

  afterAll(async () => {
    await enabled.client.close();
    await disabled.client.close();
    await enabled.sandbox.cleanup();
    await disabled.sandbox.cleanup();
    await mockServer.close();
  });

  it('exposes run_script and its docs tool in the tool list', async () => {
    const { tools } = await enabled.client.listTools();
    expect(tools.find((t) => t.name === 'run_script')).toBeDefined();
    expect(tools.find((t) => t.name === 'run_script_search_docs')).toBeDefined();
  });

  it('serves the scripting API reference via run_script_search_docs', async () => {
    const result = (await enabled.client.callTool({
      name: 'run_script_search_docs',
      arguments: { query: 'table' },
    })) as RunResult;

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toContain('output.table');
  });

  it('runs a script that fetches data through the bridge', async () => {
    const result = (await enabled.client.callTool({
      name: 'run_script',
      arguments: {
        code: `
          const projects = await productive.projects.list();
          output.json(projects);
          return 'fetched';
        `,
      },
    })) as RunResult;

    expect(result.isError).toBeFalsy();
    // Markdown text block carries the rendered json output...
    expect(textOf(result)).toContain('Alpha Website');
    // ...and structuredContent carries the machine-readable result + stats.
    expect(result.structuredContent?.result).toBe('fetched');
    expect(result.structuredContent?._run?.apiCalls).toBe(1);
  });

  it('exposes args and flags to the script', async () => {
    const result = (await enabled.client.callTool({
      name: 'run_script',
      arguments: {
        code: `return { got: args, mine: flags.mine };`,
        args: ['hello'],
        flags: { mine: true },
      },
    })) as RunResult;

    expect(result.isError).toBeFalsy();
    expect(result.structuredContent?.result).toEqual({ got: ['hello'], mine: true });
  });

  it('records mutations in dry-run mode without calling the API', async () => {
    const result = (await enabled.client.callTool({
      name: 'run_script',
      arguments: {
        code: `await productive.tasks.create({ title: 'New', project_id: '101', task_list_id: '1' }); return 'done';`,
        dry_run: true,
      },
    })) as RunResult;

    expect(result.isError).toBeFalsy();
    const sc = result.structuredContent;
    expect(sc?.result).toBe('done');
    expect((sc?._run as { dryRun?: boolean })?.dryRun).toBe(true);
    expect((sc?._run as { recorded?: unknown[] })?.recorded).toHaveLength(1);
  });

  it('surfaces guest errors as an error result', async () => {
    const result = (await enabled.client.callTool({
      name: 'run_script',
      arguments: { code: `throw new Error('script failed');` },
    })) as RunResult;

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('script failed');
  });

  it('is disabled by default', async () => {
    const result = (await disabled.client.callTool({
      name: 'run_script',
      arguments: { code: `return 1;` },
    })) as RunResult;

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('PRODUCTIVE_MCP_ENABLE_RUN');
  });
});
