import type { ProductiveProject, ProductiveApiMeta } from '@studiometa/productive-api';

import type { Project } from '../types.js';

import { resolveListResponse, resolveSingleResponse } from '../json-api.js';
import { AsyncPaginatedIterator } from '../pagination.js';
import { BaseCollection } from './base.js';

export interface ProjectListOptions {
  page?: number;
  perPage?: number;
  filter?: Record<string, string>;
  sort?: string;
}

export interface ProjectListResult {
  data: Project[];
  meta: ProductiveApiMeta | undefined;
}

export interface ProjectGetResult {
  data: Project;
  meta: ProductiveApiMeta | undefined;
}

export class ProjectsCollection extends BaseCollection {
  /**
   * List projects with optional filtering and pagination.
   */
  async list(options: ProjectListOptions = {}): Promise<ProjectListResult> {
    const response = await this.api.getProjects(options);
    return resolveListResponse<ProductiveProject, Project>(response);
  }

  /**
   * Get a single project by ID.
   */
  async get(id: string): Promise<ProjectGetResult> {
    const response = await this.api.getProject(id);
    return resolveSingleResponse<ProductiveProject, Project>(response);
  }

  /**
   * Iterate over all projects across all pages.
   */
  all(options: Omit<ProjectListOptions, 'page'> = {}): AsyncPaginatedIterator<Project> {
    const perPage = options.perPage ?? 200;
    return new AsyncPaginatedIterator<Project>(async (page) => {
      return this.list({ ...options, page, perPage });
    }, perPage);
  }
}
