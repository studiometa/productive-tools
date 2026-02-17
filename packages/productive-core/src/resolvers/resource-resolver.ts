/**
 * Resource resolver — resolves human-friendly identifiers to numeric IDs.
 *
 * Allows users to reference resources by email, name, project number, etc.
 * instead of numeric IDs. Shared by CLI and MCP.
 *
 * @example
 * ```typescript
 * const resolver = createResourceResolver(api);
 * const results = await resolver.resolve('user@example.com');
 * // [{ id: '500521', type: 'person', label: 'John Doe', ... }]
 * ```
 */

import type { ProductiveApi } from '@studiometa/productive-api';

import type { ResolvableResourceType, ResolvedInfo, ResourceResolver } from '../context/types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Result of a successful resolution
 */
export interface ResolveResult {
  id: string;
  type: ResolvableResourceType;
  label: string;
  query: string;
  exact: boolean;
}

/**
 * Options for resolve operations
 */
export interface ResolveOptions {
  type?: ResolvableResourceType;
  projectId?: string;
  first?: boolean;
}

/**
 * Optional cache interface for resolver
 */
export interface ResolverCache {
  get(key: string): Promise<ResolveResult | null>;
  set(key: string, value: ResolveResult, ttl: number): Promise<void>;
}

/**
 * Options for creating a resource resolver
 */
export interface CreateResolverOptions {
  cache?: ResolverCache;
  orgId?: string;
}

/**
 * Error thrown when resolution fails
 */
export class ResolveError extends Error {
  constructor(
    message: string,
    public query: string,
    public type?: ResolvableResourceType,
    public suggestions?: ResolveResult[],
  ) {
    super(message);
    this.name = 'ResolveError';
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      query: this.query,
      type: this.type,
      suggestions: this.suggestions,
    };
  }
}

// ============================================================================
// Pattern detection
// ============================================================================

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROJECT_NUMBER_PATTERN = /^(PRJ|P)-\d+$/i;
const DEAL_NUMBER_PATTERN = /^(D|DEAL)-\d+$/i;
const NUMERIC_ID_PATTERN = /^\d+$/;

/**
 * Detection result from pattern matching
 */
export interface DetectionResult {
  type: ResolvableResourceType;
  confidence: 'high' | 'medium' | 'low';
  pattern: string;
}

/**
 * Check if a value is a numeric ID (no resolution needed)
 */
export function isNumericId(value: string): boolean {
  return NUMERIC_ID_PATTERN.test(value);
}

/**
 * Check if a value needs resolution (not a numeric ID)
 */
export function needsResolution(value: string): boolean {
  return !isNumericId(value);
}

/**
 * Detect resource type from query string pattern
 */
export function detectResourceType(query: string): DetectionResult | null {
  if (NUMERIC_ID_PATTERN.test(query)) return null;
  if (EMAIL_PATTERN.test(query)) return { type: 'person', confidence: 'high', pattern: 'email' };
  if (PROJECT_NUMBER_PATTERN.test(query))
    return { type: 'project', confidence: 'high', pattern: 'project_number' };
  if (DEAL_NUMBER_PATTERN.test(query))
    return { type: 'deal', confidence: 'high', pattern: 'deal_number' };
  return null;
}

// ============================================================================
// Individual resolvers
// ============================================================================

async function resolvePersonByEmail(
  api: ProductiveApi,
  email: string,
): Promise<ResolveResult | null> {
  const response = await api.getPeople({
    filter: { email },
    perPage: 1,
  });

  if (response.data.length === 0) return null;

  const person = response.data[0];
  return {
    id: person.id,
    type: 'person',
    label:
      `${person.attributes.first_name || ''} ${person.attributes.last_name || ''}`.trim() || email,
    query: email,
    exact: true,
  };
}

