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

function textOf(result: { content: Array<{ type: string; text?: string }> }): string {
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

  it('exposes run_script in the tool list', async () => {
    const { tools } = await enabled.client.listTools();
    expect(tools.find((t) => t.name === 'run_script')).toBeDefined();
  });

  it('runs a script that fetches data through the bridge', async () => {
    const result = (await enabled.client.callTool({
      name: 'run_script',
      arguments: {
        code: `
          const projects = await productive.projects.list();
          output.json(projects);
          return Array.isArray(projects) ? projects.length : 'not-array';
        `,
      },
    })) as { isError?: boolean; content: Array<{ type: string; text?: string }> };

    expect(result.isError).toBeFalsy();
    const text = textOf(result);
    expect(text).toContain('Alpha Website');
    expect(text).toContain('"apiCalls": 1');
  });

  it('exposes args and flags to the script', async () => {
    const result = (await enabled.client.callTool({
      name: 'run_script',
      arguments: {
        code: `return { got: args, mine: flags.mine };`,
        args: ['hello'],
        flags: { mine: true },
      },
    })) as { isError?: boolean; content: Array<{ type: string; text?: string }> };

    expect(result.isError).toBeFalsy();
    const body = JSON.parse(textOf(result));
    expect(body.result).toEqual({ got: ['hello'], mine: true });
  });

  it('records mutations in dry-run mode without calling the API', async () => {
    const result = (await enabled.client.callTool({
      name: 'run_script',
      arguments: {
        code: `await productive.tasks.create({ title: 'New', project_id: '101', task_list_id: '1' }); return 'done';`,
        dry_run: true,
      },
    })) as { isError?: boolean; content: Array<{ type: string; text?: string }> };

    expect(result.isError).toBeFalsy();
    const body = JSON.parse(textOf(result));
    expect(body.result).toBe('done');
    expect(body._run.dryRun).toBe(true);
    expect(body._run.recorded).toHaveLength(1);
  });

  it('surfaces guest errors as an error result', async () => {
    const result = (await enabled.client.callTool({
      name: 'run_script',
      arguments: { code: `throw new Error('script failed');` },
    })) as { isError?: boolean; content: Array<{ type: string; text?: string }> };

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('script failed');
  });

  it('is disabled by default', async () => {
    const result = (await disabled.client.callTool({
      name: 'run_script',
      arguments: { code: `return 1;` },
    })) as { isError?: boolean; content: Array<{ type: string; text?: string }> };

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('PRODUCTIVE_MCP_ENABLE_RUN');
  });
});
