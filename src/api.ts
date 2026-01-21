// Native fetch is available in Node.js 18+
import type {
  ProductiveApiResponse,
  ProductiveProject,
  ProductiveTimeEntry,
  ProductiveTask,
  ProductivePerson,
  ProductiveService,
  ProductiveBudget,
} from "./types.js";
import { getConfig } from "./config.js";
import { getCache, type CacheStore } from "./utils/cache.js";

export class ProductiveApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown,
  ) {
    super(message);
    this.name = "ProductiveApiError";
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      statusCode: this.statusCode,
      response: this.response,
    };
  }
}

export class ProductiveApi {
  private baseUrl: string;
  private apiToken: string;
  private organizationId: string;
  private cache: CacheStore;
  private useCache: boolean;
  private forceRefresh: boolean;

  constructor(options?: Record<string, string | boolean>) {
    const config = getConfig(options);

    if (!config.apiToken) {
      throw new ProductiveApiError(
        "API token not configured. Set via: --token <token>, productive config set apiToken <token>, or PRODUCTIVE_API_TOKEN env var",
      );
    }

    if (!config.organizationId) {
      throw new ProductiveApiError(
        "Organization ID not configured. Set via: --org-id <id>, productive config set organizationId <id>, or PRODUCTIVE_ORG_ID env var",
      );
    }

    this.baseUrl = config.baseUrl || "https://api.productive.io/api/v2";
    this.apiToken = config.apiToken;
    this.organizationId = config.organizationId;

    // Cache options
    this.useCache = options?.["no-cache"] !== true;
    this.forceRefresh = options?.refresh === true;
    this.cache = getCache(this.useCache);
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
    const { method = "GET", body, query } = options;

    // Check cache for GET requests
    if (method === "GET" && this.useCache && !this.forceRefresh) {
      const cached = await this.cache.getAsync<T>(
        endpoint,
        query || {},
        this.organizationId,
      );
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
      "Content-Type": "application/vnd.api+json",
      "X-Auth-Token": this.apiToken,
      "X-Organization-Id": this.organizationId,
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
    if (method === "GET" && this.useCache) {
      await this.cache.setAsync(
        endpoint,
        query || {},
        this.organizationId,
        data,
      );
    }

    // Invalidate cache on write operations
    if (method !== "GET") {
      await this.cache.invalidateAsync(endpoint.split("/")[1]); // e.g., '/time_entries/123' -> 'time_entries'
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

    if (params?.page) query["page[number]"] = String(params.page);
    if (params?.perPage) query["page[size]"] = String(params.perPage);
    if (params?.sort) query["sort"] = params.sort;
    if (params?.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        query[`filter[${key}]`] = value;
      });
    }

    return this.request<ProductiveApiResponse<ProductiveProject[]>>(
      "/projects",
      { query },
    );
  }

  async getProject(
    id: string,
  ): Promise<ProductiveApiResponse<ProductiveProject>> {
    return this.request<ProductiveApiResponse<ProductiveProject>>(
      `/projects/${id}`,
    );
  }

