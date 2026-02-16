/**
 * Projects resource handler
 */

import type { CommonArgs, HandlerContext, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatListResponse, formatProject } from '../formatters.js';
import { getProjectHints } from '../hints.js';
import {
  resolveFilters,
  resolveFilterValue,
  handleResolve,
  isNumericId,
  type ResolvableResourceType,
} from './resolve.js';
import { inputErrorResult, jsonResult } from './utils.js';

const VALID_ACTIONS = ['list', 'get', 'resolve'];

export async function handleProjects(
  action: string,
  args: CommonArgs & { query?: string; type?: ResolvableResourceType },
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { api, formatOptions, filter, page, perPage } = ctx;
  const { id, query, type } = args;

  // Handle resolve action
  if (action === 'resolve') {
    return handleResolve({ query, type }, ctx);
  }

  if (action === 'get') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('get'));
    // Resolve ID if it's a human-friendly identifier (project number)
    const resolvedId = !isNumericId(id) ? await resolveFilterValue(api, id, 'project') : id;
    const result = await api.getProject(resolvedId);
    const formatted = formatProject(result.data, formatOptions);

    // Add contextual hints unless disabled
    if (ctx.includeHints !== false) {
      return jsonResult({
        ...formatted,
        _hints: getProjectHints(id),
      });
    }

    return jsonResult(formatted);
  }

  if (action === 'list') {
    // Resolve any human-friendly identifiers in filters
    const { resolved: resolvedFilter, metadata } = filter
      ? await resolveFilters(api, filter)
      : { resolved: filter, metadata: {} };

    const result = await api.getProjects({ filter: resolvedFilter, page, perPage });
    const response = formatListResponse(result.data, formatProject, result.meta, formatOptions);

    // Include resolution metadata if any resolutions occurred
    if (Object.keys(metadata).length > 0) {
      return jsonResult({ ...response, _resolved: metadata });
    }

    return jsonResult(response);
  }

  return inputErrorResult(ErrorMessages.invalidAction(action, 'projects', VALID_ACTIONS));
}
