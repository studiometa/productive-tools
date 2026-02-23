import type {
  IncludedResource,
  ProductiveApiResponse,
  RelationshipData,
} from '@studiometa/productive-api';

/**
 * A resolved resource where relationships are inlined as full objects.
 */
export type ResolvedResource = {
  id: string;
  type: string;
  [key: string]: unknown;
};

/**
 * Resolve a single relationship by finding the matching resource in the included array.
 */
function resolveRelationship(
  rel: RelationshipData,
  includedMap: Map<string, IncludedResource>,
): ResolvedResource | null {
  if (!rel.data) return null;
  const key = `${rel.data.type}:${rel.data.id}`;
  const found = includedMap.get(key);
  if (!found) return null;
  return { id: found.id, type: found.type, ...found.attributes };
}

/**
 * Build a lookup map from the included array for O(1) access.
 */
function buildIncludedMap(included?: IncludedResource[]): Map<string, IncludedResource> {
  const map = new Map<string, IncludedResource>();
  if (included) {
    for (const resource of included) {
      map.set(`${resource.type}:${resource.id}`, resource);
    }
  }
  return map;
}

/**
 * Resolve a JSON:API resource, inlining its relationships from the included array.
 */
export function resolveResource<
  T extends {
    id: string;
    type: string;
    attributes: Record<string, unknown>;
    relationships?: Record<string, RelationshipData>;
  },
>(resource: T, includedMap: Map<string, IncludedResource>): ResolvedResource {
  const resolved: ResolvedResource = {
    id: resource.id,
    type: resource.type,
    ...resource.attributes,
  };

  if (resource.relationships) {
    for (const [name, rel] of Object.entries(resource.relationships)) {
      resolved[name] = resolveRelationship(rel, includedMap);
    }
  }

  return resolved;
}

/**
 * Resolve a full JSON:API list response.
 */
export function resolveListResponse<
  T extends {
    id: string;
    type: string;
    attributes: Record<string, unknown>;
    relationships?: Record<string, RelationshipData>;
  },
>(
  response: ProductiveApiResponse<T[]>,
): { data: ResolvedResource[]; meta: ProductiveApiResponse<T[]>['meta'] } {
  const includedMap = buildIncludedMap(response.included);
  return {
    data: response.data.map((item) => resolveResource(item, includedMap)),
    meta: response.meta,
  };
}

/**
 * Resolve a full JSON:API single response.
 */
export function resolveSingleResponse<
  T extends {
    id: string;
    type: string;
    attributes: Record<string, unknown>;
    relationships?: Record<string, RelationshipData>;
  },
>(
  response: ProductiveApiResponse<T>,
): { data: ResolvedResource; meta: ProductiveApiResponse<T>['meta'] } {
  const includedMap = buildIncludedMap(response.included);
  return {
    data: resolveResource(response.data, includedMap),
    meta: response.meta,
  };
}
