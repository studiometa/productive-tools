import type { ApiCache } from './cache.js';
import type {
  ProductiveApiResponse,
  ProductiveProject,
  ProductiveTimeEntry,
  ProductiveTask,
  ProductivePerson,
  ProductiveService,
  ProductiveBudget,
  ProductiveCompany,
  ProductiveComment,
  ProductiveTimer,
  ProductiveDeal,
  ProductiveBooking,
  ProductiveAttachment,
  ProductiveReport,
  ProductiveConfig,
} from './types.js';

import { noopCache } from './cache.js';
import { ProductiveApiError } from './error.js';

/**
 * Options for constructing a ProductiveApi instance.
 * Config must be provided explicitly — no side effects in the constructor.
 */
export interface ApiOptions {
  config: ProductiveConfig;
  cache?: ApiCache;
  useCache?: boolean;
  forceRefresh?: boolean;
}

export class ProductiveApi {
  private baseUrl: string;
  private apiToken: string;
  private organizationId: string;
  private cache: ApiCache;
  private useCache: boolean;
  private forceRefresh: boolean;

  constructor(options: ApiOptions) {
    const { config } = options;

    if (!config.apiToken) {
      throw new ProductiveApiError(
        'API token not configured. Set via: --token <token>, productive config set apiToken <token>, or PRODUCTIVE_API_TOKEN env var',
      );
    }

    if (!config.organizationId) {
      throw new ProductiveApiError(
        'Organization ID not configured. Set via: --org-id <id>, productive config set organizationId <id>, or PRODUCTIVE_ORG_ID env var',
      );
    }

    this.baseUrl = config.baseUrl || 'https://api.productive.io/api/v2';
    this.apiToken = config.apiToken;
    this.organizationId = config.organizationId;

    this.useCache = options.useCache ?? true;
    this.forceRefresh = options.forceRefresh ?? false;
    this.cache = options.cache ?? noopCache;
    this.cache.setOrgId(this.organizationId);
  }

