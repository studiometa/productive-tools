/**
 * Project executors — pure business logic for project management.
 */

export { getProjectContext } from './context.js';
export { getProject } from './get.js';
export { buildProjectFilters, listProjects } from './list.js';

export type {
  GetProjectContextOptions,
  GetProjectOptions,
  ListProjectsOptions,
  ProjectContextResult,
} from './types.js';
