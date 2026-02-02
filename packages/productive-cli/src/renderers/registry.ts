/**
 * Renderer registry
 *
 * Central registry for all renderers. Allows looking up the appropriate
 * renderer based on resource type and output format.
 */

import type { GenericRenderer, OutputFormat, ResourceType, RenderContext } from './types.js';

import { csvRenderer } from './csv.js';
import { humanBookingListRenderer } from './human/booking.js';
import { humanBudgetListRenderer } from './human/budget.js';
import { humanCommentListRenderer } from './human/comment.js';
import { humanCompanyListRenderer } from './human/company.js';
import { humanDealListRenderer } from './human/deal.js';
import { kanbanRenderer } from './human/kanban.js';
import { humanPersonListRenderer } from './human/person.js';
import { humanProjectListRenderer } from './human/project.js';
import { humanServiceListRenderer } from './human/service.js';
import { humanTaskListRenderer } from './human/task.js';
import { humanTimeEntryListRenderer } from './human/time-entry.js';
import { humanTimerListRenderer } from './human/timer.js';
import { jsonRenderer } from './json.js';
import { tableRenderer } from './table.js';

/**
 * Registry key format: "resourceType:format" or "*:format" for fallbacks
 */
type RegistryKey = `${ResourceType | '*'}:${OutputFormat}`;

/**
 * Internal registry storage
 */
const registry = new Map<RegistryKey, GenericRenderer>();

/**
 * Register a renderer for a specific resource type and format
 *
 * @param resourceType - The resource type (e.g., 'time_entry', 'task') or '*' for fallback
 * @param format - The output format (e.g., 'json', 'human')
 * @param renderer - The renderer instance
 */
export function registerRenderer(
  resourceType: ResourceType | '*',
  format: OutputFormat,
  renderer: GenericRenderer,
): void {
  const key: RegistryKey = `${resourceType}:${format}`;
  registry.set(key, renderer);
}

/**
 * Get a renderer for a specific resource type and format
 *
 * Falls back to wildcard renderer if no specific renderer is found.
 *
 * @param resourceType - The resource type
 * @param format - The output format
 * @returns The renderer or undefined if none found
 */
export function getRenderer(
  resourceType: ResourceType,
  format: OutputFormat,
): GenericRenderer | undefined {
  // Try specific renderer first
  const specificKey: RegistryKey = `${resourceType}:${format}`;
  const specific = registry.get(specificKey);
  if (specific) {
    return specific;
  }

  // Fall back to wildcard
  const wildcardKey: RegistryKey = `*:${format}`;
  return registry.get(wildcardKey);
}

/**
 * Render data using the appropriate renderer
 *
 * @param resourceType - The resource type
 * @param format - The output format
 * @param data - The data to render
 * @param ctx - The render context
 * @throws Error if no renderer is found
 */
export function render(
  resourceType: ResourceType,
  format: OutputFormat,
  data: unknown,
  ctx: RenderContext,
): void {
  const renderer = getRenderer(resourceType, format);
  if (!renderer) {
    throw new Error(`No renderer found for ${resourceType}:${format}`);
  }
  renderer.render(data, ctx);
}

/**
 * Check if a renderer exists for a resource type and format
 */
export function hasRenderer(resourceType: ResourceType, format: OutputFormat): boolean {
  return getRenderer(resourceType, format) !== undefined;
}

/**
 * Get all registered formats for a resource type
 */
export function getFormatsForResource(resourceType: ResourceType): OutputFormat[] {
  const formats: OutputFormat[] = [];
  const allFormats: OutputFormat[] = ['json', 'csv', 'table', 'human', 'kanban'];

  for (const format of allFormats) {
    if (hasRenderer(resourceType, format)) {
      formats.push(format);
    }
  }

  return formats;
}

// ============================================================================
// Register default renderers
// ============================================================================

// Generic renderers (fallbacks for all resource types)
registerRenderer('*', 'json', jsonRenderer);
registerRenderer('*', 'csv', csvRenderer);
registerRenderer('*', 'table', tableRenderer);

// Human renderers (resource-specific)
registerRenderer('time_entry', 'human', humanTimeEntryListRenderer);
registerRenderer('project', 'human', humanProjectListRenderer);
registerRenderer('task', 'human', humanTaskListRenderer);
registerRenderer('task', 'kanban', kanbanRenderer);
registerRenderer('person', 'human', humanPersonListRenderer);
registerRenderer('service', 'human', humanServiceListRenderer);
registerRenderer('budget', 'human', humanBudgetListRenderer);
registerRenderer('company', 'human', humanCompanyListRenderer);
registerRenderer('comment', 'human', humanCommentListRenderer);
registerRenderer('timer', 'human', humanTimerListRenderer);
registerRenderer('deal', 'human', humanDealListRenderer);
registerRenderer('booking', 'human', humanBookingListRenderer);
