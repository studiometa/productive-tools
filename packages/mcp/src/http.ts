/**
 * HTTP transport handlers for Productive MCP Server
 *
 * Uses StreamableHTTPServerTransport from the MCP SDK for spec-compliant
 * JSON-RPC over HTTP with SSE streaming support.
 *
 * Architecture:
 * - POST/GET/DELETE /mcp → delegated to StreamableHTTPServerTransport
 * - OAuth, health, metadata endpoints → handled by h3
 *
 * Uses stateful mode: one MCP Server + Transport per session.
 * The session is initialized on the first `initialize` request and reused
 * for subsequent requests via the `mcp-session-id` header.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
  isInitializeRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { H3, defineHandler, type H3Event } from 'h3';
import type { IncomingMessage, ServerResponse } from 'node:http';

import type { ProductiveCredentials } from './auth.js';

import { parseAuthHeader } from './auth.js';
import { executeToolWithCredentials } from './handlers.js';
import { INSTRUCTIONS } from './instructions.js';
import {
  oauthMetadataHandler,
  registerHandler,
  authorizeGetHandler,
  authorizePostHandler,
  tokenHandler,
} from './oauth.js';
import { listResources, listResourceTemplates, readResource } from './resources.js';
import { TOOLS } from './tools.js';
import { VERSION } from './version.js';

/**
 * Extract credentials from AuthInfo extra data.
 * Returns undefined if credentials are missing or invalid.
 */
export function extractCredentials(
  authInfo: { extra?: Record<string, unknown> } | undefined,
): ProductiveCredentials | undefined {
  const extra = authInfo?.extra;
  if (!extra) return undefined;
  const { organizationId, apiToken, userId } = extra as Record<string, string>;
  if (!organizationId || !apiToken) return undefined;
  return { organizationId, apiToken, userId };
}

/**
 * Create and configure the MCP Server for HTTP transport.
 * Unlike stdio, credentials come from the auth header per-request via authInfo.extra.
 */
export function createMcpServer(): Server {
  const server = new Server(
    {
      name: 'productive-mcp',
      version: VERSION,
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
      instructions: INSTRUCTIONS,
    },
  );

  // List available tools (HTTP-only, no stdio config tools)
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // Handle tool calls — credentials come from authInfo.extra
  server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    const credentials = extractCredentials(extra.authInfo);
    if (!credentials) {
      return {
        content: [{ type: 'text', text: 'Error: Authentication required' }],
        isError: true,
      };
    }

    const { name, arguments: args } = request.params;
    try {
      return await executeToolWithCredentials(
        name,
        (args as Record<string, unknown>) || {},
        credentials,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: `Error: ${message}` }],
        isError: true,
      };
    }
  });

  // List resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return { resources: listResources() };
  });

  // List resource templates
  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    return { resourceTemplates: listResourceTemplates() };
  });

  // Read a resource
  server.setRequestHandler(ReadResourceRequestSchema, async (request, extra) => {
    const credentials = extractCredentials(extra.authInfo);
    if (!credentials) {
      throw new Error('Authentication required');
    }
    return readResource(request.params.uri, credentials);
  });

  return server;
}

/**
 * Get base URL from request headers (Node.js IncomingMessage)
 */
function getBaseUrlFromReq(req: IncomingMessage): string {
  const host = req.headers['host'] || 'localhost:3000';
  const protocol = (req.headers['x-forwarded-proto'] as string) || 'http';
  return `${protocol}://${host}`;
}

/**
 * Send a JSON response on a Node.js ServerResponse
 */
function sendJson(
  res: ServerResponse,
  status: number,
  data: unknown,
  headers?: Record<string, string>,
): void {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    ...headers,
  });
  res.end(body);
}

/**
 * Authenticate an incoming request.
 * Returns credentials on success, or sends a 401 response and returns undefined.
 */
function authenticateRequest(
  req: IncomingMessage,
  res: ServerResponse,
): ProductiveCredentials | undefined {
  const authHeader = req.headers['authorization'] || null;
  const credentials = parseAuthHeader(authHeader);

  if (!credentials) {
    const baseUrl = getBaseUrlFromReq(req);
    sendJson(res, 401, { error: 'Authentication required' }, {
      'WWW-Authenticate': `Bearer resource_metadata="${baseUrl}/.well-known/oauth-protected-resource"`,
    });
    return undefined;
  }

  return credentials;
}

/**
 * Inject auth credentials into a Node.js request object for the MCP transport.
 * The SDK passes req.auth through to handler extra.authInfo.
 */
function injectAuth(req: IncomingMessage, credentials: ProductiveCredentials): void {
  (req as IncomingMessage & { auth?: unknown }).auth = {
    token: req.headers['authorization']?.replace('Bearer ', '') || '',
    clientId: credentials.organizationId,
    scopes: ['productive'],
    extra: {
      organizationId: credentials.organizationId,
      apiToken: credentials.apiToken,
      userId: credentials.userId,
    },
  };
}

/**
 * Get base URL from h3 event headers
 */
function getBaseUrl(event: H3Event): string {
  const host = event.req.headers.get('host') || 'localhost:3000';
  const protocol = event.req.headers.get('x-forwarded-proto') || 'http';
  return `${protocol}://${host}`;
}

/**
 * Create the H3 application with non-MCP routes (OAuth, health, metadata).
 * MCP routes (POST/GET/DELETE /mcp) are handled separately at the Node.js HTTP level.
 */