  // Time Entries
  async getTimeEntries(params?: {
    page?: number;
    perPage?: number;
    filter?: Record<string, string>;
    sort?: string;
  }): Promise<ProductiveApiResponse<ProductiveTimeEntry[]>> {
    const query: Record<string, string> = {};

    if (params?.page) query["page[number]"] = String(params.page);
    if (params?.perPage) query["page[size]"] = String(params.perPage);
    if (params?.sort) query["sort"] = params.sort;
    if (params?.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        query[`filter[${key}]`] = value;
      });
    }

    return this.request<ProductiveApiResponse<ProductiveTimeEntry[]>>(
      "/time_entries",
      { query },
    );
  }

  async getTimeEntry(
    id: string,
  ): Promise<ProductiveApiResponse<ProductiveTimeEntry>> {
    return this.request<ProductiveApiResponse<ProductiveTimeEntry>>(
      `/time_entries/${id}`,
    );
  }

  async createTimeEntry(data: {
    person_id: string;
    service_id: string;
    date: string;
    time: number;
    note?: string;
  }): Promise<ProductiveApiResponse<ProductiveTimeEntry>> {
    return this.request<ProductiveApiResponse<ProductiveTimeEntry>>(
      "/time_entries",
      {
        method: "POST",
        body: {
          data: {
            type: "time_entries",
            attributes: {
              date: data.date,
              time: data.time,
              note: data.note,
            },
            relationships: {
              person: {
                data: { type: "people", id: data.person_id },
              },
              service: {
                data: { type: "services", id: data.service_id },
              },
            },
          },
        },
      },
    );
  }

  async updateTimeEntry(
    id: string,
    data: {
      time?: number;
      note?: string;
      date?: string;
    },
  ): Promise<ProductiveApiResponse<ProductiveTimeEntry>> {
    return this.request<ProductiveApiResponse<ProductiveTimeEntry>>(
      `/time_entries/${id}`,
      {
        method: "PATCH",
        body: {
          data: {
            type: "time_entries",
            id,
            attributes: data,
          },
        },
      },
    );
  }

  async deleteTimeEntry(id: string): Promise<void> {
    await this.request<void>(`/time_entries/${id}`, {
      method: "DELETE",
    });
  }

  // Tasks
  async getTasks(params?: {
    page?: number;
    perPage?: number;
    filter?: Record<string, string>;
    sort?: string;
  }): Promise<ProductiveApiResponse<ProductiveTask[]>> {
    const query: Record<string, string> = {};

    if (params?.page) query["page[number]"] = String(params.page);
    if (params?.perPage) query["page[size]"] = String(params.perPage);
    if (params?.sort) query["sort"] = params.sort;
    if (params?.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        query[`filter[${key}]`] = value;
      });
    }

    return this.request<ProductiveApiResponse<ProductiveTask[]>>("/tasks", {
      query,
    });
  }

  async getTask(id: string): Promise<ProductiveApiResponse<ProductiveTask>> {
    return this.request<ProductiveApiResponse<ProductiveTask>>(`/tasks/${id}`);
  }

  // People
  async getPeople(params?: {
    page?: number;
    perPage?: number;
    filter?: Record<string, string>;
    sort?: string;
  }): Promise<ProductiveApiResponse<ProductivePerson[]>> {
    const query: Record<string, string> = {};

    if (params?.page) query["page[number]"] = String(params.page);
    if (params?.perPage) query["page[size]"] = String(params.perPage);
    if (params?.sort) query["sort"] = params.sort;
    if (params?.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        query[`filter[${key}]`] = value;
      });
    }

    return this.request<ProductiveApiResponse<ProductivePerson[]>>("/people", {
      query,
    });
  }

  async getPerson(
    id: string,
  ): Promise<ProductiveApiResponse<ProductivePerson>> {
    return this.request<ProductiveApiResponse<ProductivePerson>>(
      `/people/${id}`,
    );
  }

  // Services
  async getServices(params?: {
    page?: number;
    perPage?: number;
    filter?: Record<string, string>;
  }): Promise<ProductiveApiResponse<ProductiveService[]>> {
    const query: Record<string, string> = {};

    if (params?.page) query["page[number]"] = String(params.page);
    if (params?.perPage) query["page[size]"] = String(params.perPage);
    if (params?.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        query[`filter[${key}]`] = value;
      });
    }

    return this.request<ProductiveApiResponse<ProductiveService[]>>(
      "/services",
      { query },
    );
  }

  // Budgets
  async getBudgets(params?: {
    page?: number;
    perPage?: number;
    filter?: Record<string, string>;
  }): Promise<ProductiveApiResponse<ProductiveBudget[]>> {
    const query: Record<string, string> = {};

    if (params?.page) query["page[number]"] = String(params.page);
    if (params?.perPage) query["page[size]"] = String(params.perPage);
    if (params?.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        query[`filter[${key}]`] = value;
      });
    }

    return this.request<ProductiveApiResponse<ProductiveBudget[]>>("/budgets", {
      query,
    });
  }
}
