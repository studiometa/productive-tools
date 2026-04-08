import { toNodeHandler } from 'h3';
import { createServer, type Server as HttpServer } from 'node:http';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./handlers.js', () => ({
  executeToolWithCredentials: vi.fn().mockImplementation((name, args, _credentials) => {
    if (name === 'failing_tool') {
      throw new Error('Tool execution failed');
    }

    return Promise.resolve({
      content: [{ type: 'text', text: JSON.stringify({ tool: name, args }) }],
    });
  }),
}));

vi.mock('./resources.js', () => ({
  listResources: vi.fn().mockReturnValue([
    {
      uri: 'productive://schema',
      name: 'Schema',
      description: 'Schema overview',
      mimeType: 'application/json',
    },
    {
      uri: 'productive://instructions',
      name: 'Instructions',
      description: 'Instructions',
      mimeType: 'application/json',
    },
  ]),
  listResourceTemplates: vi.fn().mockReturnValue([
    {
      uriTemplate: 'productive://projects/{id}',
      name: 'Project',
      description: 'Project details',
      mimeType: 'application/json',
    },
  ]),
  readResource: vi.fn().mockImplementation((uri: string) => {
    if (uri === 'productive://unknown') {
      throw new Error('Unknown resource URI: productive://unknown');
    }

    return Promise.resolve({
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ uri }) }],
    });
  }),
}));

import { executeToolWithCredentials } from './handlers.js';
import { createHttpApp } from './http.js';
import { listResources, listResourceTemplates, readResource } from './resources.js';
import { VERSION } from './version.js';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json, text/event-stream',
  'MCP-Protocol-Version': '2025-11-25',
};

