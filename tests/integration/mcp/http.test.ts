/**
 * MCP integration tests — HTTP transport
 *
 * Starts the real MCP HTTP server (h3) and sends JSON-RPC requests via fetch.
 * Uses PRODUCTIVE_BASE_URL env var to redirect API calls to the mock server.
 *
 * Token format: base64(organizationId:apiToken:userId)
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:http';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { startMockServer, type MockServer } from '../helpers/mock-server.js';
import { createSandbox, type Sandbox } from '../helpers/sandbox.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MCP_SERVER_BIN = resolve(__dirname, '../../../packages/mcp/dist/server.js');

/** Valid Bearer token: base64(test-org-456:test-token-123:test-user-789) */
const VALID_BEARER = Buffer.from('test-org-456:test-token-123:test-user-789').toString('base64');

/** Find a free TCP port */
async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      srv.close(() => {
        if (!addr || typeof addr === 'string') {
          reject(new Error('Could not get port'));
        } else {
          resolve(addr.port);
        }
      });
    });
  });
}

/** Wait until the HTTP server is reachable */
async function waitForServer(url: string, timeout = 10_000): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${url}/health`);
      if (res.ok) return;
    } catch {
      // Not yet up
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Server at ${url} did not start within ${timeout}ms`);
}

describe('MCP: HTTP transport', () => {
  let mockProductiveApi: MockServer;
  let sandbox: Sandbox;
  let mcpServerProcess: ChildProcess;
  let mcpServerUrl: string;

  beforeAll(async () => {
    mockProductiveApi = await startMockServer();
    sandbox = await createSandbox({ mockApiUrl: mockProductiveApi.apiUrl });

    const mcpPort = await getFreePort();
    mcpServerUrl = `http://127.0.0.1:${mcpPort}`;

    // Start the real MCP HTTP server with sandbox env
    mcpServerProcess = spawn(process.execPath, [MCP_SERVER_BIN], {
      env: {
        ...sandbox.env,
        PORT: String(mcpPort),
        HOST: '127.0.0.1',
      },
      stdio: 'pipe',
    });

    await waitForServer(mcpServerUrl);
  });

  afterAll(async () => {
    mcpServerProcess.kill('SIGTERM');
    await sandbox.cleanup();
    await mockProductiveApi.close();
  });

  async function mcpCall(method: string, params?: unknown, id = 1): Promise<{
    status: number;
    body: unknown;
  }> {
    const res = await fetch(`${mcpServerUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'MCP-Protocol-Version': '2025-11-25',
        Authorization: `Bearer ${VALID_BEARER}`,
      },
      body: JSON.stringify({ jsonrpc: '2.0', method, params, id }),
    });
    return {
      status: res.status,
      body: await res.json(),
    };
  }

  it('should respond to health check', async () => {
    const res = await fetch(`${mcpServerUrl}/health`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body).toMatchObject({ status: 'ok' });
  });

  it('should handle initialize method', async () => {
    const { status, body } = await mcpCall('initialize', {
      protocolVersion: '2025-11-25',
      clientInfo: { name: 'test', version: '1.0.0' },
      capabilities: {},
    });

    expect(status).toBe(200);
    expect(body).toMatchObject({
      jsonrpc: '2.0',
      result: {
        protocolVersion: '2025-11-25',
        serverInfo: { name: 'productive-mcp', version: expect.any(String) },
      },
    });
  });

  it('should list tools via tools/list', async () => {
    const { status, body } = (await mcpCall('tools/list')) as {
      status: number;
      body: { result?: { tools: Array<{ name: string }> } };
    };

    expect(status).toBe(200);
    expect(body).toMatchObject({
      jsonrpc: '2.0',
      result: { tools: expect.any(Array) },
    });

    const tools = body.result?.tools ?? [];
    const productiveTool = tools.find((t) => t.name === 'productive');
    expect(productiveTool).toBeDefined();
  });

  it('should call productive tool for projects list', async () => {
    const { status, body } = (await mcpCall('tools/call', {
      name: 'productive',
      arguments: { resource: 'projects', action: 'list' },
    })) as {
      status: number;
      body: { result?: { content: Array<{ type: string; text: string }> } };
    };

    expect(status).toBe(200);
    expect(body).toMatchObject({
      jsonrpc: '2.0',
      result: {
        content: expect.any(Array),
      },
    });

    const text = body.result?.content[0]?.text ?? '';
    expect(text).toContain('Alpha Website');
  });

  it('should return 401 without auth header and advertise the protected resource metadata', async () => {
    const res = await fetch(`${mcpServerUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'MCP-Protocol-Version': '2025-11-25',
      },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/list', id: 1 }),
    });

    expect(res.status).toBe(401);
    expect(res.headers.get('www-authenticate')).toContain(
      '/.well-known/oauth-protected-resource/mcp',
    );
  });

  it('should reject malformed bearer tokens without creating server-side session state', async () => {
    const res = await fetch(`${mcpServerUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'MCP-Protocol-Version': '2025-11-25',
        Authorization: 'Bearer not-base64',
      },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/list', id: 1 }),
    });

    expect(res.status).toBe(401);
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('should return error for unknown JSON-RPC method', async () => {
    const { status, body } = (await mcpCall('unknown/method')) as {
      status: number;
      body: { error?: { code: number } };
    };

    expect(status).toBe(200);
    expect(body).toMatchObject({
      jsonrpc: '2.0',
      error: { code: -32601 },
    });
  });
});
