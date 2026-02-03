/**
 * HTTP transport handlers for Productive MCP Server
 *
 * This module contains the app/router creation logic for the HTTP transport.
 * The actual server startup is in server.ts.
 */

import {
  createApp,
  createRouter,
  defineEventHandler,
  readBody,
  getHeader,
  setResponseHeader,
  type App,
} from 'h3';

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
import { TOOLS } from './tools.js';
import { VERSION } from './version.js';

/**
 * JSON-RPC error response
 */
export function jsonRpcError(code: number, message: string, id: string | number | null = null) {
  return {
    jsonrpc: '2.0',
    error: { code, message },
    id,
  };
}

/**
 * JSON-RPC success response
 */
export function jsonRpcSuccess(result: unknown, id: string | number | null = null) {
  return {
    jsonrpc: '2.0',
    result,
    id,
  };
}

/**
 * Handle the initialize JSON-RPC method
 */
export function handleInitialize() {
  return {
    protocolVersion: '2024-11-05',
    serverInfo: {
      name: 'productive-mcp',
      version: VERSION,
    },
    capabilities: {
      tools: {},
    },
    instructions: INSTRUCTIONS,
  };
}

/**
 * Handle the tools/list JSON-RPC method
 */
export function handleToolsList() {
  return { tools: TOOLS };
}

/**
 * Create the h3 application with all routes
 */
export function createHttpApp(): App {
  const app = createApp();
  const router = createRouter();

  // OAuth 2.0 endpoints for Claude Desktop integration (MCP auth spec)
  router.get('/.well-known/oauth-authorization-server', oauthMetadataHandler);
  router.post('/register', registerHandler); // Dynamic Client Registration (RFC 7591)
  router.get('/authorize', authorizeGetHandler);
  router.post('/authorize', authorizePostHandler);
  router.post('/token', tokenHandler);

  // OAuth Protected Resource Metadata (RFC 9728 / MCP spec 2025-03-26)
  // This endpoint tells clients where to find the authorization server
  router.get(
    '/.well-known/oauth-protected-resource',
    defineEventHandler((event) => {
      const host = event.node.req.headers.host || 'localhost:3000';
      const protocol = event.node.req.headers['x-forwarded-proto'] || 'http';
      const baseUrl = `${protocol}://${host}`;

      setResponseHeader(event, 'Content-Type', 'application/json');
      setResponseHeader(event, 'Cache-Control', 'public, max-age=3600');

      return {
        resource: `${baseUrl}/mcp`,
        authorization_servers: [baseUrl],
        scopes_supported: ['productive'],
        bearer_methods_supported: ['header'],
      };
    }),
  );

  // Health check endpoint
  router.get(
    '/',
    defineEventHandler(() => {
      return { status: 'ok', service: 'productive-mcp', version: VERSION };
    }),
  );

  router.get(
    '/health',
    defineEventHandler(() => {
      return { status: 'ok' };
    }),
  );

  // MCP endpoint - handles JSON-RPC over HTTP
  router.post(
    '/mcp',
    defineEventHandler(async (event) => {
      // Parse authorization header
      const authHeader = getHeader(event, 'authorization');
      const credentials = parseAuthHeader(authHeader);

      if (!credentials) {
        // RFC 6750: Return WWW-Authenticate header to trigger OAuth flow
        const host = event.node.req.headers.host || 'localhost:3000';
        const protocol = event.node.req.headers['x-forwarded-proto'] || 'http';
        const baseUrl = `${protocol}://${host}`;

        setResponseHeader(event, 'Content-Type', 'application/json');
        setResponseHeader(
          event,
          'WWW-Authenticate',
          `Bearer resource_metadata="${baseUrl}/.well-known/oauth-protected-resource"`,
        );
        event.node.res.statusCode = 401;
        return jsonRpcError(
          -32001,
          'Authentication required. Provide Bearer token with base64(organizationId:apiToken:userId)',
        );
      }

      setResponseHeader(event, 'Content-Type', 'application/json');

      // Parse JSON-RPC request
      let body: { method?: string; params?: unknown; id?: string | number };
      try {
        body = await readBody(event);
      } catch {
        event.node.res.statusCode = 400;
        return jsonRpcError(-32700, 'Parse error: Invalid JSON');
      }

      if (!body || typeof body !== 'object') {
        event.node.res.statusCode = 400;
        return jsonRpcError(-32700, 'Parse error: Invalid JSON');
      }

      const { method, params, id } = body;

      try {
        if (method === 'initialize') {
          return jsonRpcSuccess(handleInitialize(), id ?? null);
        }

        if (method === 'tools/list') {
          return jsonRpcSuccess(handleToolsList(), id ?? null);
        }

        if (method === 'tools/call') {
          const { name, arguments: args } = params as {
            name: string;
            arguments?: Record<string, unknown>;
          };
          const result = await executeToolWithCredentials(name, args || {}, credentials);
          return jsonRpcSuccess(result, id ?? null);
        }

        // Unknown method
        return jsonRpcError(-32601, `Method not found: ${method}`, id ?? null);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return jsonRpcError(-32603, `Internal error: ${message}`, id ?? null);
      }
    }),
  );

  // SSE endpoint for server-sent events (optional, for streaming responses)
  router.get(
    '/mcp/sse',
    defineEventHandler(async (event) => {
      const authHeader = getHeader(event, 'authorization');
      const credentials = parseAuthHeader(authHeader);

      if (!credentials) {
        // RFC 6750: Return WWW-Authenticate header to trigger OAuth flow
        const host = event.node.req.headers.host || 'localhost:3000';
        const protocol = event.node.req.headers['x-forwarded-proto'] || 'http';
        const baseUrl = `${protocol}://${host}`;

        setResponseHeader(
          event,
          'WWW-Authenticate',
          `Bearer resource_metadata="${baseUrl}/.well-known/oauth-protected-resource"`,
        );
        event.node.res.statusCode = 401;
        return { error: 'Authentication required' };
      }

      // Set SSE headers
      setResponseHeader(event, 'Content-Type', 'text/event-stream');
      setResponseHeader(event, 'Cache-Control', 'no-cache');
      setResponseHeader(event, 'Connection', 'keep-alive');

      // Generate session ID and send it
      const sessionId = crypto.randomUUID();

      // Send initial session event
      event.node.res.write(`event: session\ndata: ${JSON.stringify({ sessionId })}\n\n`);

      // Keep connection alive
      const keepAlive = setInterval(() => {
        event.node.res.write(': keepalive\n\n');
      }, 30000);

      // Clean up on close
      event.node.req.on('close', () => {
        clearInterval(keepAlive);
      });

      // Don't end the response - keep it open for SSE
      return new Promise(() => {});
    }),
  );

  app.use(router);
  return app;
}
