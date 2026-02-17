/**
 * Task formatting
 */

import type { JsonApiResource, FormatOptions, FormattedTask } from './types.js';

import { stripHtml } from '../utils/html.js';
import { DEFAULT_FORMAT_OPTIONS } from './types.js';

/**
 * Get an included resource by type and ID
 */
function getIncludedResource(
  included: JsonApiResource[] | undefined,
  type: string,
  id: string | undefined,
): JsonApiResource | undefined {
  if (!included || !id) return undefined;
  return included.find((r) => r.type === type && r.id === id);
}

/**
 * Format a task resource for output
 */
export function formatTask(task: JsonApiResource, options: FormatOptions = {}): FormattedTask {
  const opts = { ...DEFAULT_FORMAT_OPTIONS, ...options };
  const attrs = task.attributes;
  const rels = task.relationships;

  // Process description with HTML stripping if enabled
  const descriptionRaw = attrs.description as string | null | undefined;
  const description = opts.stripHtml ? stripHtml(descriptionRaw) || null : descriptionRaw || null;

  const result: FormattedTask = {
    id: task.id,
    title: (attrs.title as string) || 'Untitled',
    closed: (attrs.closed as boolean) || false,
    due_date: (attrs.due_date as string) || null,
    description,
  };

  // Include task number if present
  if (attrs.number !== undefined || attrs.task_number !== undefined) {
    result.number = (attrs.number ?? attrs.task_number) as number;
  }

  // Include time tracking fields if present
  if (attrs.initial_estimate !== undefined) {
    result.initial_estimate = attrs.initial_estimate as number;
  }
  if (attrs.worked_time !== undefined) {
    result.worked_time = attrs.worked_time as number;
  }
  if (attrs.remaining_time !== undefined) {
    result.remaining_time = attrs.remaining_time as number;
  }

  // Include relationship IDs if requested
  if (opts.includeRelationshipIds) {
    result.project_id = rels?.project?.data?.id;
    result.assignee_id = rels?.assignee?.data?.id;
    result.status_id = rels?.workflow_status?.data?.id;
  }

  // Resolve relationship names from included resources
  if (opts.included) {
    const projectId = rels?.project?.data?.id;
    const assigneeId = rels?.assignee?.data?.id;
    const statusId = rels?.workflow_status?.data?.id;

    // Resolve project
    const projectResource = getIncludedResource(opts.included, 'projects', projectId);
    if (projectResource) {
      result.project_name = projectResource.attributes.name as string;

      // Also provide nested project object for MCP compatibility
      result.project = {
        id: projectResource.id,
        name: projectResource.attributes.name as string,
        number: projectResource.attributes.project_number as string | undefined,
      };

      // Try to resolve company from project
      const companyId = (projectResource.relationships?.company?.data as { id?: string } | null)
        ?.id;
      const companyResource = getIncludedResource(opts.included, 'companies', companyId);
      if (companyResource) {
        result.company = {
          id: companyResource.id,
          name: companyResource.attributes.name as string,
        };
      }
    }

    // Resolve assignee
    const assigneeResource = getIncludedResource(opts.included, 'people', assigneeId);
    if (assigneeResource) {
      result.assignee_name = `${assigneeResource.attributes.first_name} ${assigneeResource.attributes.last_name}`;
    }

    // Resolve workflow status
    const statusResource = getIncludedResource(opts.included, 'workflow_statuses', statusId);
    if (statusResource) {
      result.status_name = statusResource.attributes.name as string;
    }
  }

  // Include timestamps if requested
  if (opts.includeTimestamps) {
    result.created_at = attrs.created_at as string | undefined;
    result.updated_at = attrs.updated_at as string | undefined;
  }

  return result;
}
