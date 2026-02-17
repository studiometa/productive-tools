import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { GetReportOptions, ReportType } from './types.js';

import { DEFAULT_GROUPS, DEFAULT_INCLUDES } from './types.js';

/**
 * Build report-specific filters from typed options.
 *
 * Different report types use different date parameter names
 * and entity filter mappings.
 */
export function buildReportFilters(options: GetReportOptions): Record<string, string> {
  const filter: Record<string, string> = {};

  if (options.additionalFilters) Object.assign(filter, options.additionalFilters);

  // Date filters — naming varies by report type
  if (options.from) {
    if (options.reportType === 'invoice_reports') {
      filter.invoice_date_after = options.from;
    } else if (options.reportType === 'payment_reports' || options.reportType === 'deal_reports') {
      filter.date_after = options.from;
    } else {
      filter.after = options.from;
    }
  }

  if (options.to) {
    if (options.reportType === 'invoice_reports') {
      filter.invoice_date_before = options.to;
    } else if (options.reportType === 'payment_reports' || options.reportType === 'deal_reports') {
      filter.date_before = options.to;
    } else {
      filter.before = options.to;
    }
  }

  // Person filter — mapped to assignee_id for task reports
  if (options.personId) {
    if (options.reportType === 'task_reports') {
      filter.assignee_id = options.personId;
    } else {
      filter.person_id = options.personId;
    }
  }

  if (options.projectId) filter.project_id = options.projectId;
  if (options.companyId) filter.company_id = options.companyId;

  // Deal/status filters — deal_reports uses deal_status_id
  if (options.dealId) {
    if (options.reportType === 'deal_reports') {
      filter.deal_status_id = options.dealId;
    } else {
      filter.deal_id = options.dealId;
    }
  }
  if (options.status) {
    if (options.reportType === 'deal_reports') {
      filter.deal_status_id = options.status;
    } else {
      filter.status = options.status;
    }
  }

  return filter;
}

/**
 * Resolve the effective group for a report.
 */
export function resolveGroup(reportType: ReportType, group?: string): string | undefined {
  return group ?? DEFAULT_GROUPS[reportType];
}

/**
 * Resolve the effective includes for a report.
 */
export function resolveIncludes(reportType: ReportType, include?: string[]): string[] | undefined {
  return include ?? DEFAULT_INCLUDES[reportType];
}

export async function getReport(
  options: GetReportOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<unknown[]>> {
  const filter = buildReportFilters(options);
  const effectiveGroup = resolveGroup(options.reportType, options.group);
  const effectiveInclude = resolveIncludes(options.reportType, options.include);

  const response = await ctx.api.getReports(options.reportType, {
    page: options.page ?? 1,
    perPage: options.perPage ?? 100,
    filter,
    group: effectiveGroup,
    include: effectiveInclude,
  });

  return {
    data: response.data,
    meta: response.meta,
    included: response.included,
  };
}
