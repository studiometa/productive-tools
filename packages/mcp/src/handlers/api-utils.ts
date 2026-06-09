import type { ApiEndpointSpec, ApiMethodSpec } from '../api-reference/types.js';

import { PRODUCTIVE_API_REFERENCE } from '../api-reference/generated.js';
import { UserInputError } from '../errors.js';

export const MAX_PER_PAGE = 200;
export const DEFAULT_MAX_PAGES = 20;
export const MAX_MAX_PAGES = 50;

export interface ResolvedApiEndpoint {
  spec: ApiEndpointSpec;
  methodSpec: ApiMethodSpec;
  normalizedPath: string;
}

function hasTraversal(path: string): boolean {
  return path.includes('..') || path.toLowerCase().includes('%2e%2e');
}

export function normalizeApiPath(path: string): string {
  if (!path.startsWith('/')) {
    throw new UserInputError('API path must start with "/".');
  }

  if (path.startsWith('//') || path.includes('://')) {
    throw new UserInputError('Absolute URLs are not allowed. Use a relative Productive API path.');
  }

  if (hasTraversal(path)) {
    throw new UserInputError('Path traversal is not allowed.');
  }

  const normalized = path.replace(/^\/api\/v2/, '');
  return normalized || '/';
}

export function resolveApiEndpoint(
  path: string,
  method: keyof ApiEndpointSpec['methods'],
): ResolvedApiEndpoint {
  const normalizedPath = normalizeApiPath(path);

  for (const spec of Object.values(PRODUCTIVE_API_REFERENCE)) {
    const pattern = new RegExp(`^${spec.path.replace(/\{[^/]+\}/g, '[^/]+')}$`);
    if (!pattern.test(normalizedPath)) continue;

    const methodSpec = spec.methods[method];
    if (!methodSpec) {
      throw new UserInputError(`Method ${method} is not allowed for path "${normalizedPath}".`);
    }

    return { spec, methodSpec, normalizedPath };
  }

  throw new UserInputError(`Unknown or undocumented API path: "${normalizedPath}".`);
}

function appendFilterEntries(
  entries: Array<[string, string]>,
  prefix: string,
  value: unknown,
): void {
  if (value === undefined || value === null) return;

  if (Array.isArray(value)) {
    value.forEach((item, index) => appendFilterEntries(entries, `${prefix}[${index}]`, item));
    return;
  }

  if (typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      appendFilterEntries(entries, `${prefix}[${key}]`, nestedValue);
    }
    return;
  }

  entries.push([prefix, String(value)]);
}

export function serializeFilter(filter?: Record<string, unknown>): Record<string, string> {
  if (!filter) return {};

  const entries: Array<[string, string]> = [];
  for (const [key, value] of Object.entries(filter)) {
    appendFilterEntries(entries, `filter[${key}]`, value);
  }

  return Object.fromEntries(entries);
}

export function buildApiReadQuery(args: {
  filter?: Record<string, unknown>;
  include?: string[];
  sort?: string[];
  page?: number;
  per_page?: number;
}): Record<string, string> {
  const query = serializeFilter(args.filter);

  if (args.include?.length) query.include = args.include.join(',');
  if (args.sort?.length) query.sort = args.sort.join(',');
  if (args.page) query['page[number]'] = String(args.page);
  if (args.per_page) query['page[size]'] = String(args.per_page);

  return query;
}

export function validatePagination(args: { per_page?: number; max_pages?: number }): void {
  if (args.per_page && args.per_page > MAX_PER_PAGE) {
    throw new UserInputError(`per_page cannot exceed ${MAX_PER_PAGE}.`);
  }

  if (args.max_pages && args.max_pages > MAX_MAX_PAGES) {
    throw new UserInputError(`max_pages cannot exceed ${MAX_MAX_PAGES}.`);
  }
}

function validateFilterNode(filter: Record<string, unknown>, methodSpec: ApiMethodSpec): void {
  const allowedFilters = methodSpec.filters ?? {};

  for (const [key, value] of Object.entries(filter)) {
    if (key === '$op') continue;

    if (/^\d+$/.test(key)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        validateFilterNode(value as Record<string, unknown>, methodSpec);
      }
      continue;
    }

    const filterSpec = allowedFilters[key];
    if (!filterSpec) {
      throw new UserInputError(
        `Invalid filter field "${key}".`,
        Object.keys(allowedFilters).length > 0
          ? [`Valid filters: ${Object.keys(allowedFilters).join(', ')}`]
          : undefined,
      );
    }

    if (typeof value !== 'object' || value === null || Array.isArray(value)) continue;

    const operators = new Set(Object.keys(filterSpec.operators ?? {}));
    for (const operator of Object.keys(value as Record<string, unknown>)) {
      if (operator === '$op' || /^\d+$/.test(operator)) continue;
      if (!operators.has(operator)) {
        throw new UserInputError(
          `Invalid operator "${operator}" for filter "${key}".`,
          operators.size > 0 ? [`Valid operators: ${Array.from(operators).join(', ')}`] : undefined,
        );
      }
    }
  }
}

export function validateFilterSpec(
  filter: Record<string, unknown> | undefined,
  methodSpec: ApiMethodSpec,
): void {
  if (!filter) return;

  validateFilterNode(filter, methodSpec);
}