export function createHttpApp(): H3 {
  const app = new H3();

  // OAuth 2.0 endpoints for Claude Desktop integration (MCP auth spec)
  app.get('/.well-known/oauth-authorization-server', oauthMetadataHandler);
  app.post('/register', registerHandler); // Dynamic Client Registration (RFC 7591)
  app.get('/authorize', authorizeGetHandler);
  app.post('/authorize', authorizePostHandler);
  app.post('/token', tokenHandler);

  // OAuth Protected Resource Metadata (RFC 9728 / MCP spec 2025-03-26)
  app.get(
    '/.well-known/oauth-protected-resource',
    defineHandler((event) => {
      const baseUrl = getBaseUrl(event);

      event.res.headers.set('Content-Type', 'application/json');
      event.res.headers.set('Cache-Control', 'public, max-age=3600');

      return {
        resource: `${baseUrl}/mcp`,
        authorization_servers: [baseUrl],
        scopes_supported: ['productive'],
        bearer_methods_supported: ['header'],
      };
    }),
  );

  // Health check endpoint
  app.get(
    '/',
    defineHandler(() => {
      return { status: 'ok', service: 'productive-mcp', version: VERSION };
    }),
  );

  app.get(
    '/health',
    defineHandler(() => {
      return { status: 'ok' };
    }),
  );

  return app;
}

/** Map of session ID → transport for active sessions */
type SessionMap = Map<string, StreamableHTTPServerTransport>;

/**
 * Handle a POST /mcp request.
 * Creates a new session on `initialize`, reuses existing sessions otherwise.
 */
async function handleMcpPost(
  req: IncomingMessage,
  res: ServerResponse,
  credentials: ProductiveCredentials,
  sessions: SessionMap,
): Promise<void> {
  // Parse the body to check if it's an initialize request
  const body = await readBody(req);
  if (!body) {
    sendJson(res, 400, {
      jsonrpc: '2.0',
      error: { code: -32700, message: 'Parse error: Invalid JSON' },
      id: null,
    });
    return;
  }

  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  // Check for existing session
  if (sessionId && sessions.has(sessionId)) {
    const transport = sessions.get(sessionId)!;
    injectAuth(req, credentials);
    await transport.handleRequest(req, res, body);
    return;
  }

  // New session: must be an initialize request
  if (!isInitializeRequest(body)) {
    sendJson(res, 400, {
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided, and this is not an initialization request',
      },
      id: null,
    });
    return;
  }

  // Create new transport and server for this session
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
    onsessioninitialized: (sid: string) => {
      sessions.set(sid, transport);
    },
  });

  transport.onclose = () => {
    const sid = transport.sessionId;
    if (sid) sessions.delete(sid);
  };

  const server = createMcpServer();
  await server.connect(transport);

  injectAuth(req, credentials);
  await transport.handleRequest(req, res, body);
}

/**
 * Handle a GET /mcp request (SSE stream for server-initiated notifications).
 */
async function handleMcpGet(
  req: IncomingMessage,
  res: ServerResponse,
  credentials: ProductiveCredentials,
  sessions: SessionMap,
): Promise<void> {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (!sessionId || !sessions.has(sessionId)) {
    sendJson(res, 400, { error: 'Invalid or missing session ID' });
    return;
  }

  const transport = sessions.get(sessionId)!;
  injectAuth(req, credentials);
  await transport.handleRequest(req, res);
}

/**
 * Handle a DELETE /mcp request (session termination).
 */
async function handleMcpDelete(
  req: IncomingMessage,
  res: ServerResponse,
  credentials: ProductiveCredentials,
  sessions: SessionMap,
): Promise<void> {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (!sessionId || !sessions.has(sessionId)) {
    sendJson(res, 400, { error: 'Invalid or missing session ID' });
    return;
  }

  const transport = sessions.get(sessionId)!;
  injectAuth(req, credentials);
  await transport.handleRequest(req, res);
}

/**
 * Read and parse the request body as JSON.
 */
function readBody(req: IncomingMessage): Promise<unknown | null> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf-8');
      if (!raw) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(null);
      }
    });
    req.on('error', () => resolve(null));
  });
}

/**
 * Create a Node.js HTTP request handler that routes between MCP transport and h3.
 *
 * - POST/GET/DELETE /mcp → StreamableHTTPServerTransport (MCP SDK)
 * - Everything else → h3 (OAuth, health, metadata)
 */
export function createHttpHandler(): (req: IncomingMessage, res: ServerResponse) => void {
  const app = createHttpApp();
  const sessions: SessionMap = new Map();

  // h3 handler for non-MCP routes
  let h3Handler: ((req: IncomingMessage, res: ServerResponse) => void) | null = null;
  const getH3Handler = async () => {
    if (!h3Handler) {
      const { toNodeHandler } = await import('h3');
      h3Handler = toNodeHandler(app);
    }
    return h3Handler;
  };

  return async (req: IncomingMessage, res: ServerResponse) => {
    const url = req.url || '/';
    const method = req.method || 'GET';

    // Route MCP requests to StreamableHTTPServerTransport
    if (url === '/mcp' || url.startsWith('/mcp?')) {
      // Authenticate first
      const credentials = authenticateRequest(req, res);
      if (!credentials) return;

      try {
        if (method === 'POST') {
          await handleMcpPost(req, res, credentials, sessions);
        } else if (method === 'GET') {
          await handleMcpGet(req, res, credentials, sessions);
        } else if (method === 'DELETE') {
          await handleMcpDelete(req, res, credentials, sessions);
        } else {
          sendJson(res, 405, { error: 'Method not allowed' });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!res.headersSent) {
          sendJson(res, 500, {
            jsonrpc: '2.0',
            error: { code: -32603, message: `Internal error: ${message}` },
            id: null,
          });
        }
      }
      return;
    }

    // Everything else goes to h3
    const handler = await getH3Handler();
    handler(req, res);
  };
}
