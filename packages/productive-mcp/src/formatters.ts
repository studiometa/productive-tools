/**
 * Response formatters for agent-friendly output
 * Strips verbose JSON:API metadata and returns clean, compact data
 */

interface JsonApiResource {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
  relationships?: Record<string, unknown>;
}

interface JsonApiResponse {
  data: JsonApiResource | JsonApiResource[];
  meta?: Record<string, unknown>;
  links?: Record<string, unknown>;
}

interface PaginationMeta {
  page: number;
  total_pages: number;
  total_count: number;
}

/**
 * Extract clean pagination info from verbose meta
 */
function formatPagination(meta?: unknown): PaginationMeta | undefined {
  if (!meta || typeof meta !== 'object') return undefined;
  const m = meta as Record<string, unknown>;
  return {
    page: (m.current_page as number) || 1,
    total_pages: (m.total_pages as number) || 1,
    total_count: (m.total_count as number) || 0,
  };
}

/**
 * Format a single resource - flatten id + attributes
 */
function formatResource(resource: JsonApiResource): Record<string, unknown> {
  return {
    id: resource.id,
    ...resource.attributes,
  };
}

/**
 * Format time entry for agent consumption
 */
export function formatTimeEntry(entry: JsonApiResource): Record<string, unknown> {
  const attrs = entry.attributes;
  return {
    id: entry.id,
    date: attrs.date,
    time_minutes: attrs.time,
    time_hours: ((attrs.time as number) / 60).toFixed(2),
    note: attrs.note ? stripHtml(attrs.note as string) : null,
    billable_time: attrs.billable_time,
    approved: attrs.approved,
  };
}

/**
 * Format task for agent consumption
 */
export function formatTask(task: JsonApiResource, included?: JsonApiResource[]): Record<string, unknown> {
  const attrs = task.attributes;
  const result: Record<string, unknown> = {
    id: task.id,
    title: attrs.title,
    number: attrs.task_number,
    closed: attrs.closed,
    due_date: attrs.due_date,
    initial_estimate: attrs.initial_estimate,
    worked_time: attrs.worked_time,
    remaining_time: attrs.remaining_time,
  };

  // Add project and company context if available
  if (included && task.relationships) {
    const projectRel = task.relationships.project as { data?: { id: string; type: string } } | undefined;
    if (projectRel?.data) {
      const project = included.find(
        (r) => r.type === 'projects' && r.id === projectRel.data!.id
      );
      if (project) {
        result.project = {
          id: project.id,
          name: project.attributes.name,
          number: project.attributes.project_number,
        };

        // Try to get company from project relationship
        const companyRel = project.relationships?.company as { data?: { id: string; type: string } } | undefined;
        if (companyRel?.data) {
          const company = included.find(
            (r) => r.type === 'companies' && r.id === companyRel.data!.id
          );
          if (company) {
            result.company = {
              id: company.id,
              name: company.attributes.name,
            };
          }
        }
      }
    }
  }

  return result;
}

/**
 * Format project for agent consumption
 */
export function formatProject(project: JsonApiResource): Record<string, unknown> {
  const attrs = project.attributes;
  return {
    id: project.id,
    name: attrs.name,
    number: attrs.project_number,
    archived: attrs.archived,
  };
}

/**
 * Format person for agent consumption
 */
export function formatPerson(person: JsonApiResource): Record<string, unknown> {
  const attrs = person.attributes;
  return {
    id: person.id,
    name: `${attrs.first_name} ${attrs.last_name}`,
    email: attrs.email,
    title: attrs.title,
  };
}

/**
 * Format service for agent consumption
 */
export function formatService(service: JsonApiResource): Record<string, unknown> {
  const attrs = service.attributes;
  return {
    id: service.id,
    name: attrs.name,
    budgeted_time: attrs.budgeted_time,
    worked_time: attrs.worked_time,
  };
}

/**
 * Strip HTML tags from note content
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format list response with pagination
 */
export function formatListResponse<T>(
  data: JsonApiResource[],
  formatter: (item: JsonApiResource, included?: JsonApiResource[]) => T,
  meta?: unknown,
  included?: JsonApiResource[]
): { data: T[]; meta?: PaginationMeta } {
  const result: { data: T[]; meta?: PaginationMeta } = {
    data: data.map((item) => formatter(item, included)),
  };

  const pagination = formatPagination(meta);
  if (pagination && pagination.total_pages > 1) {
    result.meta = pagination;
  }

  return result;
}

/**
 * Format single resource response
 */
export function formatSingleResponse<T>(
  data: JsonApiResource,
  formatter: (item: JsonApiResource) => T
): T {
  return formatter(data);
}

/**
 * Generic formatter that auto-detects resource type
 */
export function formatResponse(response: JsonApiResponse): unknown {
  if (Array.isArray(response.data)) {
    const type = response.data[0]?.type;
    const formatter = getFormatterForType(type);
    return formatListResponse(response.data, formatter, response.meta);
  } else {
    const formatter = getFormatterForType(response.data.type);
    return formatSingleResponse(response.data, formatter);
  }
}

/**
 * Get appropriate formatter based on resource type
 */
function getFormatterForType(type?: string): (item: JsonApiResource) => Record<string, unknown> {
  switch (type) {
    case 'time_entries':
      return formatTimeEntry;
    case 'tasks':
      return formatTask;
    case 'projects':
      return formatProject;
    case 'people':
      return formatPerson;
    case 'services':
      return formatService;
    default:
      return formatResource;
  }
}
