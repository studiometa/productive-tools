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
} from '@modelcontextprotocol/sdk/types.js';

import { INSTRUCTIONS } from './instructions.js';
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
    return handlePrompt(request.params.name);
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
