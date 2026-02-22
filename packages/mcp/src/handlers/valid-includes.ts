/**
 * Valid include values per resource.
 *
 * Sourced from help.ts and schema.ts include lists.
 * Resources not listed here have no include validation (pass-through).
 */

export const VALID_INCLUDES: Record<string, string[]> = {
  tasks: [
    'project',
    'project.company',
    'assignee',
    'workflow_status',
    'comments',
    'attachments',
    'subtasks',
  ],
  comments: ['creator', 'task', 'deal'],
  deals: ['company', 'deal_status', 'responsible', 'project'],
  bookings: ['person', 'service', 'event'],
  time: ['person', 'service', 'task'],
};

export interface ValidateIncludesResult {
  valid: string[];
  invalid: string[];
  suggestions: Record<string, string>;
}

/**
 * Known misleading include values and their suggestions.
 * These are values that agents commonly try that don't exist.
 */
const KNOWN_SUGGESTIONS: Record<string, string> = {
  notes: 'Use resource=comments to fetch comments on a resource',
  services: 'Use resource=services with filter.deal_id or filter.project_id to list services',
  time_entries:
    'Use resource=time with a filter (e.g. filter.task_id, filter.project_id) to list time entries',
  time: 'Use resource=time with a filter (e.g. filter.task_id) to list time entries',
  user: 'Use "assignee" or "person" instead',
  author: 'Use "creator" instead',
  owner: 'Use "responsible" or "assignee" instead',
  company: 'Use "project.company" to include the project\'s company on tasks',
  status: 'Use "workflow_status" to include the workflow/kanban status on tasks',
};

/**
 * Validate include values for a given resource.
 *
 * Returns the valid and invalid values, plus suggestions for invalid values.
 * If the resource is not in VALID_INCLUDES, skips validation (returns all as valid).
 */
export function validateIncludes(
  resource: string,
  includes: string[],
): ValidateIncludesResult | null {
  const validSet = VALID_INCLUDES[resource];

  // Resource has no include validation — skip
  if (!validSet) {
    return null;
  }

  const valid: string[] = [];
  const invalid: string[] = [];
  const suggestions: Record<string, string> = {};

  for (const inc of includes) {
    if (validSet.includes(inc)) {
      valid.push(inc);
    } else {
      invalid.push(inc);
      if (KNOWN_SUGGESTIONS[inc]) {
        suggestions[inc] = KNOWN_SUGGESTIONS[inc];
      } else {
        suggestions[inc] = `Valid includes for ${resource}: ${validSet.join(', ')}`;
      }
    }
  }

  return { valid, invalid, suggestions };
}
