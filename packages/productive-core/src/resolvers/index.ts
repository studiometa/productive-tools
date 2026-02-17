export {
  createResourceResolver,
  resolve,
  isNumericId,
  needsResolution,
  detectResourceType,
  resolveFilterValue,
  resolveFilterIds,
  ResolveError,
  FILTER_TYPE_MAPPING,
} from './resource-resolver.js';

export type {
  DetectionResult,
  ResolveResult,
  ResolveOptions,
  ResolverCache,
  ResolvedMetadata,
  CreateResolverOptions,
} from './resource-resolver.js';
