/**
 * A reference to a related resource, resolved from JSON:API included data.
 * Returns `null` when the relationship exists but the resource wasn't found in includes.
 * Marked optional (`?`) on resource types because it depends on the `include` parameter.
 */
export interface ResourceRef {
  id: string;
  type: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Task
// ---------------------------------------------------------------------------

export interface Task {
  id: string;
  type: 'tasks';
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
  completed?: boolean;
  // Relationships (present when included)
  project?: ResourceRef | null;
  assignee?: ResourceRef | null;
  workflow_status?: ResourceRef | null;
  task_list?: ResourceRef | null;
  service?: ResourceRef | null;
  creator?: ResourceRef | null;
  parent_task?: ResourceRef | null;
}

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

export interface Project {
  id: string;
  type: 'projects';
  name: string;
  project_number?: string;
  archived: boolean;
  budget?: number;
  created_at: string;
  updated_at: string;
  // Generic relationships (Record-based in API types)
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// TimeEntry
// ---------------------------------------------------------------------------

export interface TimeEntry {
  id: string;
  type: 'time_entries';
  date: string;
  time: number;
  note?: string;
  billable_time?: number;
  approved?: boolean;
  created_at: string;
  updated_at: string;
  // Relationships (present when included)
  person?: ResourceRef | null;
  service?: ResourceRef | null;
  project?: ResourceRef | null;
}

// ---------------------------------------------------------------------------
// Person
// ---------------------------------------------------------------------------

export interface Person {
  id: string;
  type: 'people';
  first_name: string;
  last_name: string;
  email: string;
  active: boolean;
  title?: string;
  created_at: string;
  updated_at: string;
  // Generic relationships
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Company
// ---------------------------------------------------------------------------

export interface Company {
  id: string;
  type: 'companies';
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
  // Generic relationships
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Deal
// ---------------------------------------------------------------------------

export interface Deal {
  id: string;
  type: 'deals';
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
  // Relationships (present when included)
  company?: ResourceRef | null;
  deal_status?: ResourceRef | null;
  project?: ResourceRef | null;
  responsible?: ResourceRef | null;
}
