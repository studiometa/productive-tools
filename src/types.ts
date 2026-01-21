export interface ProductiveConfig extends Record<string, string | undefined> {
  apiToken?: string;
  organizationId?: string;
  userId?: string;
  baseUrl?: string;
}

export interface ProductiveApiMeta {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
  current_page?: number;
  total_count?: number;
  page_size?: number;
  max_page_size?: number;
}

export interface ProductiveApiResponse<T> {
  data: T;
  meta?: ProductiveApiMeta;
  included?: Array<{
    id: string;
    type: string;
    attributes: Record<string, unknown>;
  }>;
}

export interface ProductiveProject {
  id: string;
  type: "projects";
  attributes: {
    name: string;
    project_number?: string;
    archived: boolean;
    budget?: number;
    created_at: string;
    updated_at: string;
  };
  relationships?: Record<string, unknown>;
}

export interface ProductiveTimeEntry {
  id: string;
  type: "time_entries";
  attributes: {
    date: string;
    time: number;
    note?: string;
    created_at: string;
    updated_at: string;
  };
  relationships?: {
    person?: {
      data: { type: string; id: string };
    };
    service?: {
      data: { type: string; id: string };
    };
    project?: {
      data: { type: string; id: string };
    };
  };
}

export interface ProductiveTask {
  id: string;
  type: "tasks";
  attributes: {
    title: string;
    description?: string;
    number?: number;
    task_number?: number;
    private?: boolean;
    due_date?: string;
    due_time?: string;
    start_date?: string;
    closed_at?: string;
    created_at: string;
    updated_at: string;
    initial_estimate?: number;
    remaining_time?: number;
    billable_time?: number;
    worked_time?: number;
    type_id?: number;
    closed?: boolean;
    tag_list?: string[];
    todo_count?: number;
    open_todo_count?: number;
    subtask_count?: number;
    open_subtask_count?: number;
    // Legacy field for backwards compatibility
    completed?: boolean;
  };
  relationships?: {
    project?: {
      data: { type: string; id: string } | null;
    };
    assignee?: {
      data: { type: string; id: string } | null;
    };
    workflow_status?: {
      data: { type: string; id: string } | null;
    };
    task_list?: {
      data: { type: string; id: string } | null;
    };
    service?: {
      data: { type: string; id: string } | null;
    };
    creator?: {
      data: { type: string; id: string } | null;
    };
    parent_task?: {
      data: { type: string; id: string } | null;
    };
  };
}

export interface ProductivePerson {
  id: string;
  type: "people";
  attributes: {
    first_name: string;
    last_name: string;
    email: string;
    active: boolean;
    created_at: string;
    updated_at: string;
  };
  relationships?: Record<string, unknown>;
}

export interface ProductiveService {
  id: string;
  type: "services";
  attributes: {
    name: string;
    created_at: string;
    updated_at: string;
  };
  relationships?: Record<string, unknown>;
}

export interface ProductiveBudget {
  id: string;
  type: "budgets";
  attributes: {
    total_time_budget?: number;
    remaining_time_budget?: number;
    total_monetary_budget?: number;
    remaining_monetary_budget?: number;
  };
  relationships?: Record<string, unknown>;
}

// CLI output formats for AI agents
export type OutputFormat = "json" | "human" | "csv" | "table" | "kanban";

export interface CliOptions {
  format?: OutputFormat;
  quiet?: boolean;
  verbose?: boolean;
  noColor?: boolean;
}
