export { Productive } from './productive.js';
export type { ProductiveOptions } from './productive.js';
export { AsyncPaginatedIterator } from './pagination.js';
export type { PageFetcher } from './pagination.js';
export { QueryBuilder } from './query-builder.js';
export type { BaseListOptions } from './query-builder.js';
export { resolveResource, resolveListResponse, resolveSingleResponse } from './json-api.js';
export type { ResolvedResource } from './json-api.js';
export type { ResourceRef, Task, Project, TimeEntry, Person, Company, Deal } from './types.js';
export {
  ProductiveError,
  ResourceNotFoundError,
  RateLimitError,
  ValidationError,
  AuthenticationError,
  NetworkError,
  wrapError,
  isProductiveError,
} from './errors.js';
