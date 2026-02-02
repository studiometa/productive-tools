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

/**
 * JSON:API relationship data structure
 * Can have either `data` (when loaded) or `meta` (when not included)
 */
export interface RelationshipData {
  data?: { type: string; id: string } | null;
  meta?: { included: boolean };
}

/**
 * JSON:API resource structure (used in included array)
 */
export interface IncludedResource {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
  relationships?: Record<string, RelationshipData>;
}

export interface ProductiveApiResponse<T> {
  data: T;
  meta?: ProductiveApiMeta;
  included?: IncludedResource[];
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
  relationships?: Record<string, RelationshipData>;
}

export interface ProductiveTimeEntry {
  id: string;
  type: "time_entries";
  attributes: {
    date: string;
    time: number;
    note?: string;
    billable_time?: number;
    approved?: boolean;
    created_at: string;
    updated_at: string;
  };
  relationships?: {
    person?: RelationshipData;
    service?: RelationshipData;
    project?: RelationshipData;
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
    project?: RelationshipData;
    assignee?: RelationshipData;
    workflow_status?: RelationshipData;
    task_list?: RelationshipData;
    service?: RelationshipData;
    creator?: RelationshipData;
    parent_task?: RelationshipData;
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
    title?: string;
    created_at: string;
    updated_at: string;
  };
  relationships?: Record<string, RelationshipData>;
}

export interface ProductiveService {
  id: string;
  type: "services";
  attributes: {
    name: string;
    budgeted_time?: number;
    worked_time?: number;
    created_at: string;
    updated_at: string;
  };
  relationships?: Record<string, RelationshipData>;
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
  relationships?: Record<string, RelationshipData>;
}

export interface ProductiveCompany {
  id: string;
  type: "companies";
  attributes: {
    name: string;
    billing_name?: string;
    vat?: string;
    default_currency?: string;
    company_code?: string;
    domain?: string;
    buyer_reference?: string;
    due_days?: number;
    tag_list?: string[];
    archived_at?: string;
    created_at: string;
    updated_at: string;
  };
  relationships?: Record<string, RelationshipData>;
}

export interface ProductiveBooking {
  id: string;
  type: "bookings";
  attributes: {
    started_on: string;
    ended_on: string;
    time?: number;
    total_time?: number;
    percentage?: number;
    booking_method_id: number;
    draft?: boolean;
    note?: string;
    approved_at?: string;
    rejected_at?: string;
    rejected_reason?: string;
    created_at: string;
    updated_at: string;
  };
  relationships?: {
    person?: RelationshipData;
    service?: RelationshipData;
    event?: RelationshipData;
    approver?: RelationshipData;
  };
}

export interface ProductiveDeal {
  id: string;
  type: "deals";
  attributes: {
    name: string;
    date?: string;
    end_date?: string;
    number?: string;
    deal_number?: string;
    budget: boolean;
    tag_list?: string[];
    profit_margin?: number;
    closed_at?: string;
    won_at?: string;
    lost_at?: string;
    created_at: string;
    updated_at: string;
  };
  relationships?: {
    company?: RelationshipData;
    deal_status?: RelationshipData;
    project?: RelationshipData;
    responsible?: RelationshipData;
  };
}

export interface ProductiveTimer {
  id: string;
  type: "timers";
  attributes: {
    person_id: number;
    started_at: string;
    stopped_at?: string;
    total_time: number;
  };
  relationships?: {
    time_entry?: RelationshipData;
  };
}

export interface ProductiveComment {
  id: string;
  type: "comments";
  attributes: {
    body: string;
    commentable_type: string;
    draft?: boolean;
    pinned_at?: string;
    created_at: string;
    updated_at: string;
  };
  relationships?: {
    creator?: RelationshipData;
    task?: RelationshipData;
    deal?: RelationshipData;
    company?: RelationshipData;
    invoice?: RelationshipData;
    person?: RelationshipData;
    discussion?: RelationshipData;
  };
}

export interface ProductiveReport {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
  relationships?: Record<string, RelationshipData>;
}

// CLI output formats for AI agents
export type OutputFormat = "json" | "human" | "csv" | "table" | "kanban";

export interface CliOptions {
  format?: OutputFormat;
  quiet?: boolean;
  verbose?: boolean;
  noColor?: boolean;
}
