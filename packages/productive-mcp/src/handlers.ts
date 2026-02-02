/**
 * Tool execution handlers for Productive MCP server
 *
 * This module re-exports from the handlers/ directory for backwards compatibility.
 * The handlers have been refactored into separate modules for better maintainability.
 */

export { executeToolWithCredentials, type ToolResult } from './handlers/index.js';
