/**
 * Global documentation discovery (`search_docs` tool).
 *
 * One front door for "where do I even look?". It reuses the per-domain search
 * engines so nothing drifts:
 * - resource help      → searchResourceHelp  (drill in with productive action=help)
 * - raw API endpoints  → searchApiEndpoints   (drill in with api_read describe)
 * - run_script API     → findDocSections      (this tool IS the drill-in: it owns
 *                        the scripting docs and returns their full bodies)
 *
 * With no query it returns a compact table of contents across those domains;
 * with a query it returns ranked cross-domain matches. For resources and
 * endpoints it points at the focused tool to drill in; for scripting (which has
 * no other owning tool) it returns the matching section bodies directly.
 */

import type { ToolResult } from './types.js';

import { docSectionTitles, findDocSections } from '../run/docs.js';
import { apiEndpointCount, searchApiEndpoints } from './api-utils.js';
import { helpResourceNames, searchResourceHelp } from './help.js';
import { jsonResult } from './utils.js';

/** Build the no-query table of contents across documentation domains. */
function tableOfContents(): ToolResult {
  return jsonResult({
    message:
      'Documentation domains. Call search_docs with a query to search across all of them at once, or use the drill-in tool noted for each.',
    domains: [
      {
        domain: 'resources',
        description: 'Productive resources usable through the `productive` tool.',
        count: helpResourceNames().length,
        resources: helpResourceNames(),
        drill_in: 'productive action="help" resource="<name>" (or action="help" query="<term>")',
      },
      {
        domain: 'api_endpoints',
        description: 'Documented raw API endpoints for the `api_read`/`api_write` tools.',
        count: apiEndpointCount(),
        drill_in: 'api_read search="<term>", then api_read describe=true path="<path>"',
      },
      {
        domain: 'run_script',
        description: 'Sandboxed scripting API (globals, output rendering, limits).',
        topics: docSectionTitles(),
        drill_in: 'search_docs query="<topic>" (returns the full scripting section)',
      },
    ],
    _tip: 'Example: search_docs query="invoices" searches resources, endpoints, and scripting docs together.',
  });
}

/**
 * Handle the `search_docs` tool: a table of contents with no query, or ranked
 * cross-domain matches with a query.
 */
export function handleSearchDocs(query?: string): ToolResult {
  const q = typeof query === 'string' ? query.trim() : '';
  if (q === '') {
    return tableOfContents();
  }

  const resources = searchResourceHelp(q);
  const endpoints = searchApiEndpoints(q);
  // Scripting docs have no other owning tool, so return their full bodies here.
  const scripting = findDocSections(q).map((s) => ({ title: s.title, body: s.body }));

  const total = resources.length + endpoints.matches.length + scripting.length;

  return jsonResult({
    query: q,
    total,
    resources: {
      count: resources.length,
      matches: resources,
      drill_in: 'productive action="help" resource="<name>"',
    },
    api_endpoints: {
      count: endpoints.total,
      matches: endpoints.matches,
      ...(endpoints.truncated ? { truncated: true } : {}),
      drill_in: 'api_read describe=true path="<path>"',
    },
    run_script: {
      count: scripting.length,
      sections: scripting,
    },
    _tip:
      total === 0
        ? 'No matches. Call search_docs without a query for a table of contents.'
        : 'For resources and endpoints, use the drill_in tool noted; run_script sections are returned in full.',
  });
}