  private async request<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: unknown;
      query?: Record<string, string>;
    } = {},
  ): Promise<T> {
    const { method = 'GET', body, query } = options;

    // Check cache for GET requests
    if (method === 'GET' && this.useCache && !this.forceRefresh) {
      const cached = await this.cache.getAsync<T>(endpoint, query || {}, this.organizationId);
      if (cached) {
        return cached;
      }
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/vnd.api+json',
      'X-Auth-Token': this.apiToken,
      'X-Organization-Id': this.organizationId,
    };

    const response = await globalThis.fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.errors?.[0]?.detail || errorMessage;
      } catch {
        // Use default error message if JSON parsing fails
      }

      throw new ProductiveApiError(errorMessage, response.status, errorText);
    }

    const data = (await response.json()) as T;

    // Cache GET responses
    if (method === 'GET' && this.useCache) {
      await this.cache.setAsync(endpoint, query || {}, this.organizationId, data);
    }

    // Invalidate cache on write operations
    if (method !== 'GET') {
      await this.cache.invalidateAsync(endpoint.split('/')[1]); // e.g., '/time_entries/123' -> 'time_entries'
    }

    return data;
  }

  // Projects
  async getProjects(params?: {
    page?: number;
    perPage?: number;
    filter?: Record<string, string>;
    sort?: string;
  }): Promise<ProductiveApiResponse<ProductiveProject[]>> {
    const query: Record<string, string> = {};

    if (params?.page) query['page[number]'] = String(params.page);
    if (params?.perPage) query['page[size]'] = String(params.perPage);
    if (params?.sort) query['sort'] = params.sort;
    if (params?.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        query[`filter[${key}]`] = value;
      });
    }

    return this.request<ProductiveApiResponse<ProductiveProject[]>>('/projects', { query });
  }

  async getProject(id: string): Promise<ProductiveApiResponse<ProductiveProject>> {
    return this.request<ProductiveApiResponse<ProductiveProject>>(`/projects/${id}`);
  }

  // Time Entries
  async getTimeEntries(params?: {
    page?: number;
    perPage?: number;
    filter?: Record<string, string>;
    sort?: string;
  }): Promise<ProductiveApiResponse<ProductiveTimeEntry[]>> {
    const query: Record<string, string> = {};

    if (params?.page) query['page[number]'] = String(params.page);
    if (params?.perPage) query['page[size]'] = String(params.perPage);
    if (params?.sort) query['sort'] = params.sort;
    if (params?.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        query[`filter[${key}]`] = value;
      });
    }

    return this.request<ProductiveApiResponse<ProductiveTimeEntry[]>>('/time_entries', { query });
  }

  async getTimeEntry(id: string): Promise<ProductiveApiResponse<ProductiveTimeEntry>> {
    return this.request<ProductiveApiResponse<ProductiveTimeEntry>>(`/time_entries/${id}`);
  }

  async createTimeEntry(data: {
    person_id: string;
    service_id: string;
    date: string;
    time: number;
    note?: string;
    task_id?: string;
  }): Promise<ProductiveApiResponse<ProductiveTimeEntry>> {
    const relationships: Record<string, { data: { type: string; id: string } }> = {
      person: {
        data: { type: 'people', id: data.person_id },
      },
      service: {
        data: { type: 'services', id: data.service_id },
      },
    };

    if (data.task_id) {
      relationships.task = {
        data: { type: 'tasks', id: data.task_id },
      };
    }

    return this.request<ProductiveApiResponse<ProductiveTimeEntry>>('/time_entries', {
      method: 'POST',
      body: {
        data: {
          type: 'time_entries',
          attributes: {
            date: data.date,
            time: data.time,
            note: data.note,
          },
          relationships,
        },
      },
    });
  }

  async updateTimeEntry(
    id: string,
    data: {
      time?: number;
      note?: string;
      date?: string;
    },
  ): Promise<ProductiveApiResponse<ProductiveTimeEntry>> {
    return this.request<ProductiveApiResponse<ProductiveTimeEntry>>(`/time_entries/${id}`, {
      method: 'PATCH',
      body: {
        data: {
          type: 'time_entries',
          id,
          attributes: data,
        },
      },
    });
  }

  async deleteTimeEntry(id: string): Promise<void> {
    await this.request<void>(`/time_entries/${id}`, {
      method: 'DELETE',
    });
  }

  // Tasks
  async getTasks(params?: {
    page?: number;
    perPage?: number;
    filter?: Record<string, string>;
    sort?: string;
    include?: string[];
  }): Promise<ProductiveApiResponse<ProductiveTask[]>> {
    const query: Record<string, string> = {};

    if (params?.page) query['page[number]'] = String(params.page);
    if (params?.perPage) query['page[size]'] = String(params.perPage);
    if (params?.sort) query['sort'] = params.sort;
    if (params?.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        query[`filter[${key}]`] = value;
      });
    }
    if (params?.include?.length) {
      query['include'] = params.include.join(',');
    }

    return this.request<ProductiveApiResponse<ProductiveTask[]>>('/tasks', {
      query,
    });
  }

  async getTask(
    id: string,
    params?: { include?: string[] },
  ): Promise<ProductiveApiResponse<ProductiveTask>> {
    const query: Record<string, string> = {};
    if (params?.include?.length) {
      query['include'] = params.include.join(',');
    }
    return this.request<ProductiveApiResponse<ProductiveTask>>(`/tasks/${id}`, {
      query,
    });
  }

  async createTask(data: {
    title: string;
    project_id: string;
    task_list_id: string;
    assignee_id?: string;
    description?: string;
    due_date?: string;
    start_date?: string;
    initial_estimate?: number;
    workflow_status_id?: string;
    private?: boolean;
  }): Promise<ProductiveApiResponse<ProductiveTask>> {
    const relationships: Record<string, { data: { type: string; id: string } }> = {
      project: {
        data: { type: 'projects', id: data.project_id },
      },
      task_list: {
        data: { type: 'task_lists', id: data.task_list_id },
      },
    };

    if (data.assignee_id) {
      relationships.assignee = {
        data: { type: 'people', id: data.assignee_id },
      };
    }

    if (data.workflow_status_id) {
      relationships.workflow_status = {
        data: { type: 'workflow_statuses', id: data.workflow_status_id },
      };
    }

    return this.request<ProductiveApiResponse<ProductiveTask>>('/tasks', {
      method: 'POST',
      body: {
        data: {
          type: 'tasks',
          attributes: {
            title: data.title,
            description: data.description,
            due_date: data.due_date,
            start_date: data.start_date,
            initial_estimate: data.initial_estimate,
            private: data.private,
          },
          relationships,
        },
      },
    });
  }

  async updateTask(
    id: string,
    data: {
      title?: string;
      description?: string;
      due_date?: string;
      start_date?: string;
      initial_estimate?: number;
      private?: boolean;
      assignee_id?: string;
      workflow_status_id?: string;
    },
  ): Promise<ProductiveApiResponse<ProductiveTask>> {
    const relationships: Record<string, { data: { type: string; id: string } | null }> = {};

    if (data.assignee_id !== undefined) {
      relationships.assignee = data.assignee_id
        ? { data: { type: 'people', id: data.assignee_id } }
        : { data: null };
    }

    if (data.workflow_status_id !== undefined) {
      relationships.workflow_status = data.workflow_status_id
        ? { data: { type: 'workflow_statuses', id: data.workflow_status_id } }
        : { data: null };
    }

    const attributes: Record<string, unknown> = {};
    if (data.title !== undefined) attributes.title = data.title;
    if (data.description !== undefined) attributes.description = data.description;
    if (data.due_date !== undefined) attributes.due_date = data.due_date;
    if (data.start_date !== undefined) attributes.start_date = data.start_date;
    if (data.initial_estimate !== undefined) attributes.initial_estimate = data.initial_estimate;
    if (data.private !== undefined) attributes.private = data.private;

    const body: Record<string, unknown> = {
      data: {
        type: 'tasks',
        id,
        attributes,
      },
    };

    if (Object.keys(relationships).length > 0) {
      (body.data as Record<string, unknown>).relationships = relationships;
    }

    return this.request<ProductiveApiResponse<ProductiveTask>>(`/tasks/${id}`, {
      method: 'PATCH',
      body,
    });
  }

  // People
  async getPeople(params?: {
    page?: number;
    perPage?: number;
    filter?: Record<string, string>;
    sort?: string;
  }): Promise<ProductiveApiResponse<ProductivePerson[]>> {
    const query: Record<string, string> = {};

    if (params?.page) query['page[number]'] = String(params.page);
    if (params?.perPage) query['page[size]'] = String(params.perPage);
    if (params?.sort) query['sort'] = params.sort;
    if (params?.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        query[`filter[${key}]`] = value;
      });
    }

    return this.request<ProductiveApiResponse<ProductivePerson[]>>('/people', {
      query,
    });
  }

  async getPerson(id: string): Promise<ProductiveApiResponse<ProductivePerson>> {
    return this.request<ProductiveApiResponse<ProductivePerson>>(`/people/${id}`);
  }

  // Services
  async getServices(params?: {
    page?: number;
    perPage?: number;
    filter?: Record<string, string>;
  }): Promise<ProductiveApiResponse<ProductiveService[]>> {
    const query: Record<string, string> = {};

    if (params?.page) query['page[number]'] = String(params.page);
    if (params?.perPage) query['page[size]'] = String(params.perPage);
    if (params?.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        query[`filter[${key}]`] = value;
      });
    }

    return this.request<ProductiveApiResponse<ProductiveService[]>>('/services', { query });
  }

  // Budgets
  async getBudgets(params?: {
    page?: number;
    perPage?: number;
    filter?: Record<string, string>;
  }): Promise<ProductiveApiResponse<ProductiveBudget[]>> {
    const query: Record<string, string> = {};

    if (params?.page) query['page[number]'] = String(params.page);
    if (params?.perPage) query['page[size]'] = String(params.perPage);
    if (params?.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        query[`filter[${key}]`] = value;
      });
    }

    return this.request<ProductiveApiResponse<ProductiveBudget[]>>('/budgets', {
      query,
    });
  }

  async getBudget(id: string): Promise<ProductiveApiResponse<ProductiveBudget>> {
    return this.request<ProductiveApiResponse<ProductiveBudget>>(`/budgets/${id}`);
  }

  // Companies
  async getCompanies(params?: {
    page?: number;
    perPage?: number;
    filter?: Record<string, string>;
    sort?: string;
  }): Promise<ProductiveApiResponse<ProductiveCompany[]>> {
    const query: Record<string, string> = {};

    if (params?.page) query['page[number]'] = String(params.page);
    if (params?.perPage) query['page[size]'] = String(params.perPage);
    if (params?.sort) query['sort'] = params.sort;
    if (params?.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        query[`filter[${key}]`] = value;
      });
    }

    return this.request<ProductiveApiResponse<ProductiveCompany[]>>('/companies', { query });
  }

  async getCompany(id: string): Promise<ProductiveApiResponse<ProductiveCompany>> {
    return this.request<ProductiveApiResponse<ProductiveCompany>>(`/companies/${id}`);
  }

  async createCompany(data: {
    name: string;
    billing_name?: string;
    vat?: string;
    default_currency?: string;
    company_code?: string;
    domain?: string;
    due_days?: number;
  }): Promise<ProductiveApiResponse<ProductiveCompany>> {
    return this.request<ProductiveApiResponse<ProductiveCompany>>('/companies', {
      method: 'POST',
      body: {
        data: {
          type: 'companies',
          attributes: {
            name: data.name,
            billing_name: data.billing_name,
            vat: data.vat,
            default_currency: data.default_currency,
            company_code: data.company_code,
            domain: data.domain,
            due_days: data.due_days,
          },
        },
      },
    });
  }

  async updateCompany(
    id: string,
    data: {
      name?: string;
      billing_name?: string;
      vat?: string;
      default_currency?: string;
      company_code?: string;
      domain?: string;
      due_days?: number;
    },
  ): Promise<ProductiveApiResponse<ProductiveCompany>> {
    const attributes: Record<string, unknown> = {};
    if (data.name !== undefined) attributes.name = data.name;
    if (data.billing_name !== undefined) attributes.billing_name = data.billing_name;
    if (data.vat !== undefined) attributes.vat = data.vat;
    if (data.default_currency !== undefined) attributes.default_currency = data.default_currency;
    if (data.company_code !== undefined) attributes.company_code = data.company_code;
    if (data.domain !== undefined) attributes.domain = data.domain;
    if (data.due_days !== undefined) attributes.due_days = data.due_days;

    return this.request<ProductiveApiResponse<ProductiveCompany>>(`/companies/${id}`, {
      method: 'PATCH',
      body: {
        data: {
          type: 'companies',
          id,
          attributes,
        },
      },
    });
  }

  // Comments
  async getComments(params?: {
    page?: number;
    perPage?: number;
    filter?: Record<string, string>;
    include?: string[];
  }): Promise<ProductiveApiResponse<ProductiveComment[]>> {
    const query: Record<string, string> = {};

    if (params?.page) query['page[number]'] = String(params.page);
    if (params?.perPage) query['page[size]'] = String(params.perPage);
    if (params?.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        query[`filter[${key}]`] = value;
      });
    }
    if (params?.include?.length) {
      query['include'] = params.include.join(',');
    }

    return this.request<ProductiveApiResponse<ProductiveComment[]>>('/comments', { query });
  }

  async getComment(
    id: string,
    params?: { include?: string[] },
  ): Promise<ProductiveApiResponse<ProductiveComment>> {
    const query: Record<string, string> = {};
    if (params?.include?.length) {
      query['include'] = params.include.join(',');
    }
    return this.request<ProductiveApiResponse<ProductiveComment>>(`/comments/${id}`, { query });
  }

  async createComment(data: {
    body: string;
    task_id?: string;
    deal_id?: string;
    company_id?: string;
    invoice_id?: string;
    person_id?: string;
    discussion_id?: string;
  }): Promise<ProductiveApiResponse<ProductiveComment>> {
    const relationships: Record<string, { data: { type: string; id: string } }> = {};

    if (data.task_id) {
      relationships.task = { data: { type: 'tasks', id: data.task_id } };
    }
    if (data.deal_id) {
      relationships.deal = { data: { type: 'deals', id: data.deal_id } };
    }
    if (data.company_id) {
      relationships.company = { data: { type: 'companies', id: data.company_id } };
    }
    if (data.invoice_id) {
      relationships.invoice = { data: { type: 'invoices', id: data.invoice_id } };
    }
    if (data.person_id) {
      relationships.person = { data: { type: 'people', id: data.person_id } };
    }
    if (data.discussion_id) {
      relationships.discussion = { data: { type: 'discussions', id: data.discussion_id } };
    }

    return this.request<ProductiveApiResponse<ProductiveComment>>('/comments', {
      method: 'POST',
      body: {
        data: {
          type: 'comments',
          attributes: {
            body: data.body,
          },
          relationships,
        },
      },
    });
  }

  async updateComment(
    id: string,
    data: {
      body?: string;
    },
  ): Promise<ProductiveApiResponse<ProductiveComment>> {
    return this.request<ProductiveApiResponse<ProductiveComment>>(`/comments/${id}`, {
      method: 'PATCH',
      body: {
        data: {
          type: 'comments',
          id,
          attributes: data,
        },
      },
    });
  }

  // Timers
  async getTimers(params?: {
    page?: number;
    perPage?: number;
    filter?: Record<string, string>;
    sort?: string;
    include?: string[];
  }): Promise<ProductiveApiResponse<ProductiveTimer[]>> {
    const query: Record<string, string> = {};

    if (params?.page) query['page[number]'] = String(params.page);
    if (params?.perPage) query['page[size]'] = String(params.perPage);
    if (params?.sort) query['sort'] = params.sort;
    if (params?.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        query[`filter[${key}]`] = value;
      });
    }
    if (params?.include?.length) {
      query['include'] = params.include.join(',');
    }

    return this.request<ProductiveApiResponse<ProductiveTimer[]>>('/timers', { query });
  }

  async getTimer(
    id: string,
    params?: { include?: string[] },
  ): Promise<ProductiveApiResponse<ProductiveTimer>> {
    const query: Record<string, string> = {};
    if (params?.include?.length) {
      query['include'] = params.include.join(',');
    }
    return this.request<ProductiveApiResponse<ProductiveTimer>>(`/timers/${id}`, { query });
  }

  async startTimer(data: {
    service_id?: string;
    time_entry_id?: string;
  }): Promise<ProductiveApiResponse<ProductiveTimer>> {
    const relationships: Record<string, { data: { type: string; id: string } }> = {};

    if (data.service_id) {
      relationships.service = { data: { type: 'services', id: data.service_id } };
    }
    if (data.time_entry_id) {
      relationships.time_entry = { data: { type: 'time_entries', id: data.time_entry_id } };
    }

    return this.request<ProductiveApiResponse<ProductiveTimer>>('/timers', {
      method: 'POST',
      body: {
        data: {
          type: 'timers',
          relationships,
        },
      },
    });
  }

  async stopTimer(id: string): Promise<ProductiveApiResponse<ProductiveTimer>> {
    return this.request<ProductiveApiResponse<ProductiveTimer>>(`/timers/${id}/stop`, {
      method: 'PATCH',
    });
  }

  // Deals
  async getDeals(params?: {
    page?: number;
    perPage?: number;
    filter?: Record<string, string>;
    sort?: string;
    include?: string[];
  }): Promise<ProductiveApiResponse<ProductiveDeal[]>> {
    const query: Record<string, string> = {};

    if (params?.page) query['page[number]'] = String(params.page);
    if (params?.perPage) query['page[size]'] = String(params.perPage);
    if (params?.sort) query['sort'] = params.sort;
    if (params?.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        query[`filter[${key}]`] = value;
      });
    }
    if (params?.include?.length) {
      query['include'] = params.include.join(',');
    }

    return this.request<ProductiveApiResponse<ProductiveDeal[]>>('/deals', { query });
  }

  async getDeal(
    id: string,
    params?: { include?: string[] },
  ): Promise<ProductiveApiResponse<ProductiveDeal>> {
    const query: Record<string, string> = {};
    if (params?.include?.length) {
      query['include'] = params.include.join(',');
    }
    return this.request<ProductiveApiResponse<ProductiveDeal>>(`/deals/${id}`, { query });
  }

  async createDeal(data: {
    name: string;
    company_id: string;
    date?: string;
    budget?: boolean;
    responsible_id?: string;
  }): Promise<ProductiveApiResponse<ProductiveDeal>> {
    const relationships: Record<string, { data: { type: string; id: string } }> = {
      company: { data: { type: 'companies', id: data.company_id } },
    };

    if (data.responsible_id) {
      relationships.responsible = { data: { type: 'people', id: data.responsible_id } };
    }

    return this.request<ProductiveApiResponse<ProductiveDeal>>('/deals', {
      method: 'POST',
      body: {
        data: {
          type: 'deals',
          attributes: {
            name: data.name,
            date: data.date || new Date().toISOString().split('T')[0],
            budget: data.budget || false,
          },
          relationships,
        },
      },
    });
  }

  async updateDeal(
    id: string,
    data: {
      name?: string;
      date?: string;
      end_date?: string;
      responsible_id?: string;
      deal_status_id?: string;
    },
  ): Promise<ProductiveApiResponse<ProductiveDeal>> {
    const attributes: Record<string, unknown> = {};
    if (data.name !== undefined) attributes.name = data.name;
    if (data.date !== undefined) attributes.date = data.date;
    if (data.end_date !== undefined) attributes.end_date = data.end_date;

    const relationships: Record<string, { data: { type: string; id: string } | null }> = {};
    if (data.responsible_id !== undefined) {
      relationships.responsible = data.responsible_id
        ? { data: { type: 'people', id: data.responsible_id } }
        : { data: null };
    }
    if (data.deal_status_id !== undefined) {
      relationships.deal_status = data.deal_status_id
        ? { data: { type: 'deal_statuses', id: data.deal_status_id } }
        : { data: null };
    }

    const body: Record<string, unknown> = {
      data: {
        type: 'deals',
        id,
        attributes,
      },
    };

    if (Object.keys(relationships).length > 0) {
      (body.data as Record<string, unknown>).relationships = relationships;
    }

    return this.request<ProductiveApiResponse<ProductiveDeal>>(`/deals/${id}`, {
      method: 'PATCH',
      body,
    });
  }

  // Bookings
  async getBookings(params?: {
    page?: number;
    perPage?: number;
    filter?: Record<string, string>;
    sort?: string;
    include?: string[];
  }): Promise<ProductiveApiResponse<ProductiveBooking[]>> {
    const query: Record<string, string> = {};

    if (params?.page) query['page[number]'] = String(params.page);
    if (params?.perPage) query['page[size]'] = String(params.perPage);
    if (params?.sort) query['sort'] = params.sort;
    if (params?.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        query[`filter[${key}]`] = value;
      });
    }
    if (params?.include?.length) {
      query['include'] = params.include.join(',');
    }

    return this.request<ProductiveApiResponse<ProductiveBooking[]>>('/bookings', { query });
  }

  async getBooking(
    id: string,
    params?: { include?: string[] },
  ): Promise<ProductiveApiResponse<ProductiveBooking>> {
    const query: Record<string, string> = {};
    if (params?.include?.length) {
      query['include'] = params.include.join(',');
    }
    return this.request<ProductiveApiResponse<ProductiveBooking>>(`/bookings/${id}`, { query });
  }

  async createBooking(data: {
    person_id: string;
    service_id?: string;
    event_id?: string;
    started_on: string;
    ended_on: string;
    time?: number;
    total_time?: number;
    percentage?: number;
    booking_method_id?: number;
    draft?: boolean;
    note?: string;
  }): Promise<ProductiveApiResponse<ProductiveBooking>> {
    const relationships: Record<string, { data: { type: string; id: string } }> = {
      person: { data: { type: 'people', id: data.person_id } },
    };

    if (data.service_id) {
      relationships.service = { data: { type: 'services', id: data.service_id } };
    }
    if (data.event_id) {
      relationships.event = { data: { type: 'events', id: data.event_id } };
    }

    return this.request<ProductiveApiResponse<ProductiveBooking>>('/bookings', {
      method: 'POST',
      body: {
        data: {
          type: 'bookings',
          attributes: {
            started_on: data.started_on,
            ended_on: data.ended_on,
            time: data.time,
            total_time: data.total_time,
            percentage: data.percentage,
            booking_method_id: data.booking_method_id || 1, // Default to "per day"
            draft: data.draft,
            note: data.note,
          },
          relationships,
        },
      },
    });
  }

  async updateBooking(
    id: string,
    data: {
      started_on?: string;
      ended_on?: string;
      time?: number;
      total_time?: number;
      percentage?: number;
      draft?: boolean;
      note?: string;
    },
  ): Promise<ProductiveApiResponse<ProductiveBooking>> {
    const attributes: Record<string, unknown> = {};
    if (data.started_on !== undefined) attributes.started_on = data.started_on;
    if (data.ended_on !== undefined) attributes.ended_on = data.ended_on;
    if (data.time !== undefined) attributes.time = data.time;
    if (data.total_time !== undefined) attributes.total_time = data.total_time;
    if (data.percentage !== undefined) attributes.percentage = data.percentage;
    if (data.draft !== undefined) attributes.draft = data.draft;
    if (data.note !== undefined) attributes.note = data.note;

    return this.request<ProductiveApiResponse<ProductiveBooking>>(`/bookings/${id}`, {
      method: 'PATCH',
      body: {
        data: {
          type: 'bookings',
          id,
          attributes,
        },
      },
    });
  }

  // Attachments
  async getAttachments(params?: {
    page?: number;
    perPage?: number;
    filter?: Record<string, string>;
  }): Promise<ProductiveApiResponse<ProductiveAttachment[]>> {
    const query: Record<string, string> = {};

    if (params?.page) query['page[number]'] = String(params.page);
    if (params?.perPage) query['page[size]'] = String(params.perPage);
    if (params?.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        query[`filter[${key}]`] = value;
      });
    }

    return this.request<ProductiveApiResponse<ProductiveAttachment[]>>('/attachments', { query });
  }

  async getAttachment(id: string): Promise<ProductiveApiResponse<ProductiveAttachment>> {
    return this.request<ProductiveApiResponse<ProductiveAttachment>>(`/attachments/${id}`);
  }

  async deleteAttachment(id: string): Promise<void> {
    await this.request<void>(`/attachments/${id}`, {
      method: 'DELETE',
    });
  }

  // Reports
  async getReports(
    reportType: string,
    params?: {
      page?: number;
      perPage?: number;
      filter?: Record<string, string>;
      group?: string;
      include?: string[];
    },
  ): Promise<ProductiveApiResponse<ProductiveReport[]>> {
    const query: Record<string, string> = {};

    if (params?.page) query['page[number]'] = String(params.page);
    if (params?.perPage) query['page[size]'] = String(params.perPage);
    if (params?.group) query['group'] = params.group;
    if (params?.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        query[`filter[${key}]`] = value;
      });
    }
    if (params?.include?.length) {
      query['include'] = params.include.join(',');
    }

    return this.request<ProductiveApiResponse<ProductiveReport[]>>(`/reports/${reportType}`, {
      query,
    });
  }
}
