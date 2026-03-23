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
  type: 'projects';
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
  type: 'time_entries';
  attributes: {
    date: string;
    time: number;
    note?: string;
    billable_time?: number;
    approved?: boolean;
    overhead?: boolean;
    started_at?: string;
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
  type: 'tasks';
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
    custom_fields?: Record<string, unknown>;
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
  type: 'people';
  attributes: {
    first_name: string;
    last_name: string;
    email: string;
    active: boolean;
    title?: string;
    custom_fields?: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
  };
  relationships?: Record<string, RelationshipData>;
}

export interface ProductiveService {
  id: string;
  type: 'services';
  attributes: {
    name: string;
    budgeted_time?: number;
    worked_time?: number;
    billing_type_id?: number | null;
    created_at: string;
    updated_at: string;
  };
  relationships?: Record<string, RelationshipData>;
}

export interface ProductiveCompany {
  id: string;
  type: 'companies';
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
    custom_fields?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
  };
  relationships?: Record<string, RelationshipData>;
}

export interface ProductiveBooking {
  id: string;
  type: 'bookings';
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
  type: 'deals';
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
    custom_fields?: Record<string, unknown>;
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
  type: 'timers';
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
  type: 'comments';
  attributes: {
    body: string;
    commentable_type: string;
    hidden?: boolean;
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

export interface ProductiveAttachment {
  id: string;
  type: 'attachments';
  attributes: {
    name: string;
    content_type: string;
    size: number;
    url: string;
    thumb?: string;
    temp_url?: string;
    resized?: string;
    created_at: string;
    deleted_at?: string;
    attachment_type?: string;
    attachable_type?: string;
  };
  relationships?: Record<string, RelationshipData>;
}

export interface ProductivePage {
  id: string;
  type: 'pages';
  attributes: {
    title: string;
    body?: string;
    cover_image_url?: string;
    cover_image_meta?: Record<string, unknown>;
    icon_id?: string;
    position?: number;
    preferences?: Record<string, unknown>;
    version_number?: number;
    created_at: string;
    updated_at: string;
    edited_at?: string;
    last_activity_at?: string;
    public_access?: boolean;
    public_uuid?: string;
    public?: boolean;
    parent_page_id?: string;
    root_page_id?: string;
    custom_fields?: Record<string, unknown>;
  };
  relationships?: {
    project?: RelationshipData;
    creator?: RelationshipData;
    parent_page?: RelationshipData;
    root_page?: RelationshipData;
  };
}

export interface ProductiveDiscussion {
  id: string;
  type: 'discussions';
  attributes: {
    title?: string;
    body?: string;
    status: number; // 1=active, 2=resolved
    created_at: string;
    updated_at: string;
    resolved_at?: string;
  };
  relationships?: {
    page?: RelationshipData;
    creator?: RelationshipData;
  };
}

export interface ProductiveReport {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
  relationships?: Record<string, RelationshipData>;
}

/**
 * A single changeset entry: { [field_name]: [old_value, new_value] }
 */
export type ActivityChangesetEntry = Record<string, [unknown, unknown]>;

export interface ProductiveActivity {
  id: string;
  type: 'activities';
  attributes: {
    event: 'create' | 'update' | 'delete';
    changeset: ActivityChangesetEntry[];
    created_at: string;
  };
  relationships?: {
    organization?: RelationshipData;
    creator?: RelationshipData;
    comment?: RelationshipData;
    email?: RelationshipData;
    attachment?: RelationshipData;
    role?: RelationshipData;
  };
}

/**
 * Custom field data types in Productive.io.
 * 1=Text, 2=Number, 3=Select, 4=Date, 5=Multi-select, 6=Person, 7=Attachment
 */
export type CustomFieldDataType = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ProductiveCustomField {
  id: string;
  type: 'custom_fields';
  attributes: {
    name: string;
    data_type_id: CustomFieldDataType;
    customizable_type: string;
    archived: boolean;
    required: boolean;
    description?: string;
    default_value?: unknown;
    position?: number;
    created_at: string;
    updated_at: string;
  };
  relationships?: {
    options?: RelationshipData;
  };
}

export interface ProductiveCustomFieldOption {
  id: string;
  type: 'custom_field_options';
  attributes: {
    value: string;
    position?: number;
    archived: boolean;
    color?: string;
  };
  relationships?: {
    custom_field?: RelationshipData;
  };
}