async function resolvePersonByName(api: ProductiveApi, name: string): Promise<ResolveResult[]> {
  const response = await api.getPeople({
    filter: { query: name },
    perPage: 10,
  });

  return response.data.map((person) => ({
    id: person.id,
    type: 'person' as const,
    label: `${person.attributes.first_name || ''} ${person.attributes.last_name || ''}`.trim(),
    query: name,
    exact: false,
  }));
}

async function resolveProjectByNumber(
  api: ProductiveApi,
  projectNumber: string,
): Promise<ResolveResult | null> {
  const normalizedNumber = projectNumber.toUpperCase().replace(/^P-/, 'PRJ-');

  const response = await api.getProjects({
    filter: { project_number: normalizedNumber },
    perPage: 1,
  });

  if (response.data.length === 0) {
    const altResponse = await api.getProjects({
      filter: { project_number: projectNumber },
      perPage: 1,
    });
    if (altResponse.data.length === 0) return null;

    const project = altResponse.data[0];
    return {
      id: project.id,
      type: 'project',
      label: project.attributes.name || projectNumber,
      query: projectNumber,
      exact: true,
    };
  }

  const project = response.data[0];
  return {
    id: project.id,
    type: 'project',
    label: project.attributes.name || projectNumber,
    query: projectNumber,
    exact: true,
  };
}

async function resolveProjectByName(api: ProductiveApi, name: string): Promise<ResolveResult[]> {
  const response = await api.getProjects({
    filter: { query: name },
    perPage: 10,
  });

  return response.data.map((project) => ({
    id: project.id,
    type: 'project' as const,
    label: project.attributes.name || '',
    query: name,
    exact: false,
  }));
}

async function resolveCompanyByName(api: ProductiveApi, name: string): Promise<ResolveResult[]> {
  const response = await api.getCompanies({
    filter: { query: name },
    perPage: 10,
  });

  return response.data.map((company) => ({
    id: company.id,
    type: 'company' as const,
    label: company.attributes.name || '',
    query: name,
    exact: false,
  }));
}

async function resolveDealByNumber(
  api: ProductiveApi,
  dealNumber: string,
): Promise<ResolveResult | null> {
  const normalizedNumber = dealNumber.toUpperCase().replace(/^DEAL-/, 'D-');

  const response = await api.getDeals({
    filter: { deal_number: normalizedNumber },
    perPage: 1,
  });

  if (response.data.length === 0) {
    const altResponse = await api.getDeals({
      filter: { deal_number: dealNumber },
      perPage: 1,
    });
    if (altResponse.data.length === 0) return null;

    const deal = altResponse.data[0];
    return {
      id: deal.id,
      type: 'deal',
      label: deal.attributes.name || dealNumber,
      query: dealNumber,
      exact: true,
    };
  }

  const deal = response.data[0];
  return {
    id: deal.id,
    type: 'deal',
    label: deal.attributes.name || dealNumber,
    query: dealNumber,
    exact: true,
  };
}

async function resolveDealByName(api: ProductiveApi, name: string): Promise<ResolveResult[]> {
  const response = await api.getDeals({
    filter: { query: name },
    perPage: 10,
  });

  return response.data.map((deal) => ({
    id: deal.id,
    type: 'deal' as const,
    label: deal.attributes.name || '',
    query: name,
    exact: false,
  }));
}

async function resolveServiceByName(
  api: ProductiveApi,
  name: string,
  projectId?: string,
): Promise<ResolveResult[]> {
  const filter: Record<string, string> = {};
  if (projectId) filter.project_id = projectId;

  const response = await api.getServices({
    filter,
    perPage: 200,
  });

  const nameLower = name.toLowerCase();
  const matches = response.data.filter((service) =>
    (service.attributes.name || '').toLowerCase().includes(nameLower),
  );

  return matches.map((service) => ({
    id: service.id,
    type: 'service' as const,
    label: service.attributes.name || '',
    query: name,
    exact: (service.attributes.name || '').toLowerCase() === nameLower,
  }));
}

// ============================================================================
// Main resolve function
// ============================================================================

