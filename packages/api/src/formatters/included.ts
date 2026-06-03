/**
 * Resolving JSON:API `included` (sideloaded) resources into a formatted result.
 *
 * When a list/get request forwards an `include` param, the API returns the
 * related resources in a top-level `included` array. These helpers inline those
 * relationships into the formatted output so consumers (CLI, MCP) actually see
 * e.g. a project's `company` instead of just a dangling relationship id.
 */

import type { JsonApiResource } from './types.js';

/**
 * A relationship inlined from the `included` array: the resource's `id` and
 * `type` plus its attributes flattened to the top level.
 */
export interface ResolvedRelationship {
  id: string;
  type: string;
  [key: string]: unknown;
}

/**
 * Index of an `included` array keyed by `${type}\0${id}`, memoized per array
 * reference. A list response hands the *same* `included` array to every record's
 * formatter, so indexing once turns the formatting pass from O(records × includes)
 * linear scans into O(records) O(1) lookups over a single shared index.
 */
const lookupCache = new WeakMap<JsonApiResource[], Map<string, JsonApiResource>>();

const lookupKey = (type: string, id: string): string => `${type}\0${id}`;

function getLookup(included: JsonApiResource[]): Map<string, JsonApiResource> {
  const cached = lookupCache.get(included);
  if (cached) return cached;

  const lookup = new Map<string, JsonApiResource>();
  for (const resource of included) {
    const key = lookupKey(resource.type, resource.id);
    // First entry wins, matching the previous Array.find semantics.
    if (!lookup.has(key)) lookup.set(key, resource);
  }
  lookupCache.set(included, lookup);
  return lookup;
}

/**
 * Find a sideloaded resource in the `included` array by type and id.
 */
export function getIncludedResource(
  included: JsonApiResource[] | undefined,
  type: string | undefined,
  id: string | undefined,
): JsonApiResource | undefined {
  if (!included || !type || !id) return undefined;
  return getLookup(included).get(lookupKey(type, id));
}

interface ResourceRef {
  type: string;
  id: string;
}

function inline(
  ref: ResourceRef | undefined,
  included: JsonApiResource[],
): ResolvedRelationship | undefined {
  const found = getIncludedResource(included, ref?.type, ref?.id);
  if (!found) return undefined;
  // `id`/`type` stay authoritative even if the attributes happen to repeat them.
  return { ...found.attributes, id: found.id, type: found.type };
}

/**
 * Resolve every relationship on `resource` that has a matching entry in
 * `included`, returning a map keyed by relationship name. Only relationships
 * actually sideloaded (present in `included`) are returned, so this inlines
 * exactly what the caller requested via `include`. To-one relationships resolve
 * to a single object; to-many relationships resolve to an array.
 */
export function resolveRelationships(
  resource: {
    relationships?: Record<string, { data?: ResourceRef | ResourceRef[] | null }>;
  },
  included: JsonApiResource[] | undefined,
): Record<string, ResolvedRelationship | ResolvedRelationship[]> {
  const resolved: Record<string, ResolvedRelationship | ResolvedRelationship[]> = {};
  if (!included || !resource.relationships) return resolved;

  for (const [name, rel] of Object.entries(resource.relationships)) {
    const data = rel?.data;
    if (!data) continue;

    if (Array.isArray(data)) {
      const items = data
        .map((ref) => inline(ref, included))
        .filter((item): item is ResolvedRelationship => item !== undefined);
      if (items.length > 0) resolved[name] = items;
    } else {
      const item = inline(data, included);
      if (item) resolved[name] = item;
    }
  }

  return resolved;
}
