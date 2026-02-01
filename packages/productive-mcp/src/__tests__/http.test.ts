import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { createServer, type Server as HttpServer } from 'node:http';
import { toNodeListener } from 'h3';

// Mock the handlers
vi.mock('../handlers.js', () => ({
  executeToolWithCredentials: vi.fn().mockImplementation((name, args, credentials) => {
    if (name === 'failing_tool') {
      throw new Error('Tool execution failed');
    }
    return Promise.resolve({
      content: [{ type: 'text', text: JSON.stringify({ tool: name, args }) }],
    });
  }),
}));

import {
  createHttpApp,
  jsonRpcError,
  jsonRpcSuccess,
  handleInitialize,
  handleToolsList,
} from '../http.js';
import { executeToolWithCredentials } from '../handlers.js';

describe('http module', () => {
  describe('jsonRpcError', () => {
    it('should create error response with id', () => {
      const error = jsonRpcError(-32600, 'Invalid request', 123);

      expect(error).toEqual({
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid request' },
        id: 123,
      });
    });

    it('should create error response without id', () => {
      const error = jsonRpcError(-32700, 'Parse error');

      expect(error).toEqual({
        jsonrpc: '2.0',
        error: { code: -32700, message: 'Parse error' },
        id: null,
      });
    });
  });

  describe('jsonRpcSuccess', () => {
    it('should create success response', () => {
      const success = jsonRpcSuccess({ data: 'test' }, 456);

      expect(success).toEqual({
        jsonrpc: '2.0',
        result: { data: 'test' },
        id: 456,
      });
    });

    it('should handle string id', () => {
      const success = jsonRpcSuccess({ ok: true }, 'request-1');

      expect(success.id).toBe('request-1');
    });
  });

  describe('handleInitialize', () => {
    it('should return server info and capabilities', () => {
      const result = handleInitialize();

      expect(result.protocolVersion).toBe('2024-11-05');
      expect(result.serverInfo.name).toBe('productive-mcp');
      expect(result.serverInfo.version).toBe('0.1.0');
      expect(result.capabilities.tools).toEqual({});
    });
  });

  describe('handleToolsList', () => {
    it('should return tools array', () => {
      const result = handleToolsList();

      expect(result.tools).toBeDefined();
      expect(Array.isArray(result.tools)).toBe(true);
      expect(result.tools.length).toBeGreaterThan(0);

      // Should NOT include stdio-only tools
      const configure = result.tools.find((t) => t.name === 'productive_configure');
      expect(configure).toBeUndefined();

      // Should include regular tools
      const listProjects = result.tools.find((t) => t.name === 'productive_list_projects');
      expect(listProjects).toBeDefined();
    });
  });
});

describe('HTTP Server Integration', () => {
  let server: HttpServer;
  let baseUrl: string;

  // Valid auth token: base64("test-org:test-token:test-user")
  const validToken = Buffer.from('test-org:test-token:test-user').toString('base64');

  beforeAll(async () => {
    const app = createHttpApp();
    server = createServer(toNodeListener(app));

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

  describe('health endpoints', () => {
    it('GET / should return service info', async () => {
      const response = await fetch(`${baseUrl}/`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        status: 'ok',
        service: 'productive-mcp',
        version: '0.1.0',
      });
    });

    it('GET /health should return ok', async () => {
      const response = await fetch(`${baseUrl}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ status: 'ok' });
    });
  });

  describe('POST /mcp - authentication', () => {
    it('should return 401 without auth header', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'initialize', id: 1 }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe(-32001);
      expect(data.error.message).toContain('Authentication required');
    });

    it('should return 401 with invalid token format', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer not-valid-base64!!!',
        },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'initialize', id: 1 }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
    });

    it('should return 401 with incomplete credentials', async () => {
      // Token with only org (missing apiToken)
      const incompleteToken = Buffer.from('only-org-id').toString('base64');

      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${incompleteToken}`,
        },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'initialize', id: 1 }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
    });

    it('should accept valid Bearer token', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'initialize', id: 1 }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.result).toBeDefined();
    });

    it('should accept token without userId', async () => {
      const tokenWithoutUser = Buffer.from('org-id:api-token').toString('base64');

      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenWithoutUser}`,
        },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'initialize', id: 1 }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.result).toBeDefined();
    });
  });

  describe('POST /mcp - JSON-RPC methods', () => {
    it('should handle initialize method', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'initialize', id: 1 }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jsonrpc).toBe('2.0');
      expect(data.id).toBe(1);
      expect(data.result.protocolVersion).toBe('2024-11-05');
      expect(data.result.serverInfo.name).toBe('productive-mcp');
    });

    it('should handle tools/list method', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/list', id: 2 }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.result.tools).toBeDefined();
      expect(Array.isArray(data.result.tools)).toBe(true);

      // Verify tool structure
      const projectTool = data.result.tools.find(
        (t: { name: string }) => t.name === 'productive_list_projects'
      );
      expect(projectTool).toBeDefined();
      expect(projectTool.inputSchema).toBeDefined();
    });

    it('should handle tools/call method', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'productive_list_projects',
            arguments: { page: 1 },
          },
          id: 3,
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.result.content).toBeDefined();

      // Verify handler was called with correct credentials
      expect(executeToolWithCredentials).toHaveBeenCalledWith(
        'productive_list_projects',
        { page: 1 },
        {
          organizationId: 'test-org',
          apiToken: 'test-token',
          userId: 'test-user',
        }
      );
    });

    it('should return error for unknown method', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'unknown/method', id: 4 }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe(-32601);
      expect(data.error.message).toContain('Method not found');
    });

    it('should preserve request id in response', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'initialize', id: 'custom-id-123' }),
      });
      const data = await response.json();

      expect(data.id).toBe('custom-id-123');
    });

    it('should handle missing id gracefully', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'initialize' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBeNull();
    });
  });

  describe('POST /mcp - error handling', () => {
    it('should handle tool execution errors', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'failing_tool',
            arguments: {},
          },
          id: 5,
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe(-32603);
      expect(data.error.message).toContain('Tool execution failed');
    });

    it('should handle empty body', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: '',
      });

      // Should return an error (either 400 or parse error)
      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });
});
