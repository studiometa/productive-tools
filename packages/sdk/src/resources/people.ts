import type {
  ProductivePerson,
  ProductiveApi,
  ProductiveApiMeta,
} from '@studiometa/productive-api';

import type { Person } from '../types.js';

import { resolveListResponse, resolveSingleResponse } from '../json-api.js';
import { AsyncPaginatedIterator } from '../pagination.js';
import { QueryBuilder } from '../query-builder.js';
import { BaseCollection } from './base.js';

export interface PeopleListOptions {
  page?: number;
  perPage?: number;
  filter?: Record<string, string>;
  sort?: string;
}

export interface PeopleListResult {
  data: Person[];
  meta: ProductiveApiMeta | undefined;
}

export interface PeopleGetResult {
  data: Person;
  meta: ProductiveApiMeta | undefined;
}

export class PeopleCollection extends BaseCollection {
  private userId?: string;

  constructor(api: ProductiveApi, userId?: string) {
    super(api);
    this.userId = userId;
  }

  /**
   * List people with optional filtering and pagination.
   */
  async list(options: PeopleListOptions = {}): Promise<PeopleListResult> {
    const response = await this.wrapRequest(() => this.api.getPeople(options));
    return resolveListResponse<ProductivePerson, Person>(response);
  }

  /**
   * Get a single person by ID.
   */
  async get(id: string): Promise<PeopleGetResult> {
    const response = await this.wrapRequest(() => this.api.getPerson(id));
    return resolveSingleResponse<ProductivePerson, Person>(response);
  }

  /**
   * Get the current authenticated user.
   * Requires `userId` to be set in Productive options.
   */
  async me(): Promise<PeopleGetResult> {
    if (!this.userId) {
      throw new Error('userId must be set in ProductiveOptions to call people.me()');
    }
    return this.get(this.userId);
  }

  /**
   * Start a fluent query builder for people, optionally with initial filters.
   */
  where(filters: Record<string, string> = {}): QueryBuilder<Person, PeopleListResult> {
    return new QueryBuilder<Person, PeopleListResult>(this).filter(filters);
  }

  /**
   * Iterate over all people across all pages.
   */
  all(options: Omit<PeopleListOptions, 'page'> = {}): AsyncPaginatedIterator<Person> {
    const perPage = options.perPage ?? 200;
    return new AsyncPaginatedIterator<Person>(async (page) => {
      return this.list({ ...options, page, perPage });
    }, perPage);
  }
}
