/**
 * People resource handler
 */

import type { ProductiveCredentials } from '../auth.js';
import type { CommonArgs, HandlerContext, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatListResponse, formatPerson } from '../formatters.js';
import { getPersonHints } from '../hints.js';
import {
  resolveFilters,
  resolveFilterValue,
  handleResolve,
  isNumericId,
  type ResolvableResourceType,
} from './resolve.js';
import { inputErrorResult, jsonResult } from './utils.js';

const VALID_ACTIONS = ['list', 'get', 'me', 'resolve'];

export async function handlePeople(
  action: string,
  args: CommonArgs & { query?: string; type?: ResolvableResourceType },
  ctx: HandlerContext,
  credentials: ProductiveCredentials,
): Promise<ToolResult> {
  const { api, formatOptions, filter, page, perPage } = ctx;
  const { id, query, type } = args;

  // Handle resolve action
  if (action === 'resolve') {
    return handleResolve({ query, type }, ctx);
  }

  if (action === 'get') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('get'));
    // Resolve ID if it's a human-friendly identifier (email)
    const resolvedId = !isNumericId(id) ? await resolveFilterValue(api, id, 'person') : id;
    const result = await api.getPerson(resolvedId);
    const formatted = formatPerson(result.data, formatOptions);

    // Add contextual hints unless disabled
    if (ctx.includeHints !== false) {
      return jsonResult({
        ...formatted,
        _hints: getPersonHints(id),
      });
    }

    return jsonResult(formatted);
  }

  if (action === 'me') {
    if (credentials.userId) {
      const result = await api.getPerson(credentials.userId);
      const formatted = formatPerson(result.data, formatOptions);

      // Add contextual hints unless disabled
      if (ctx.includeHints !== false) {
        return jsonResult({
          ...formatted,
          _hints: getPersonHints(credentials.userId),
        });
      }

      return jsonResult(formatted);
    }
    return jsonResult({
      message: 'User ID not configured. Set userId in credentials to use this action.',
      hint: 'Use action="list" to find people, or configure the user ID in your credentials.',
      organizationId: credentials.organizationId,
    });
  }

  if (action === 'list') {
    // Resolve any human-friendly identifiers in filters
    const { resolved: resolvedFilter, metadata } = filter
      ? await resolveFilters(api, filter)
      : { resolved: filter, metadata: {} };

    const result = await api.getPeople({ filter: resolvedFilter, page, perPage });
    const response = formatListResponse(result.data, formatPerson, result.meta, formatOptions);

    // Include resolution metadata if any resolutions occurred
    if (Object.keys(metadata).length > 0) {
      return jsonResult({ ...response, _resolved: metadata });
    }

    return jsonResult(response);
  }

  return inputErrorResult(ErrorMessages.invalidAction(action, 'people', VALID_ACTIONS));
}
