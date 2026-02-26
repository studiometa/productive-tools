#!/usr/bin/env node

/**
 * Productive MCP Server - Stdio Transport
 *
 * This is the local execution mode using stdio transport.
 * For remote HTTP deployment, use server.ts instead.
 *
 * Usage:
 *   npx @studiometa/productive-mcp
 *
 * Or in Claude Desktop config:
 *   {
 *     "mcpServers": {
 *       "productive": {
 *         "command": "npx",
 *         "args": ["@studiometa/productive-mcp"]
 *       }
 *     }
 *   }
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { getConfig } from '@studiometa/productive-api';

import { INSTRUCTIONS } from './instructions.js';
import { listResources, listResourceTemplates, readResource } from './resources.js';
import { getAvailableTools, getAvailablePrompts, handleToolCall, handlePrompt } from './stdio.js';
import { VERSION } from './version.js';

/**
 * Create and configure the MCP server
 */
export function createStdioServer(): Server {
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

  // List available tools (including stdio-only configuration tools)
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: getAvailableTools() };
  });

  // List available prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return { prompts: getAvailablePrompts() };
  });

  // Get prompt
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    return handlePrompt(request.params.name, request.params.arguments as Record<string, string>);
  });

  // List available resources (static + dynamic)
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return { resources: listResources() };
  });

  // List resource templates (parameterized URIs)
  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    return { resourceTemplates: listResourceTemplates() };
  });

  // Read a resource by URI
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    // Get credentials from config (same as tool calls)
    const config = await getConfig();
    if (!config.organizationId || !config.apiToken) {
      throw new Error(
        'Productive.io credentials not configured. Use the "productive_configure" tool or set PRODUCTIVE_ORG_ID and PRODUCTIVE_API_TOKEN environment variables.',
      );
    }

    return readResource(uri, {
      organizationId: config.organizationId,
      apiToken: config.apiToken,
      userId: config.userId,
    });
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      return await handleToolCall(name, (args as Record<string, unknown>) || {});
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: `Error: ${message}` }],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Start the stdio server
 */
export async function startStdioServer(): Promise<void> {
  const server = createStdioServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Productive MCP server v${VERSION} running on stdio`);
}

// Start server when run directly
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('/productive-mcp') ||
  process.argv[1]?.endsWith('\\productive-mcp');

if (isMainModule) {
  startStdioServer().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