export function validateSort(sort: string[] | undefined, methodSpec: ApiMethodSpec): void {
  if (!sort?.length) return;

  const validSort = new Set(methodSpec.sort ?? []);
  for (const value of sort) {
    if (!validSort.has(value)) {
      throw new UserInputError(
        `Invalid sort field "${value}".`,
        validSort.size > 0 ? [`Valid sort values: ${Array.from(validSort).join(', ')}`] : undefined,
      );
    }
  }
}

function buildExampleFilter(methodSpec: ApiMethodSpec): Record<string, unknown> | undefined {
  const filterEntry = Object.entries(methodSpec.filters ?? {})[0];
  if (!filterEntry) return undefined;

  const [field, spec] = filterEntry;
  const operators = Object.keys(spec.operators ?? {});
  if (operators.includes('eq')) {
    return { [field]: { eq: '<value>' } };
  }

  return { [field]: '<value>' };
}

function buildMethodExample(
  path: string,
  method: string,
  methodSpec: ApiMethodSpec,
): Record<string, unknown> {
  const example: Record<string, unknown> = { path };

  if (method === 'GET') {
    const filter = buildExampleFilter(methodSpec);
    if (filter) example.filter = filter;
    if (methodSpec.sort?.length) example.sort = [methodSpec.sort[0]];
    if (methodSpec.query?.include) example.include = ['<relationship>'];
    if (methodSpec.query?.['page[number]']) example.page = 1;
    if (methodSpec.query?.['page[size]']) example.per_page = 20;
    return example;
  }

  example.method = method;
  if (methodSpec.supportsBody) {
    example.body = {
      data: {
        type: '<resource-type>',
        attributes: Object.fromEntries(
          (methodSpec.requestBodyFields ?? []).slice(0, 3).map((field) => [field, '<value>']),
        ),
      },
    };
  }

  return example;
}

/** Number of documented endpoints in the catalog. */
export function apiEndpointCount(): number {
  return Object.keys(PRODUCTIVE_API_REFERENCE).length;
}

/** A single endpoint-catalog search match. */
export interface EndpointSearchMatch {
  path: string;
  methods: string[];
  summary?: string;
}

export interface EndpointSearchResult {
  query: string;
  total: number;
  matches: EndpointSearchMatch[];
  truncated?: boolean;
}

/** Whether a query matches anywhere in an endpoint's documented surface. */
function endpointMatches(spec: ApiEndpointSpec, q: string): boolean {
  if (spec.path.toLowerCase().includes(q)) return true;
  return Object.values(spec.methods).some(
    (method) =>
      method?.summary?.toLowerCase().includes(q) ||
      method?.description?.toLowerCase().includes(q) ||
      method?.operationId?.toLowerCase().includes(q) ||
      Object.keys(method?.filters ?? {}).some((f) => f.toLowerCase().includes(q)),
  );
}

/**
 * Keyword-search the documented endpoint catalog, returning matching paths
 * (not their full specs) so an agent can drill in with `api_read describe`.
 * Pure — reused by `api_read` search and the global `search_docs` tool.
 */
export function searchApiEndpoints(query: string, limit = 30): EndpointSearchResult {
  const q = query.trim().toLowerCase();
  const all: EndpointSearchMatch[] = [];

  for (const spec of Object.values(PRODUCTIVE_API_REFERENCE)) {
    if (!endpointMatches(spec, q)) continue;
    const methods = Object.keys(spec.methods);
    const summary = Object.values(spec.methods)
      .map((m) => m?.summary)
      .find(Boolean);
    all.push({ path: spec.path, methods, summary });
  }

  all.sort((a, b) => a.path.localeCompare(b.path));
  const matches = all.slice(0, limit);

  return {
    query,
    total: all.length,
    matches,
    ...(all.length > matches.length ? { truncated: true } : {}),
  };
}

export function describeApiEndpoint(path: string): Record<string, unknown> {
  const normalizedPath = normalizeApiPath(path);
  const matches = Object.values(PRODUCTIVE_API_REFERENCE).filter((spec) => {
    const pattern = new RegExp(`^${spec.path.replace(/\{[^/]+\}/g, '[^/]+')}$`);
    return pattern.test(normalizedPath);
  });

  if (matches.length === 0) {
    throw new UserInputError(`Unknown or undocumented API path: "${normalizedPath}".`);
  }

  const spec = matches[0];
  return {
    path: spec.path,
    normalized_path: normalizedPath,
    methods: Object.entries(spec.methods).map(([method, methodSpec]) => ({
      method,
      summary: methodSpec?.summary,
      description: methodSpec?.description,
      operation_id: methodSpec?.operationId,
      query: methodSpec?.query ?? {},
      filters: methodSpec?.filters ?? {},
      filter_operators: Object.fromEntries(
        Object.entries(methodSpec?.filters ?? {}).map(([key, value]) => [
          key,
          Object.keys(value.operators ?? {}),
        ]),
      ),
      sort: methodSpec?.sort ?? [],
      path_params: methodSpec?.pathParams ?? {},
      request_body_fields: methodSpec?.requestBodyFields ?? [],
      supports_body: methodSpec?.supportsBody ?? false,
      example: methodSpec ? buildMethodExample(spec.path, method, methodSpec) : undefined,
    })),
  };
}
