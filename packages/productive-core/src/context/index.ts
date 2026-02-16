/**
 * ExecutorContext module — dependency injection for executors.
 */

export type {
  ExecutorConfig,
  ExecutorContext,
  ResolvableResourceType,
  ResolvedInfo,
  ResourceResolver,
} from './types.js';

export { createTestExecutorContext, defaultTestConfig, noopResolver } from './test-utils.js';
