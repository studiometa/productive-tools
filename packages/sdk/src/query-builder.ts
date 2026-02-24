import type { AsyncPaginatedIterator } from './pagination.js';

export interface BaseListOptions {
  page?: number;
  perPage?: number;
  filter?: Record<string, string>;
  sort?: string;
  include?: string[];
}

interface CollectionAdapter<T, R> {
  list(options: BaseListOptions): Promise<R>;
  all(options: Omit<BaseListOptions, 'page'>): AsyncPaginatedIterator<T>;
}

export class QueryBuilder<T, ListResult> {
  private _filter: Record<string, string> = {};
  private _sort?: string;
  private _include: string[] = [];
  private _page?: number;
  private _perPage?: number;
  private collection: CollectionAdapter<T, ListResult>;

  constructor(collection: CollectionAdapter<T, ListResult>) {
    this.collection = collection;
  }

  filter(filters: Record<string, string>): this {
    Object.assign(this._filter, filters);
    return this;
  }

  orderBy(field: string): this {
    this._sort = field;
    return this;
  }

  include(...paths: string[]): this {
    for (const p of paths) {
      if (!this._include.includes(p)) this._include.push(p);
    }
    return this;
  }

  page(n: number): this {
    this._page = n;
    return this;
  }

  perPage(n: number): this {
    this._perPage = n;
    return this;
  }

  build(): BaseListOptions {
    const opts: BaseListOptions = {};
    if (Object.keys(this._filter).length > 0) opts.filter = { ...this._filter };
    if (this._sort !== undefined) opts.sort = this._sort;
    if (this._include.length > 0) opts.include = [...this._include];
    if (this._page !== undefined) opts.page = this._page;
    if (this._perPage !== undefined) opts.perPage = this._perPage;
    return opts;
  }

  async list(): Promise<ListResult> {
    return this.collection.list(this.build());
  }

  all(): AsyncPaginatedIterator<T> {
    const { page: _, ...rest } = this.build();
    return this.collection.all(rest);
  }
}