describe('HTTP Server Integration', () => {
  let server: HttpServer;
  let baseUrl: string;

  const validToken = Buffer.from('test-org:test-token:test-user').toString('base64');

  beforeAll(async () => {
    const app = createHttpApp();
    server = createServer(toNodeHandler(app));

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        if (address && typeof address === 'object') {
          baseUrl = `http://127.0.0.1:${address.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function mcpCall(method: string, params?: unknown, id: string | number | null = 1) {
    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        ...JSON_HEADERS,
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({ jsonrpc: '2.0', method, params, id }),
    });

    const data = await response.json();
    return { response, data };
  }

  describe('health endpoints', () => {
    it('GET / should return service info', async () => {
      const response = await fetch(`${baseUrl}/`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        status: 'ok',
        service: 'productive-mcp',
        version: VERSION,
      });
    });

    it('GET /health should return ok', async () => {
      const response = await fetch(`${baseUrl}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ status: 'ok' });
    });
  });

  describe('auth and metadata', () => {
    it('should return 401 without auth header', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ jsonrpc: '2.0', method: 'initialize', id: 1 }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe(-32001);
      expect(response.headers.get('www-authenticate')).toContain(
        '/.well-known/oauth-protected-resource/mcp',
      );
      expect(response.headers.get('set-cookie')).toBeNull();
    });

    it('should return protected resource metadata from the canonical MCP path', async () => {
      const response = await fetch(`${baseUrl}/.well-known/oauth-protected-resource/mcp`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.resource).toContain('/mcp');
      expect(data.authorization_servers).toHaveLength(1);
      expect(data.scopes_supported).toContain('productive');
      expect(data.bearer_methods_supported).toContain('header');
    });

    it('should not expose the legacy protected resource metadata path', async () => {
      const response = await fetch(`${baseUrl}/.well-known/oauth-protected-resource`);

      expect(response.status).toBe(404);
    });
  });

  describe('MCP over SDK Streamable HTTP route', () => {
    it('should accept valid Bearer token and initialize', async () => {
      const { response, data } = await mcpCall('initialize', {
        protocolVersion: '2025-11-25',
        clientInfo: { name: 'test', version: '1.0.0' },
        capabilities: {},
      });

      expect(response.status).toBe(200);
      expect(data.result.serverInfo.name).toBe('productive-mcp');
      expect(data.result.protocolVersion).toBe('2025-11-25');
      expect(data.result.capabilities.tools).toEqual({});
      expect(data.result.capabilities.resources).toEqual({});
    });

    it('should list tools', async () => {
      const { response, data } = await mcpCall('tools/list');

      expect(response.status).toBe(200);
      expect(data.result.tools).toBeDefined();
      expect(Array.isArray(data.result.tools)).toBe(true);
      expect(data.result.tools.find((tool: { name: string }) => tool.name === 'productive')).toBeDefined();
    });

    it('should call tools/call with stateless credentials', async () => {
      const { response, data } = await mcpCall('tools/call', {
        name: 'productive',
        arguments: { resource: 'projects', action: 'list', page: 1 },
      });

      expect(response.status).toBe(200);
      expect(data.result.content).toBeDefined();
      expect(executeToolWithCredentials).toHaveBeenCalledWith(
        'productive',
        { resource: 'projects', action: 'list', page: 1 },
        {
          organizationId: 'test-org',
          apiToken: 'test-token',
          userId: 'test-user',
        },
      );
    });

    it('should surface tool execution failures as JSON-RPC errors', async () => {
      const { response, data } = await mcpCall('tools/call', {
        name: 'failing_tool',
        arguments: {},
      });

      expect(response.status).toBe(200);
      expect(data.error).toBeDefined();
      expect(data.error.message).toContain('Tool execution failed');
    });

    it('should preserve request id', async () => {
      const { data } = await mcpCall(
        'initialize',
        {
          protocolVersion: '2025-11-25',
          clientInfo: { name: 'test', version: '1.0.0' },
          capabilities: {},
        },
        'custom-id-123',
      );

      expect(data.id).toBe('custom-id-123');
    });

    it('should treat missing id as a notification and return no body', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          ...JSON_HEADERS,
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/list' }),
      });
      const text = await response.text();

      expect(response.status).toBe(202);
      expect(text).toBe('');
    });

    it('should handle resources/list', async () => {
      const { response, data } = await mcpCall('resources/list');

      expect(response.status).toBe(200);
      expect(Array.isArray(data.result.resources)).toBe(true);
      expect(listResources).toHaveBeenCalled();
    });

    it('should handle resources/templates/list', async () => {
      const { response, data } = await mcpCall('resources/templates/list');

      expect(response.status).toBe(200);
      expect(Array.isArray(data.result.resourceTemplates)).toBe(true);
      expect(listResourceTemplates).toHaveBeenCalled();
    });

    it('should handle resources/read', async () => {
      const { response, data } = await mcpCall('resources/read', { uri: 'productive://schema' });

      expect(response.status).toBe(200);
      expect(Array.isArray(data.result.contents)).toBe(true);
      expect(readResource).toHaveBeenCalledWith('productive://schema', {
        organizationId: 'test-org',
        apiToken: 'test-token',
        userId: 'test-user',
      });
    });

    it('should expose protocol errors for invalid params', async () => {
      const { response, data } = await mcpCall('resources/read', {});

      expect(response.status).toBe(200);
      expect(data.error.code).toBe(-32603);
    });

    it('should return protocol error for unknown method', async () => {
      const { response, data } = await mcpCall('unknown/method');

      expect(response.status).toBe(200);
      expect(data.error.code).toBe(-32601);
    });

    it('should reject GET /mcp without auth', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        headers: { Accept: 'text/event-stream' },
      });

      expect(response.status).toBe(401);
      expect(response.headers.get('www-authenticate')).toContain(
        '/.well-known/oauth-protected-resource/mcp',
      );
      expect(response.headers.get('set-cookie')).toBeNull();
    });

    it('should not expose legacy /mcp/sse', async () => {
      const response = await fetch(`${baseUrl}/mcp/sse`);

      expect(response.status).toBe(404);
    });
  });
});
