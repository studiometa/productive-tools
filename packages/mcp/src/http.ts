/**
 * HTTP transport handlers for Productive MCP Server
 *
 * This module contains the app/router creation logic for the HTTP transport.
 * The actual server startup is in server.ts.
 */

import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import type { IncomingMessage } from 'node:http';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { H3, defineHandler, type H3Event } from 'h3';

const OAUTH_PROTECTED_RESOURCE_PATH = '/.well-known/oauth-protected-resource/mcp';

import { parseAuthHeader, type ProductiveCredentials } from './auth.js';
import { executeToolWithCredentials } from './handlers.js';
import { executeRunRequest } from './handlers/run-endpoint.js';
import { INSTRUCTIONS } from './instructions.js';
import {
  oauthMetadataHandler,
  registerHandler,
  authorizeGetHandler,
  authorizePostHandler,
  tokenHandler,
} from './oauth.js';
import { listResources, listResourceTemplates, readResource } from './resources.js';
import { getAvailablePrompts, handlePrompt } from './stdio.js';
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
      prompts: {},
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

function buildProtectedResourceMetadata(event: H3Event) {
  const baseUrl = getBaseUrl(event);

  return {
    resource: `${baseUrl}/mcp`,
    authorization_servers: [baseUrl],
    scopes_supported: ['productive'],
    bearer_methods_supported: ['header'],
  };
}

function createAuthInfo(token: string, credentials: ProductiveCredentials): AuthInfo {
  return {
    token,
    clientId: credentials.userId || credentials.organizationId,
    scopes: ['productive'],
    extra: {
      credentials,
    },
  };
}

function getCredentialsFromAuthInfo(authInfo: AuthInfo | undefined | null): ProductiveCredentials {
  const credentials = authInfo?.extra?.credentials;

  if (
    !credentials ||
    typeof credentials !== 'object' ||
    !('organizationId' in credentials) ||
    !('apiToken' in credentials) ||
    typeof credentials.organizationId !== 'string' ||
    typeof credentials.apiToken !== 'string'
  ) {
    throw new Error(
      'Authentication required. Provide Bearer token with base64(organizationId:apiToken:userId)',
    );
  }

  const userId =
    'userId' in credentials && typeof credentials.userId === 'string'
      ? credentials.userId
      : undefined;

  return {
    organizationId: credentials.organizationId,
    apiToken: credentials.apiToken,
    userId,
  };
}

export function createHttpMcpServer(): Server {
  const server = new Server(
    {
      name: 'productive-mcp',
      version: VERSION,
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
        resources: {},
      },
      instructions: INSTRUCTIONS,
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return { prompts: getAvailablePrompts() };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    return handlePrompt(request.params.name, request.params.arguments as Record<string, string>);
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return { resources: listResources() };
  });

  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    return { resourceTemplates: listResourceTemplates() };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request, extra) => {
    const credentials = getCredentialsFromAuthInfo(extra.authInfo);

    if (!request.params.uri) {
      throw new McpError(ErrorCode.InvalidParams, 'Invalid params: uri is required');
    }

    return readResource(request.params.uri, credentials);
  });

  server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    const credentials = getCredentialsFromAuthInfo(extra.authInfo);
    return executeToolWithCredentials(
      request.params.name,
      (request.params.arguments as Record<string, unknown>) || {},
      credentials,
    );
  });

  return server;
}

export async function createHttpMcpTransport(): Promise<StreamableHTTPServerTransport> {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  const server = createHttpMcpServer();
  await server.connect(transport);

  return transport;
}

function setUnauthorizedResponseHeaders(event: H3Event) {
  const baseUrl = getBaseUrl(event);
  event.res.headers.delete('Set-Cookie');
  event.res.headers.set(
    'WWW-Authenticate',
    `Bearer resource_metadata="${baseUrl}${OAUTH_PROTECTED_RESOURCE_PATH}"`,
  );
}

function authenticateRequest(event: H3Event): AuthInfo | null {
  const authHeader = event.req.headers.get('authorization');
  const tokenMatch = authHeader?.match(/^Bearer\s+(.+)$/i);
  const credentials = parseAuthHeader(authHeader);

  if (!credentials || !tokenMatch?.[1]) {
    return null;
  }

  return createAuthInfo(tokenMatch[1], credentials);
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
  const protectedResourceMetadataHandler = defineHandler((event) => {
    event.res.headers.set('Content-Type', 'application/json');
    event.res.headers.set('Cache-Control', 'public, max-age=3600');

    return buildProtectedResourceMetadata(event);
  });

  app.get(OAUTH_PROTECTED_RESOURCE_PATH, protectedResourceMetadataHandler);

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

  // Runner endpoint: a front server with PRODUCTIVE_MCP_RUN_RUNNER_URL forwards
  // run_script calls here. Only active when PRODUCTIVE_MCP_RUN_RUNNER_TOKEN is
  // set (otherwise it reports 404). Authenticated by that shared token.
  app.post(
    '/run',
    defineHandler(async (event) => {
      let parsedBody: unknown;
      try {
        parsedBody = await event.req.json();
      } catch {
        parsedBody = undefined;
      }
      const result = await executeRunRequest(
        parsedBody,
        event.req.headers.get('authorization'),
        executeToolWithCredentials,
      );
      event.res.status = result.status;
      event.res.headers.set('Content-Type', 'application/json');
      return result.body;
    }),
  );

  const mcpHandler = defineHandler(async (event) => {
    const authInfo = authenticateRequest(event);

    if (!authInfo) {
      setUnauthorizedResponseHeaders(event);
      event.res.status = 401;
      event.res.headers.set('Content-Type', 'application/json');
      return event.req.method === 'POST'
        ? jsonRpcError(
            -32001,
            'Authentication required. Provide Bearer token with base64(organizationId:apiToken:userId)',
          )
        : { error: 'Authentication required' };
    }

    const nodeReq = event.runtime?.node?.req as (IncomingMessage & { auth?: AuthInfo }) | undefined;
    const nodeRes = event.runtime?.node?.res as import('node:http').ServerResponse | undefined;

    if (!nodeReq || !nodeRes) {
      event.res.status = 501;
      return { error: 'MCP HTTP transport requires Node.js runtime' };
    }

    nodeReq.auth = authInfo;

    let parsedBody: unknown;
    if (event.req.method === 'POST') {
      try {
        parsedBody = await event.req.json();
      } catch {
        event.res.status = 400;
        event.res.headers.set('Content-Type', 'application/json');
        return jsonRpcError(-32700, 'Parse error: Invalid JSON');
      }

      const body = parsedBody as
        | { method?: string; params?: { uri?: string }; id?: string | number | null }
        | undefined;
      if (body?.method === 'resources/read' && !body.params?.uri) {
        event.res.status = 200;
        event.res.headers.set('Content-Type', 'application/json');
        return jsonRpcError(-32602, 'Invalid params: uri is required', body.id ?? null);
      }
    }

    const transport = await createHttpMcpTransport();
    await transport.handleRequest(nodeReq, nodeRes, parsedBody);

    return undefined;
  });

  app.get('/mcp', mcpHandler);
  app.post('/mcp', mcpHandler);
  app.delete('/mcp', mcpHandler);

  return app;
}
