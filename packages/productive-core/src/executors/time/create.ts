/**
 * Create a time entry executor.
 */

import type { ProductiveTimeEntry } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { CreateTimeEntryOptions } from './types.js';

/**
 * Validation error for executor input.
 */
export class ExecutorValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
  ) {
    super(message);
    this.name = 'ExecutorValidationError';
  }
}

/**
 * Create a new time entry.
 *
 * 1. Validates required fields
 * 2. Resolves human-friendly identifiers (person email, service name)
 * 3. Calls API to create the entry
 */
export async function createTimeEntry(
  options: CreateTimeEntryOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveTimeEntry>> {
  // Resolve person ID (could be email, name, etc.)
  const resolvedPersonId = await ctx.resolver.resolveValue(options.personId, 'person');

  // Resolve service ID (could be service name)
  const resolvedServiceId = await ctx.resolver.resolveValue(options.serviceId, 'service', {
    projectId: options.projectId,
  });

  const date = options.date ?? new Date().toISOString().split('T')[0];

  const response = await ctx.api.createTimeEntry({
    person_id: resolvedPersonId,
    service_id: resolvedServiceId,
    time: options.time,
    date,
    note: options.note ?? '',
    task_id: options.taskId,
  });

  return {
    data: response.data,
  };
}
