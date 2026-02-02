/**
 * Utility functions for resource handlers
 */

import type { ToolResult } from './types.js';

/**
 * Helper to create a successful JSON response
 */
export function jsonResult(data: unknown): ToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * Helper to create an error response
 */
export function errorResult(message: string): ToolResult {
  return {
    content: [{ type: 'text', text: `Error: ${message}` }],
    isError: true,
  };
}

/**
 * Convert unknown filter to string filter for API
 */
export function toStringFilter(
  filter?: Record<string, unknown>,
): Record<string, string> | undefined {
  if (!filter) return undefined;
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== null) {
      result[key] = String(value);
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}
