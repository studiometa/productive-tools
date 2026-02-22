/**
 * Log Day workflow executor.
 *
 * Accepts a structured list of time entry definitions and creates all entries
 * in parallel. Individual failures are isolated — partial results are returned.
 *
 * Example use: "Log 2h on project A and 1h on project B for today"
 */

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { LogDayOptions, LogDayResult, LogDayEntryResult } from './types.js';

import { ExecutorValidationError } from '../errors.js';

/**
 * Get today's date in YYYY-MM-DD format.
 */
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Log multiple time entries in a single workflow call.
 * Creates entries in parallel; partial failures are reported in the result.
 */
export async function logDay(
  options: LogDayOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<LogDayResult>> {
  if (!options.entries || options.entries.length === 0) {
    throw new ExecutorValidationError(
      'entries is required and must contain at least one item for log_day workflow',
      'entries',
    );
  }

  const defaultDate = options.date ?? getToday();
  const personId = options.personId ?? ctx.config.userId;

  if (!personId) {
    throw new ExecutorValidationError(
      'personId is required for log_day workflow (or set userId in ExecutorContext.config)',
      'personId',
    );
  }

  // Create all time entries in parallel, isolating failures
  const settledResults = await Promise.allSettled(
    options.entries.map(async (entry, _index) => {
      const entryDate = entry.date ?? defaultDate;

      // Resolve service ID (may be human-friendly name)
      const resolvedServiceId = await ctx.resolver.resolveValue(entry.service_id, 'service', {
        projectId: entry.project_id,
      });

      const response = await ctx.api.createTimeEntry({
        person_id: personId,
        service_id: resolvedServiceId,
        time: entry.duration_minutes,
        date: entryDate,
        note: entry.note ?? '',
      });

      return {
        entryDate,
        timeEntry: response.data,
      };
    }),
  );

  // Build results array from settled promises
  const entryResults: LogDayEntryResult[] = settledResults.map((settled, index) => {
    const entry = options.entries[index];
    const entryDate = entry.date ?? defaultDate;

    if (settled.status === 'fulfilled') {
      const { timeEntry } = settled.value;
      return {
        index,
        service_id: entry.service_id,
        project_id: entry.project_id,
        duration_minutes: entry.duration_minutes,
        note: entry.note,
        date: entryDate,
        success: true,
        time_entry: timeEntry,
      };
    } else {
      const message =
        settled.reason instanceof Error ? settled.reason.message : String(settled.reason);
      return {
        index,
        service_id: entry.service_id,
        project_id: entry.project_id,
        duration_minutes: entry.duration_minutes,
        note: entry.note,
        date: entryDate,
        success: false,
        error: message,
      };
    }
  });

  const succeeded = entryResults.filter((r) => r.success).length;
  const failed = entryResults.filter((r) => !r.success).length;
  const totalMinutes = entryResults
    .filter((r) => r.success)
    .reduce((sum, r) => sum + r.duration_minutes, 0);

  const result: LogDayResult = {
    workflow: 'log_day',
    date: defaultDate,
    person_id: personId,
    entries: entryResults,
    total_entries: options.entries.length,
    succeeded,
    failed,
    total_minutes_logged: totalMinutes,
  };

  return { data: result };
}
