import { createServer, type Server as HttpServer } from 'node:http';
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';

// Mock the handlers
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

// Mock resources module
vi.mock('./resources.js', () => ({
  listResources: vi.fn().mockReturnValue([
    {
      uri: 'productive://schema',
      name: 'Schema',
      description: 'Schema overview',
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
import { createHttpApp, createHttpHandler, createMcpServer, extractCredentials } from './http.js';
import { VERSION } from './version.js';

describe('http module', () => {
  describe('extractCredentials', () => {
    it('returns credentials from authInfo extra', () => {
      const creds = extractCredentials({
        extra: { organizationId: 'org-1', apiToken: 'token-1', userId: 'user-1' },
      });
      expect(creds).toEqual({
        organizationId: 'org-1',
        apiToken: 'token-1',
        userId: 'user-1',
      });
    });

    it('returns undefined when authInfo is undefined', () => {
      expect(extractCredentials(undefined)).toBeUndefined();
    });

    it('returns undefined when extra is missing', () => {
      expect(extractCredentials({})).toBeUndefined();
    });

    it('returns undefined when organizationId is missing', () => {
      expect(extractCredentials({ extra: { apiToken: 'token' } })).toBeUndefined();
    });

    it('returns undefined when apiToken is missing', () => {
      expect(extractCredentials({ extra: { organizationId: 'org' } })).toBeUndefined();
    });
  });

  describe('createMcpServer', () => {
    it('creates a server with tools and resources capabilities', () => {
      const server = createMcpServer();
      expect(server).toBeDefined();
    });
  });
});

describe('HTTP Server Integration', () => {
  let server: HttpServer;
  let baseUrl: string;

  // Valid auth token: base64("test-org:test-token:test-user")
  const validToken = Buffer.from('test-org:test-token:test-user').toString('base64');

  const sseHeaders = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream, application/json',
  };

  beforeAll(async () => {
    const handler = createHttpHandler();
    server = createServer(handler);

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

  /**
   * Parse SSE events from response text
   */
  function parseSseEvents(text: string): Array<{ event?: string; data: unknown }> {
    const events: Array<{ event?: string; data: unknown }> = [];
    const lines = text.split('\n');
    let currentEvent: string | undefined;
    let dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7);
      } else if (line.startsWith('data: ')) {
        dataLines.push(line.slice(6));
      } else if (line === '' && dataLines.length > 0) {
        const dataStr = dataLines.join('\n');
        try {
          events.push({ event: currentEvent, data: JSON.parse(dataStr) });
        } catch {
          events.push({ event: currentEvent, data: dataStr });
        }
        currentEvent = undefined;
        dataLines = [];
      }
    }

    return events;
  }

  /**
   * Extract the JSON-RPC result from SSE events
   */
  function getResult(events: Array<{ event?: string; data: unknown }>): unknown {
    const message = events.find((e) => e.event === 'message');
    const data = message?.data as { result?: unknown; error?: unknown } | undefined;
    return data?.result ?? data;
  }

  /**
   * Initialize a session and return the session ID.
   */
  async function initializeSession(): Promise<string> {
    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: { ...sseHeaders, Authorization: `Bearer ${validToken}` },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' },
        },
        id: 1,
      }),
    });

    expect(response.status).toBe(200);
    const sessionId = response.headers.get('mcp-session-id');
    expect(sessionId).toBeTruthy();

    // Send initialized notification
    await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        ...sseHeaders,
        Authorization: `Bearer ${validToken}`,
        'mcp-session-id': sessionId!,
      },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
    });

    return sessionId!;
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

  describe('POST /mcp - authentication', () => {
    it('should return 401 without auth header', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'initialize', id: 1 }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Authentication required');
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

      expect(response.status).toBe(401);
    });

    it('should return 401 with incomplete credentials', async () => {
      const incompleteToken = Buffer.from('only-org-id').toString('base64');

      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${incompleteToken}`,
        },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'initialize', id: 1 }),
      });

      expect(response.status).toBe(401);
    });

    it('should return WWW-Authenticate header on 401', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(401);
      const wwwAuth = response.headers.get('www-authenticate');
      expect(wwwAuth).toContain('Bearer');
      expect(wwwAuth).toContain('oauth-protected-resource');
    });
  });

  describe('POST /mcp - session lifecycle', () => {
    it('should initialize a session and return session ID', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: { ...sseHeaders, Authorization: `Bearer ${validToken}` },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test', version: '1.0.0' },
          },
          id: 1,
        }),
      });

      expect(response.status).toBe(200);
      const sessionId = response.headers.get('mcp-session-id');
      expect(sessionId).toBeTruthy();

      const events = parseSseEvents(await response.text());
      const result = getResult(events) as Record<string, unknown>;
      expect(result).toBeDefined();
      expect((result.serverInfo as { name: string }).name).toBe('productive-mcp');
    });

    it('should reject non-initialize requests without session ID', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: { ...sseHeaders, Authorization: `Bearer ${validToken}` },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/list', id: 2 }),
      });

      expect(response.status).toBe(400);
    });

    it('should accept token without userId', async () => {
      const tokenWithoutUser = Buffer.from('org-id:api-token').toString('base64');

      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: { ...sseHeaders, Authorization: `Bearer ${tokenWithoutUser}` },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test', version: '1.0.0' },
          },
          id: 1,
        }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe('POST /mcp - MCP protocol', () => {
    it('should handle tools/list', async () => {
      const sessionId = await initializeSession();

      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          ...sseHeaders,
          Authorization: `Bearer ${validToken}`,
          'mcp-session-id': sessionId,
        },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/list', id: 2 }),
      });

      expect(response.status).toBe(200);
      const events = parseSseEvents(await response.text());
      const result = getResult(events) as { tools: Array<{ name: string }> };

      expect(result.tools).toBeDefined();
      expect(Array.isArray(result.tools)).toBe(true);

      const productiveTool = result.tools.find((t) => t.name === 'productive');
      expect(productiveTool).toBeDefined();
    });

    it('should handle tools/call', async () => {
      const sessionId = await initializeSession();

      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          ...sseHeaders,
          Authorization: `Bearer ${validToken}`,
          'mcp-session-id': sessionId,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'productive',
            arguments: { resource: 'projects', action: 'list', page: 1 },
          },
          id: 3,
        }),
      });

      expect(response.status).toBe(200);
      const events = parseSseEvents(await response.text());
      const result = getResult(events) as { content: unknown[] };

      expect(result.content).toBeDefined();

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

    it('should handle resources/list', async () => {
      const sessionId = await initializeSession();

      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          ...sseHeaders,
          Authorization: `Bearer ${validToken}`,
          'mcp-session-id': sessionId,
        },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'resources/list', id: 10 }),
      });

      expect(response.status).toBe(200);
      const events = parseSseEvents(await response.text());
      const result = getResult(events) as { resources: unknown[] };

      expect(result.resources).toBeDefined();
      expect(Array.isArray(result.resources)).toBe(true);
    });

    it('should handle resources/templates/list', async () => {
      const sessionId = await initializeSession();

      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          ...sseHeaders,
          Authorization: `Bearer ${validToken}`,
          'mcp-session-id': sessionId,
        },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'resources/templates/list', id: 11 }),
      });

      expect(response.status).toBe(200);
      const events = parseSseEvents(await response.text());
      const result = getResult(events) as { resourceTemplates: unknown[] };

      expect(result.resourceTemplates).toBeDefined();
      expect(Array.isArray(result.resourceTemplates)).toBe(true);
    });

    it('should handle resources/read', async () => {
      const sessionId = await initializeSession();

      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          ...sseHeaders,
          Authorization: `Bearer ${validToken}`,
          'mcp-session-id': sessionId,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'resources/read',
          params: { uri: 'productive://schema' },
          id: 12,
        }),
      });

      expect(response.status).toBe(200);
      const events = parseSseEvents(await response.text());
      const result = getResult(events) as { contents: unknown[] };

      expect(result.contents).toBeDefined();
    });

    it('should return error for invalid JSON body', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          ...sseHeaders,
          Authorization: `Bearer ${validToken}`,
        },
        body: 'not valid json {{{',
      });

      expect(response.status).toBe(400);
    });

    it('should return error for empty body', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          ...sseHeaders,
          Authorization: `Bearer ${validToken}`,
        },
        body: '',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /mcp - SSE stream', () => {
    it('should return 401 without auth header', async () => {
      const response = await fetch(`${baseUrl}/mcp`);
      expect(response.status).toBe(401);
    });

    it('should return 400 without session ID', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        headers: {
          Authorization: `Bearer ${validToken}`,
          Accept: 'text/event-stream',
        },
      });
      expect(response.status).toBe(400);
    });

    it('should return 400 with invalid session ID', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        headers: {
          Authorization: `Bearer ${validToken}`,
          Accept: 'text/event-stream',
          'mcp-session-id': 'nonexistent-session',
        },
      });
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /mcp - session termination', () => {
    it('should return 401 without auth header', async () => {
      const response = await fetch(`${baseUrl}/mcp`, { method: 'DELETE' });
      expect(response.status).toBe(401);
    });

    it('should return 400 without session ID', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${validToken}` },
      });
      expect(response.status).toBe(400);
    });

    it('should terminate an existing session', async () => {
      const sessionId = await initializeSession();

      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'mcp-session-id': sessionId,
        },
      });

      // Session should be terminated
      expect([200, 204]).toContain(response.status);
    });
  });

  describe('Method not allowed', () => {
    it('should return 405 for PUT /mcp', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${validToken}` },
      });
      expect(response.status).toBe(405);
    });

    it('should return 405 for PATCH /mcp', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${validToken}` },
      });
      expect(response.status).toBe(405);
    });
  });

  describe('GET /.well-known/oauth-protected-resource', () => {
    it('should return protected resource metadata', async () => {
      const response = await fetch(`${baseUrl}/.well-known/oauth-protected-resource`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('resource');
      expect(data).toHaveProperty('authorization_servers');
      expect(data.scopes_supported).toContain('productive');
      expect(data.bearer_methods_supported).toContain('header');
    });

    it('should include cache-control header', async () => {
      const response = await fetch(`${baseUrl}/.well-known/oauth-protected-resource`);
      expect(response.headers.get('cache-control')).toContain('max-age=3600');
    });

    it('should include the /mcp resource URL', async () => {
      const response = await fetch(`${baseUrl}/.well-known/oauth-protected-resource`);
      const data = await response.json();
      expect(data.resource).toContain('/mcp');
    });

    it('should derive base URL from x-forwarded-proto header', async () => {
      const response = await fetch(`${baseUrl}/.well-known/oauth-protected-resource`, {
        headers: { 'x-forwarded-proto': 'https' },
      });
      const data = await response.json();
      expect(data.authorization_servers[0]).toContain('https://');
    });
  });
});
