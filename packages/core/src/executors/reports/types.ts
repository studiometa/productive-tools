import type { ReportType } from '../../constants.js';
import type { PaginationOptions } from '../types.js';

export type { ReportType } from '../../constants.js';

export interface GetReportOptions extends PaginationOptions {
  reportType: ReportType;
  group?: string;
  /** Date range start */
  from?: string;
  /** Date range end */
  to?: string;
  /** Person filter (mapped to person_id or assignee_id depending on report type) */
  personId?: string;
  projectId?: string;
  companyId?: string;
  dealId?: string;
  status?: string;
  /** Raw filters passed through directly */
  additionalFilters?: Record<string, string>;
}

export { REPORT_TYPES as VALID_REPORT_TYPES } from '../../constants.js';

/** Default grouping per report type */
export const DEFAULT_GROUPS: Partial<Record<ReportType, string>> = {
  time_reports: 'person',
  project_reports: 'project',
  budget_reports: 'deal',
  person_reports: 'person',
  invoice_reports: 'invoice',
  payment_reports: 'payment',
  service_reports: 'service',
  task_reports: 'task',
  company_reports: 'company',
  deal_reports: 'deal',
};

/** Default includes per report type */
export const DEFAULT_INCLUDES: Partial<Record<ReportType, string[]>> = {
  project_reports: ['project'],
  budget_reports: ['deal'],
  person_reports: ['person'],
  invoice_reports: ['invoice'],
  payment_reports: ['payment'],
  service_reports: ['service'],
  task_reports: ['task'],
  company_reports: ['company'],
  deal_reports: ['deal'],
  timesheet_reports: ['person'],
};
