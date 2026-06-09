import { readApi } from '@studiometa/productive-core';

import type { HandlerContext, ToolResult } from './types.js';

import { UserInputError } from '../errors.js';
import {
  buildApiReadQuery,
  DEFAULT_MAX_PAGES,
  describeApiEndpoint,
  resolveApiEndpoint,
  searchApiEndpoints,
  validateFilterSpec,
  validatePagination,
  validateSort,
} from './api-utils.js';
import { formatError, jsonResult } from './utils.js';

export interface ApiReadArgs {
  path?: string;
  search?: string;
  describe?: boolean;
  filter?: Record<string, unknown>;
  include?: string[];
  sort?: string[];
  page?: number;
  per_page?: number;
  paginate?: boolean;
  max_pages?: number;
}

export async function handleApiRead(args: ApiReadArgs, ctx: HandlerContext): Promise<ToolResult> {
  try {
    // Discovery mode: find documented endpoints by keyword (no path needed).
    if (args.search) {
      const result = searchApiEndpoints(args.search);
      return jsonResult({
        ...result,
        _tip: 'Call api_read with describe=true and a matching path for its full spec (filters, sort, body fields).',
      });
    }

    if (!args.path) {
      throw new UserInputError(
        'Provide "path" to read/describe an endpoint, or "search" to find one.',
      );
    }

    if (args.describe) {
      return jsonResult(describeApiEndpoint(args.path));
    }

    validatePagination(args);
    const { methodSpec, normalizedPath } = resolveApiEndpoint(args.path, 'GET');
    validateFilterSpec(args.filter, methodSpec);
    validateSort(args.sort, methodSpec);

    const result = await readApi(
      {
        path: normalizedPath,
        query: buildApiReadQuery(args),
        paginate: args.paginate,
        maxPages: args.max_pages ?? DEFAULT_MAX_PAGES,
        page: args.page,
      },
      ctx.executor(),
    );

    return jsonResult(result.data);
  } catch (error) {
    return formatError(error);
  }
}
