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
import { getConfig, setConfig } from '@studiometa/productive-cli';

import { TOOLS, STDIO_ONLY_TOOLS } from './tools.js';
import { executeToolWithCredentials } from './handlers.js';

// Initialize MCP server
const server = new Server(
  {
    name: 'productive-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

// List available tools (including stdio-only configuration tools)
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [...TOOLS, ...STDIO_ONLY_TOOLS],
  };
});

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'setup_productive',
        description: 'Interactive setup for Productive.io credentials',
        arguments: [],
      },
    ],
  };
});

// Get prompt
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name === 'setup_productive') {
    const config = await getConfig();
    const hasConfig = !!(config.organizationId && config.apiToken);

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: hasConfig
              ? 'I have already configured Productive.io credentials. Would you like to update them?'
              : 'I need to configure my Productive.io credentials. Please help me set up:\n1. Organization ID\n2. API Token\n3. User ID (optional)',
          },
        },
      ],
    };
  }

  throw new Error(`Unknown prompt: ${request.params.name}`);
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Handle stdio-only configuration tools
    if (name === 'productive_configure') {
      const { organizationId, apiToken, userId } = args as {
        organizationId: string;
        apiToken: string;
        userId?: string;
      };

      // Save configuration
      await setConfig('organizationId', organizationId);
      await setConfig('apiToken', apiToken);
      if (userId) {
        await setConfig('userId', userId);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message: 'Productive.io credentials configured successfully',
                configured: {
                  organizationId,
                  userId: userId || 'not set',
                  apiToken: '***' + apiToken.slice(-4),
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === 'productive_get_config') {
      const currentConfig = await getConfig();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                organizationId: currentConfig.organizationId || 'not configured',
                userId: currentConfig.userId || 'not configured',
                apiToken: currentConfig.apiToken
                  ? '***' + currentConfig.apiToken.slice(-4)
                  : 'not configured',
                configured: !!(currentConfig.organizationId && currentConfig.apiToken),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Get config for API tools
    const config = await getConfig();
    if (!config.organizationId || !config.apiToken) {
      throw new Error(
        'Productive.io credentials not configured. Please use the "productive_configure" tool to set your credentials, or set PRODUCTIVE_ORG_ID and PRODUCTIVE_API_TOKEN environment variables.'
      );
    }

    // Execute tool with credentials from config
    return await executeToolWithCredentials(name, (args as Record<string, unknown>) || {}, {
      organizationId: config.organizationId,
      apiToken: config.apiToken,
      userId: config.userId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Productive MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
