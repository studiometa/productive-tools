/**
 * MCP integration tests — documentation discovery
 *
 * Exercises the discovery doors end-to-end through the real MCP binary:
 * the global `search_docs` tool, `productive` action=help with a query, and
 * `api_read` search.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { createMcpStdioClient, type McpStdioClient } from '../helpers/mcp-client.js';
import { startMockServer, type MockServer } from '../helpers/mock-server.js';

type Result = { isError?: boolean; content: Array<{ type: string; text?: string }> };

function body(result: Result): Record<string, unknown> {
  const first = result.content[0];
  return first?.type === 'text' ? JSON.parse(first.text ?? '{}') : {};
}

describe('MCP: documentation discovery', () => {
  let mockServer: MockServer;
  let mcp: McpStdioClient;

  beforeAll(async () => {
    mockServer = await startMockServer();
    mcp = await createMcpStdioClient(mockServer.apiUrl);
  });

  afterAll(async () => {
    await mcp.client.close();
    await mcp.sandbox.cleanup();
    await mockServer.close();
  });

  it('lists the search_docs tool', async () => {
    const { tools } = await mcp.client.listTools();
    expect(tools.find((t) => t.name === 'search_docs')).toBeDefined();
  });

  it('search_docs returns a table of contents with no query', async () => {
    const result = (await mcp.client.callTool({ name: 'search_docs', arguments: {} })) as Result;
    const data = body(result);
    const domains = (data.domains as Array<{ domain: string }>).map((d) => d.domain);
    expect(domains).toEqual(['resources', 'api_endpoints', 'run_script']);
  });

  it('search_docs searches across domains with a query', async () => {
    const result = (await mcp.client.callTool({
      name: 'search_docs',
      arguments: { query: 'task' },
    })) as Result;
    const data = body(result);
    expect((data.resources as { count: number }).count).toBeGreaterThan(0);
    expect((data.api_endpoints as { count: number }).count).toBeGreaterThan(0);
  });

  it('search_docs returns full run_script sections (no separate docs tool)', async () => {
    const result = (await mcp.client.callTool({
      name: 'search_docs',
      arguments: { query: 'output' },
    })) as Result;
    const scripting = body(result).run_script as {
      count: number;
      sections: Array<{ title: string; body: string }>;
    };
    expect(scripting.count).toBeGreaterThan(0);
    expect(scripting.sections.some((s) => s.body.includes('output.table'))).toBe(true);
  });

  it('productive action=help with a query searches across resources', async () => {
    const result = (await mcp.client.callTool({
      name: 'productive',
      arguments: { resource: 'tasks', action: 'help', query: 'project' },
    })) as Result;
    const data = body(result);
    expect(Array.isArray(data.matches)).toBe(true);
    expect((data.matches as unknown[]).length).toBeGreaterThan(0);
  });

  it('api_read search discovers endpoints without a path', async () => {
    const result = (await mcp.client.callTool({
      name: 'api_read',
      arguments: { search: 'invoice' },
    })) as Result;
    const data = body(result);
    expect(data.total).toBeGreaterThan(0);
    expect((data.matches as Array<{ path: string }>).some((m) => m.path.includes('invoice'))).toBe(
      true,
    );
  });
});