/**
 * Resolve a human-friendly identifier to resource matches.
 *
 * @param api - ProductiveApi instance
 * @param query - The query string (email, name, project number, etc.)
 * @param options - Resolution options
 * @returns Array of matching results
 * @throws ResolveError if no matches found or type cannot be determined
 */
export async function resolve(
  api: ProductiveApi,
  query: string,
  options: ResolveOptions = {},
): Promise<ResolveResult[]> {
  const { type, projectId, first } = options;

  // Numeric IDs don't need resolution
  if (isNumericId(query)) {
    return [
      {
        id: query,
        type: type || 'project',
        label: query,
        query,
        exact: true,
      },
    ];
  }

  // Determine resource type
  let resourceType = type;
  if (!resourceType) {
    const detected = detectResourceType(query);
    if (!detected) {
      throw new ResolveError(
        `Cannot determine resource type for "${query}". Specify a type.`,
        query,
      );
    }
    resourceType = detected.type;
  }

  // Resolve based on type
  let results: ResolveResult[] = [];

  switch (resourceType) {
    case 'person':
      if (EMAIL_PATTERN.test(query)) {
        const result = await resolvePersonByEmail(api, query);
        results = result ? [result] : [];
      } else {
        results = await resolvePersonByName(api, query);
      }
      break;

    case 'project':
      if (PROJECT_NUMBER_PATTERN.test(query)) {
        const result = await resolveProjectByNumber(api, query);
        results = result ? [result] : [];
      } else {
        results = await resolveProjectByName(api, query);
      }
      break;

    case 'company':
      results = await resolveCompanyByName(api, query);
      break;

    case 'deal':
      if (DEAL_NUMBER_PATTERN.test(query)) {
        const result = await resolveDealByNumber(api, query);
        results = result ? [result] : [];
      } else {
        results = await resolveDealByName(api, query);
      }
      break;

    case 'service':
      results = await resolveServiceByName(api, query, projectId);
      break;
  }

  if (results.length === 0) {
    throw new ResolveError(`No ${resourceType} found matching "${query}"`, query, resourceType);
  }

  if (first && results.length > 1) {
    return [results[0]];
  }

  return results;
}

// ============================================================================
// Filter type mapping
// ============================================================================

/**
 * Default mapping from filter parameter names to resource types.
 */
export const FILTER_TYPE_MAPPING: Record<string, ResolvableResourceType> = {
  person_id: 'person',
  assignee_id: 'person',
  creator_id: 'person',
  responsible_id: 'person',
  project_id: 'project',
  company_id: 'company',
  deal_id: 'deal',
  service_id: 'service',
};

// ============================================================================
// Standalone resolve helpers (used by CLI)
// ============================================================================

/**
 * Metadata about resolved filters (for response enrichment)
 */
export interface ResolvedMetadata {
  [key: string]: {
    input: string;
    id: string;
    label: string;
    reusable: boolean;
  };
}

/**
 * Resolve a filter value if it needs resolution, or return as-is if numeric
 *
 * @param api - ProductiveApi instance
 * @param value - The filter value (ID or human-friendly identifier)
 * @param type - The resource type to resolve to
 * @param options - Additional resolution options
 * @returns Resolved ID
 * @throws ResolveError if resolution fails
 */
export async function resolveFilterValue(
  api: ProductiveApi,
  value: string,
  type: ResolvableResourceType,
  options: Omit<ResolveOptions, 'type'> = {},
): Promise<string> {
  if (isNumericId(value)) {
    return value;
  }

  const results = await resolve(api, value, { ...options, type, first: true });

  if (results.length === 0) {
    throw new ResolveError(`No ${type} found matching "${value}"`, value, type);
  }

  return results[0].id;
}

/**
 * Resolve multiple filter IDs and return metadata
 *
 * @param api - ProductiveApi instance
 * @param filters - Object mapping filter names to values
 * @param typeMapping - Object mapping filter names to resource types
 * @param options - Resolution options
 * @returns Object with resolved IDs and metadata
 */
