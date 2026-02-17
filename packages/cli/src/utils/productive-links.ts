/**
 * Generate clickable links to Productive.io web interface
 */

import { getConfig } from '../config.js';
import { colors } from './colors.js';
import { link } from './html.js';

const PRODUCTIVE_BASE_URL = 'https://app.productive.io';

/**
 * Get the organization ID for URL building
 */
function getOrgId(): string | undefined {
  return getConfig().organizationId;
}

/**
 * Generate URL to a project in Productive.io
 */
export function projectUrl(projectId: string): string {
  const orgId = getOrgId();
  if (!orgId) return '';
  return `${PRODUCTIVE_BASE_URL}/${orgId}/projects/${projectId}`;
}

/**
 * Generate URL to a task in Productive.io
 */
export function taskUrl(taskId: string): string {
  const orgId = getOrgId();
  if (!orgId) return '';
  return `${PRODUCTIVE_BASE_URL}/${orgId}/tasks/${taskId}`;
}

/**
 * Generate URL to a service (budget item) in Productive.io
 */
export function serviceUrl(serviceId: string, dealId?: string): string {
  const orgId = getOrgId();
  if (!orgId) return '';
  if (dealId) {
    return `${PRODUCTIVE_BASE_URL}/${orgId}/deals/${dealId}/budget?service=${serviceId}`;
  }
  return `${PRODUCTIVE_BASE_URL}/${orgId}/services/${serviceId}`;
}

/**
 * Generate URL to time entries in Productive.io
 */
export function timeEntriesUrl(date?: string): string {
  const orgId = getOrgId();
  if (!orgId) return '';
  const base = `${PRODUCTIVE_BASE_URL}/${orgId}/time`;
  if (date) {
    return `${base}?date=${date}`;
  }
  return base;
}

/**
 * Generate URL to a person in Productive.io
 */
export function personUrl(personId: string): string {
  const orgId = getOrgId();
  if (!orgId) return '';
  return `${PRODUCTIVE_BASE_URL}/${orgId}/people/${personId}`;
}

/**
 * Format an ID as a clickable link
 * Shows as #ID and links to the appropriate Productive.io page
 */
export function linkedId(
  id: string,
  type: 'project' | 'task' | 'service' | 'person' | 'time',
): string {
  let url: string;

  switch (type) {
    case 'project':
      url = projectUrl(id);
      break;
    case 'task':
      url = taskUrl(id);
      break;
    case 'service':
      url = serviceUrl(id);
      break;
    case 'person':
      url = personUrl(id);
      break;
    case 'time':
      url = timeEntriesUrl();
      break;
    default:
      url = '';
  }

  const idText = colors.dim(`#${id}`);

  if (!url) return idText;
  return link(idText, url);
}

/**
 * Format text as a clickable link to a project
 */
export function linkedProject(text: string, projectId: string): string {
  const url = projectUrl(projectId);
  if (!url) return text;
  return link(text, url);
}

/**
 * Format text as a clickable link to a task
 */
export function linkedTask(text: string, taskId: string): string {
  const url = taskUrl(taskId);
  if (!url) return text;
  return link(text, url);
}

/**
 * Format text as a clickable link to a person
 */
export function linkedPerson(text: string, personId: string): string {
  const url = personUrl(personId);
  if (!url) return text;
  return link(text, url);
}

/**
 * Format text as a clickable link to a service
 */
export function linkedService(text: string, serviceId: string, dealId?: string): string {
  const url = serviceUrl(serviceId, dealId);
  if (!url) return text;
  return link(text, url);
}
