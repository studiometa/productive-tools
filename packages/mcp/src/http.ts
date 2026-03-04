/**
 * HTTP transport handlers for Productive MCP Server
 *
 * This module contains the app/router creation logic for the HTTP transport.
 * The actual server startup is in server.ts.
 */

import { H3, defineHandler, type H3Event } from 'h3';

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
      resources: {},
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
 * Get base URL from event headers
 */
function getBaseUrl(event: H3Event): string {
  const host = event.req.headers.get('host') || 'localhost:3000';
  const protocol = event.req.headers.get('x-forwarded-proto') || 'http';
  return `${protocol}://${host}`;
}

/**
 * Create the H3 application with all routes
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
  // This endpoint tells clients where to find the authorization server
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

  // MCP endpoint - handles JSON-RPC over HTTP
  app.post(
    '/mcp',
    defineHandler(async (event) => {
      // Parse authorization header
      const authHeader = event.req.headers.get('authorization');
      const credentials = parseAuthHeader(authHeader);

      if (!credentials) {
        // RFC 6750: Return WWW-Authenticate header to trigger OAuth flow
        const baseUrl = getBaseUrl(event);

        event.res.headers.set('Content-Type', 'application/json');
        event.res.headers.set(
          'WWW-Authenticate',
          `Bearer resource_metadata="${baseUrl}/.well-known/oauth-protected-resource"`,
        );
        event.res.status = 401;
        return jsonRpcError(
          -32001,
          'Authentication required. Provide Bearer token with base64(organizationId:apiToken:userId)',
        );
      }

      event.res.headers.set('Content-Type', 'application/json');

      // Parse JSON-RPC request
      let body: { method?: string; params?: unknown; id?: string | number } | undefined;
      try {
        body = await event.req.json();
      } catch {
        event.res.status = 400;
        return jsonRpcError(-32700, 'Parse error: Invalid JSON');
      }

      if (!body || typeof body !== 'object') {
        event.res.status = 400;
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

        if (method === 'resources/list') {
          return jsonRpcSuccess({ resources: listResources() }, id ?? null);
        }

        if (method === 'resources/templates/list') {
          return jsonRpcSuccess({ resourceTemplates: listResourceTemplates() }, id ?? null);
        }

        if (method === 'resources/read') {
          const { uri } = (params as { uri: string }) ?? {};
          if (!uri) {
            return jsonRpcError(-32602, 'Invalid params: uri is required', id ?? null);
          }
          const result = await readResource(uri, credentials);
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
  app.get(
    '/mcp/sse',
    defineHandler(async (event) => {
      const authHeader = event.req.headers.get('authorization');
      const credentials = parseAuthHeader(authHeader);

      if (!credentials) {
        // RFC 6750: Return WWW-Authenticate header to trigger OAuth flow
        const baseUrl = getBaseUrl(event);

        event.res.headers.set(
          'WWW-Authenticate',
          `Bearer resource_metadata="${baseUrl}/.well-known/oauth-protected-resource"`,
        );
        event.res.status = 401;
        return { error: 'Authentication required' };
      }

      // Node.js-specific SSE: access raw res for streaming
      const nodeRuntime = event.runtime?.node;
      const nodeRes = nodeRuntime?.res as import('node:http').ServerResponse | undefined;
      if (!nodeRes) {
        event.res.status = 501;
        return { error: 'SSE requires Node.js runtime' };
      }

      // Write SSE headers directly to Node.js response (bypassing h3's pipeline)
      nodeRes.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      // Generate session ID and send it
      const sessionId = crypto.randomUUID();

      // Send initial session event
      nodeRes.write(`event: session\ndata: ${JSON.stringify({ sessionId })}\n\n`);

      // Keep connection alive
      const keepAlive = setInterval(() => {
        nodeRes.write(': keepalive\n\n');
      }, 30000);

      // Clean up on close
      nodeRuntime?.req.on('close', () => {
        clearInterval(keepAlive);
      });

      // Don't end the response - keep it open for SSE
      return new Promise(() => {});
    }),
  );

  return app;
}