export async function resolveFilterIds(
  api: ProductiveApi,
  filters: Record<string, string>,
  typeMapping: Record<string, ResolvableResourceType>,
  options: Omit<ResolveOptions, 'type'> = {},
): Promise<{ resolved: Record<string, string>; metadata: ResolvedMetadata }> {
  const resolved: Record<string, string> = {};
  const metadata: ResolvedMetadata = {};

  for (const [key, value] of Object.entries(filters)) {
    const type = typeMapping[key];

    if (!type || isNumericId(value)) {
      resolved[key] = value;
      continue;
    }

    try {
      const results = await resolve(api, value, { ...options, type, first: true });

      if (results.length > 0) {
        const result = results[0];
        resolved[key] = result.id;
        metadata[key] = {
          input: value,
          id: result.id,
          label: result.label,
          reusable: result.exact,
        };
      } else {
        resolved[key] = value;
      }
    } catch {
      resolved[key] = value;
    }
  }

  return { resolved, metadata };
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a ResourceResolver backed by the resolve functions.
 *
 * The returned object implements the ResourceResolver interface used by executors.
 * Optionally accepts a cache for faster repeated lookups.
 *
 * @param api - ProductiveApi instance
 * @param options - Cache and org ID for caching
 */
export function createResourceResolver(
  api: ProductiveApi,
  options: CreateResolverOptions = {},
): ResourceResolver {
  const { cache, orgId } = options;

  const CACHE_TTL_EXACT = 24 * 60 * 60 * 1000; // 24h
  const CACHE_TTL_FUZZY = 60 * 60 * 1000; // 1h

  function cacheKey(type: ResolvableResourceType, query: string): string {
    return `resolve:${orgId || 'default'}:${type}:${query.toLowerCase()}`;
  }

  return {
    async resolveValue(
      value: string,
      type: ResolvableResourceType,
      opts?: { projectId?: string },
    ): Promise<string> {
      if (isNumericId(value)) return value;

      // Try cache
      if (cache) {
        const cached = await cache.get(cacheKey(type, value));
        if (cached) return cached.id;
      }

      const results = await resolve(api, value, {
        type,
        projectId: opts?.projectId,
        first: true,
      });

      if (results.length === 0) return value;

      // Cache the result
      if (cache && results.length === 1) {
        const ttl = results[0].exact ? CACHE_TTL_EXACT : CACHE_TTL_FUZZY;
        await cache.set(cacheKey(type, value), results[0], ttl).catch(() => {});
      }

      return results[0].id;
    },

    async resolveFilters(
      filters: Record<string, string>,
      typeMapping?: Record<string, ResolvableResourceType>,
    ): Promise<{
      resolved: Record<string, string>;
      metadata: Record<string, ResolvedInfo>;
    }> {
      const mapping = typeMapping || FILTER_TYPE_MAPPING;
      const resolved: Record<string, string> = {};
      const metadata: Record<string, ResolvedInfo> = {};

      for (const [key, value] of Object.entries(filters)) {
        const filterType = mapping[key];

        if (!filterType || isNumericId(value)) {
          resolved[key] = value;
          continue;
        }

        try {
          const results = await resolve(api, value, { type: filterType, first: true });

          if (results.length > 0) {
            const result = results[0];
            resolved[key] = result.id;
            metadata[key] = {
              query: value,
              id: result.id,
              label: result.label,
              type: result.type,
            };

            // Cache
            if (cache) {
              const ttl = result.exact ? CACHE_TTL_EXACT : CACHE_TTL_FUZZY;
              await cache.set(cacheKey(filterType, value), result, ttl).catch(() => {});
            }
          } else {
            resolved[key] = value;
          }
        } catch {
          resolved[key] = value;
        }
      }

      return { resolved, metadata };
    },
  };
}
