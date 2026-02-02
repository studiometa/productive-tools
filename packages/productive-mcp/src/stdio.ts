/**
 * Stdio transport handlers for Productive MCP Server
 *
 * This module contains the handler logic for the stdio transport.
 * The actual server startup is in index.ts.
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { getConfig, setConfig } from '@studiometa/productive-cli';

import { executeToolWithCredentials } from './handlers.js';
import { TOOLS, STDIO_ONLY_TOOLS } from './tools.js';

export type ToolResult = CallToolResult;

/**
 * Get all available tools (including stdio-only configuration tools)
 */
export function getAvailableTools() {
  return [...TOOLS, ...STDIO_ONLY_TOOLS];
}

/**
 * Get available prompts
 */
export function getAvailablePrompts() {
  return [
    {
      name: 'setup_productive',
      description: 'Interactive setup for Productive.io credentials',
      arguments: [],
    },
  ];
}

/**
 * Handle the setup_productive prompt
 */
export async function handleSetupPrompt(): Promise<{
  messages: Array<{ role: string; content: { type: string; text: string } }>;
}> {
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

/**
 * Handle the productive_configure tool
 */
export async function handleConfigureTool(args: {
  organizationId: string;
  apiToken: string;
  userId?: string;
}): Promise<ToolResult> {
  const { organizationId, apiToken, userId } = args;

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
          2,
        ),
      },
    ],
  };
}

/**
 * Handle the productive_get_config tool
 */
export async function handleGetConfigTool(): Promise<ToolResult> {
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
          2,
        ),
      },
    ],
  };
}

/**
 * Handle a tool call request
 */
export async function handleToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  // Handle stdio-only configuration tools
  if (name === 'productive_configure') {
    return handleConfigureTool(args as Parameters<typeof handleConfigureTool>[0]);
  }

  if (name === 'productive_get_config') {
    return handleGetConfigTool();
  }

  // Get config for API tools
  const config = await getConfig();
  if (!config.organizationId || !config.apiToken) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Productive.io credentials not configured. Please use the "productive_configure" tool to set your credentials, or set PRODUCTIVE_ORG_ID and PRODUCTIVE_API_TOKEN environment variables.',
        },
      ],
      isError: true,
    };
  }

  // Execute tool with credentials from config
  return executeToolWithCredentials(name, args, {
    organizationId: config.organizationId,
    apiToken: config.apiToken,
    userId: config.userId,
  });
}

/**
 * Handle a prompt request
 */
export async function handlePrompt(name: string): Promise<{
  messages: Array<{ role: string; content: { type: string; text: string } }>;
}> {
  if (name === 'setup_productive') {
    return handleSetupPrompt();
  }

  throw new Error(`Unknown prompt: ${name}`);
}
