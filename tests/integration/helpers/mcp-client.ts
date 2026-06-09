/**
 * MCP client helpers for integration tests.
 *
 * Two variants:
 * - stdio: spawns the real productive-mcp binary via StdioClientTransport
 * - http: sends JSON-RPC requests directly via fetch to the HTTP server
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createSandbox, type Sandbox } from './sandbox.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Path to the compiled MCP stdio entry */
export const MCP_STDIO_BIN = resolve(__dirname, '../../../packages/mcp/dist/index.js');

export interface McpStdioClient {
  client: Client;
  sandbox: Sandbox;
}

/**
 * Spawn the real productive-mcp binary and connect via StdioClientTransport.
 * The child process gets a locked-down env — no real config/keychain access.
 */
export async function createMcpStdioClient(
  mockApiUrl: string,
  extraEnv?: Record<string, string>,
): Promise<McpStdioClient> {
  const sandbox = await createSandbox({ mockApiUrl, extraEnv });

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [MCP_STDIO_BIN],
    env: sandbox.env,
  });

  const client = new Client({ name: 'integration-test-client', version: '1.0.0' });
  await client.connect(transport);

  return { client, sandbox };
}

export interface McpHttpClient {
  call(method: string, params?: unknown, id?: number): Promise<unknown>;
}

/**
 * Create an HTTP MCP client that sends JSON-RPC requests via fetch.
 */
export function createMcpHttpClient(serverUrl: string, token: string): McpHttpClient {
  async function call(method: string, params?: unknown, id = 1): Promise<unknown> {
    const res = await fetch(`${serverUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ jsonrpc: '2.0', method, params, id }),
    });
    return res.json();
  }

  return { call };
}
