import type { ProductiveProject, ProductiveApiMeta } from '@studiometa/productive-api';

import type { ResolvedResource } from '../json-api.js';

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
  data: ResolvedResource[];
  meta: ProductiveApiMeta | undefined;
}

export interface ProjectGetResult {
  data: ResolvedResource;
  meta: ProductiveApiMeta | undefined;
}

export class ProjectsCollection extends BaseCollection {
  /**
   * List projects with optional filtering and pagination.
   */
  async list(options: ProjectListOptions = {}): Promise<ProjectListResult> {
    const response = await this.api.getProjects(options);
    return resolveListResponse<ProductiveProject>(response);
  }

  /**
   * Get a single project by ID.
   */
  async get(id: string): Promise<ProjectGetResult> {
    const response = await this.api.getProject(id);
    return resolveSingleResponse<ProductiveProject>(response);
  }

  /**
   * Iterate over all projects across all pages.
   */
  all(options: Omit<ProjectListOptions, 'page'> = {}): AsyncPaginatedIterator<ResolvedResource> {
    const perPage = options.perPage ?? 200;
    return new AsyncPaginatedIterator<ResolvedResource>(async (page) => {
      return this.list({ ...options, page, perPage });
    }, perPage);
  }
}
