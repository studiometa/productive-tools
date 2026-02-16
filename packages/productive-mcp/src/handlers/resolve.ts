/**
 * Resolve handler for MCP
 *
 * Provides a resolve action for finding resources by human-friendly identifiers.
 */

import type { ProductiveApi } from '@studiometa/productive-cli';

import type { HandlerContext, ToolResult } from './types.js';

import { UserInputError } from '../errors.js';
import { errorResult, inputErrorResult, jsonResult } from './utils.js';

/**
 * Supported resource types for resolution
 */
export type ResolvableResourceType = 'person' | 'project' | 'company' | 'deal' | 'service';

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
 * Email pattern: user@domain.tld
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Project number pattern: PRJ-123, P-123
 */
const PROJECT_NUMBER_PATTERN = /^(PRJ|P)-\d+$/i;

/**
 * Deal number pattern: D-123, DEAL-123
 */
const DEAL_NUMBER_PATTERN = /^(D|DEAL)-\d+$/i;

/**
 * Numeric ID pattern (passthrough, no resolution needed)
 */
const NUMERIC_ID_PATTERN = /^\d+$/;

/**
 * Check if a value is a numeric ID
 */
export function isNumericId(value: string): boolean {
  return NUMERIC_ID_PATTERN.test(value);
}

/**
 * Detect resource type from query string pattern
 */
export function detectResourceType(query: string): ResolvableResourceType | null {
  if (NUMERIC_ID_PATTERN.test(query)) return null;
  if (EMAIL_PATTERN.test(query)) return 'person';
  if (PROJECT_NUMBER_PATTERN.test(query)) return 'project';
  if (DEAL_NUMBER_PATTERN.test(query)) return 'deal';
  return null;
}

/**
 * Resolve a person by email address
 */
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
    label: `${person.attributes.first_name || ''} ${person.attributes.last_name || ''}`.trim(),
    query: email,
    exact: true,
  };
}

/**
 * Resolve a person by name search
 */
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

/**
 * Resolve a project by project number
 */
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
    // Try without normalization
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

/**
 * Resolve a project by name search
 */
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

/**
 * Resolve a company by name search
 */
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

/**
 * Resolve a deal by deal number
 */
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

/**
 * Resolve a deal by name search
 */
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

/**
 * Resolve a service by name within a project
 */
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

/**
 * Main resolve function
 */
export async function resolve(
  api: ProductiveApi,
  query: string,
  type?: ResolvableResourceType,
  projectId?: string,
): Promise<ResolveResult[]> {
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
  let resourceType: ResolvableResourceType | undefined = type;
  if (!resourceType) {
    const detected = detectResourceType(query);
    if (!detected) {
      throw new UserInputError(
        'Cannot determine resource type. Provide a type parameter (person, project, company, deal, service).',
        [`Query: "${query}"`, 'Provide type parameter: person, project, company, deal, or service'],
      );
    }
    resourceType = detected;
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
    throw new UserInputError(`No ${resourceType} found matching "${query}"`, [
      `Query: "${query}"`,
      `Type: ${resourceType}`,
    ]);
  }

  return results;
}

/**
 * Resolve a filter value if it needs resolution
 */
export async function resolveFilterValue(
  api: ProductiveApi,
  value: string,
  type: ResolvableResourceType,
  projectId?: string,
): Promise<string> {
  if (isNumericId(value)) return value;

  const results = await resolve(api, value, type, projectId);
  return results[0].id;
}

/**
 * Filter type mapping for common filter names
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

/**
 * Metadata about resolved filters
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
 * Resolve filters and return both resolved values and metadata
 */
export async function resolveFilters(
  api: ProductiveApi,
  filters: Record<string, string>,
  projectId?: string,
): Promise<{ resolved: Record<string, string>; metadata: ResolvedMetadata }> {
  const resolved: Record<string, string> = {};
  const metadata: ResolvedMetadata = {};

  for (const [key, value] of Object.entries(filters)) {
    const type = FILTER_TYPE_MAPPING[key];

    if (!type || isNumericId(value)) {
      resolved[key] = value;
      continue;
    }

    try {
      const results = await resolve(api, value, type, projectId);
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

/**
 * Arguments for resolve action
 */
interface ResolveArgs {
  query?: string;
  type?: ResolvableResourceType;
  project_id?: string;
}

/**
 * Handle resolve action for a resource
 */
export async function handleResolve(args: ResolveArgs, ctx: HandlerContext): Promise<ToolResult> {
  const { query, type, project_id } = args;

  if (!query) {
    return errorResult('query is required for resolve action');
  }

  try {
    const results = await resolve(ctx.api, query, type, project_id);

    return jsonResult({
      query,
      matches: results,
      exact: results.length === 1 && results[0].exact,
    });
  } catch (error) {
    if (error instanceof UserInputError) {
      return inputErrorResult(error);
    }
    throw error;
  }
}
