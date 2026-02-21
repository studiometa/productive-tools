/**
 * Project Health summary executor.
 *
 * Provides a project dashboard summary including:
 * - Project details
 * - Open and overdue tasks
 * - Budget burn rate per service
 * - Recent activity (time entries in last 7 days)
 */

import type { IncludedResource, ProductiveService } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type {
  ProjectHealthSummaryOptions,
  ProjectHealthSummaryResult,
  SummaryBudgetService,
} from './types.js';

import { ExecutorValidationError } from '../errors.js';
import { toSummaryTask } from './types.js';

const MAX_ITEMS = 20;

/**
 * Get today's date in YYYY-MM-DD format
 */
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get date 7 days ago in YYYY-MM-DD format
 */
function getSevenDaysAgo(): string {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().split('T')[0];
}

/**
 * Convert service to budget summary
 */
function toSummaryBudgetService(service: ProductiveService): SummaryBudgetService {
  const budgeted = service.attributes.budgeted_time ?? 0;
  const worked = service.attributes.worked_time ?? 0;

  return {
    id: service.id,
    name: service.attributes.name,
    budgeted_time: budgeted,
    worked_time: worked,
    remaining_time: Math.max(0, budgeted - worked),
  };
}

/**
 * Fetch project_health summary.
 *
 * Requires project_id. Parallel fetches:
 * - getProject
 * - listTasks(project_id, status=open)
 * - listTasks(project_id, overdue)
 * - listServices(project_id)
 * - listTimeEntries(project_id, last 7 days)
 */
export async function getProjectHealthSummary(
  options: ProjectHealthSummaryOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProjectHealthSummaryResult>> {
  if (!options.projectId) {
    throw new ExecutorValidationError(
      'projectId is required for project_health summary',
      'projectId',
    );
  }

  // Resolve project ID if it's a smart identifier
  const projectId = await ctx.resolver.resolveValue(options.projectId, 'project');

  const today = getToday();
  const sevenDaysAgo = getSevenDaysAgo();

  // Parallel fetch all data
  const [projectRes, openTasksRes, overdueTasksRes, servicesRes, recentTimeRes] = await Promise.all(
    [
      // Project details
      ctx.api.getProject(projectId),
      // Open tasks in project
      ctx.api.getTasks({
        page: 1,
        perPage: MAX_ITEMS,
        filter: {
          project_id: projectId,
          status: '1', // open
        },
        include: ['workflow_status', 'assignee'],
        sort: 'due_date',
      }),
      // Overdue tasks in project
      ctx.api.getTasks({
        page: 1,
        perPage: MAX_ITEMS,
        filter: {
          project_id: projectId,
          status: '1', // open
          overdue_status: '2', // overdue
        },
        include: ['workflow_status', 'assignee'],
        sort: 'due_date',
      }),
      // Services (budget items) in project
      ctx.api.getServices({
        page: 1,
        perPage: 100, // Get all services for accurate budget calc
        filter: {
          project_id: projectId,
        },
      }),
      // Time entries in last 7 days
      ctx.api.getTimeEntries({
        page: 1,
        perPage: 100,
        filter: {
          project_id: projectId,
          after: sevenDaysAgo,
          before: today,
        },
      }),
    ],
  );

  const project = projectRes.data;

  // Combine included resources
  const allIncluded: IncludedResource[] = [
    ...(openTasksRes.included || []),
    ...(overdueTasksRes.included || []),
  ];

  // Calculate budget metrics
  const services = servicesRes.data.map(toSummaryBudgetService);
  const totalBudgeted = services.reduce((sum, s) => sum + (s.budgeted_time ?? 0), 0);
  const totalWorked = services.reduce((sum, s) => sum + (s.worked_time ?? 0), 0);
  const burnRatePercent = totalBudgeted > 0 ? Math.round((totalWorked / totalBudgeted) * 100) : 0;

  // Calculate recent activity
  const recentTimeTotal = recentTimeRes.data.reduce((sum, entry) => sum + entry.attributes.time, 0);

  const result: ProjectHealthSummaryResult = {
    summary_type: 'project_health',
    generated_at: new Date().toISOString(),
    project: {
      id: project.id,
      name: project.attributes.name,
      project_number: project.attributes.project_number,
    },
    tasks: {
      open: openTasksRes.meta?.total_count ?? openTasksRes.data.length,
      overdue: overdueTasksRes.meta?.total_count ?? overdueTasksRes.data.length,
      items: openTasksRes.data.slice(0, MAX_ITEMS).map((t) => toSummaryTask(t, allIncluded)),
    },
    budget: {
      services,
      total_budgeted_minutes: totalBudgeted,
      total_worked_minutes: totalWorked,
      burn_rate_percent: burnRatePercent,
    },
    recent_activity: {
      time_entries_last_7_days: recentTimeRes.meta?.total_count ?? recentTimeRes.data.length,
      total_time_last_7_days_minutes: recentTimeTotal,
    },
  };

  return { data: result };
}
