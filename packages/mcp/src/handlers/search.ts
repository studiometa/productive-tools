/**
 * Cross-resource search handler for MCP.
 *
 * Fans out a text query across multiple resource types simultaneously,
 * returning grouped results in a single tool call.
 */

import type { ProductiveCredentials } from '../auth.js';
import type { ToolResult } from './types.js';

import { errorResult, jsonResult } from './utils.js';

/**
 * Resources that support the query filter for text search
 */
export const SEARCHABLE_RESOURCES = ['projects', 'companies', 'people', 'tasks', 'deals'] as const;
export type SearchableResource = (typeof SEARCHABLE_RESOURCES)[number];

/**
 * Default resources to search when not specified
 */
const DEFAULT_SEARCH_RESOURCES: SearchableResource[] = ['projects', 'companies', 'people', 'tasks'];

/**
 * Type for the execute function injected for delegation
 */
export type ExecuteFunction = (
  name: string,
  args: Record<string, unknown>,
  credentials: ProductiveCredentials,
) => Promise<ToolResult>;

/**
 * Search result for a single resource
 */
interface ResourceSearchResult {
  items?: unknown[];
  error?: string;
}

/**
 * Handle cross-resource search.
 *
 * @param query - Search query text (required)
 * @param resources - Resource types to search (optional, defaults to DEFAULT_SEARCH_RESOURCES)
 * @param credentials - Productive API credentials
 * @param execute - Function to execute tool calls (injected for delegation and testing)
 * @returns Grouped search results across all requested resources
 */
export async function handleSearch(
  query: string | undefined,
  resources: string[] | undefined,
  credentials: ProductiveCredentials,
  execute: ExecuteFunction,
): Promise<ToolResult> {
  // Validate query is non-empty
  if (!query || query.trim() === '') {
    return errorResult('Missing required parameter: query. Provide a non-empty search string.');
  }

  const trimmedQuery = query.trim();

  // Resolve resources to default if not provided
  const resourcesToSearch =
    resources && resources.length > 0 ? resources : DEFAULT_SEARCH_RESOURCES;

  // Validate all resources are searchable
  const invalidResources = resourcesToSearch.filter(
    (r) => !SEARCHABLE_RESOURCES.includes(r as SearchableResource),
  );

  if (invalidResources.length > 0) {
    return errorResult(
      `Invalid searchable resources: ${invalidResources.join(', ')}. ` +
        `Valid searchable resources: ${SEARCHABLE_RESOURCES.join(', ')}.`,
    );
  }

  // Run all searches in parallel
  const searchPromises = resourcesToSearch.map(
    async (resource): Promise<[string, ResourceSearchResult]> => {
      try {
        const result = await execute(
          'productive',
          {
            resource,
            action: 'list',
            query: trimmedQuery,
            compact: true,
            per_page: 10,
          },
          credentials,
        );

        // Parse JSON from result content
        const textContent = result.content.find((c) => c.type === 'text');
        if (!textContent || textContent.type !== 'text') {
          return [resource, { error: 'No content in response' }];
        }

        try {
          const parsed = JSON.parse(textContent.text);
          // Extract items array from the response (formatListResponse uses 'items' key)
          const items = parsed.items ?? parsed.data ?? [];
          return [resource, { items: Array.isArray(items) ? items : [] }];
        } catch {
          return [resource, { error: 'Failed to parse response JSON' }];
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return [resource, { error: message }];
      }
    },
  );

  const searchResults = await Promise.all(searchPromises);

  // Build results object and count total
  const results: Record<string, unknown[] | { error: string }> = {};
  let totalResults = 0;

  for (const [resource, result] of searchResults) {
    if (result.error) {
      results[resource] = { error: result.error };
    } else {
      const items = result.items ?? [];
      results[resource] = items;
      totalResults += items.length;
    }
  }

  return jsonResult({
    query: trimmedQuery,
    resources_searched: resourcesToSearch,
    results,
    total_results: totalResults,
  });
}
