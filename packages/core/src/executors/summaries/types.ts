/**
 * Option and result types for summary executors.
 */

import type {
  ProductiveTask,
  ProductiveTimeEntry,
  ProductiveTimer,
} from '@studiometa/productive-api';

/**
 * Options for my_day summary (no options needed, uses userId from config)
 */
export interface MyDaySummaryOptions {
  // No options - uses userId from ExecutorContext.config
}

/**
 * Compact task representation for summaries
 */
export interface SummaryTask {
  id: string;
  title: string;
  project_name?: string;
  due_date?: string;
  status?: string;
}

/**
 * Compact time entry representation for summaries
 */
export interface SummaryTimeEntry {
  id: string;
  time: number;
  service_name?: string;
  project_name?: string;
  note?: string;
}

/**
 * Compact timer representation for summaries
 */
export interface SummaryTimer {
  id: string;
  started_at: string;
  total_time: number;
  service_name?: string;
}

/**
 * Result for my_day summary
 */
export interface MyDaySummaryResult {
  summary_type: 'my_day';
  generated_at: string;
  user_id: string;
  tasks: {
    open: number;
    overdue: number;
    items: SummaryTask[];
  };
  time: {
    logged_today_minutes: number;
    entries_today: number;
    items: SummaryTimeEntry[];
  };
  timers: SummaryTimer[];
}

/**
 * Options for project_health summary
 */
export interface ProjectHealthSummaryOptions {
  projectId: string;
}

/**
 * Budget service information for project health
 */
export interface SummaryBudgetService {
  id: string;
  name: string;
  budgeted_time?: number;
  worked_time?: number;
  remaining_time?: number;
}

/**
 * Result for project_health summary
 */
export interface ProjectHealthSummaryResult {
  summary_type: 'project_health';
  generated_at: string;
  project: {
    id: string;
    name: string;
    project_number?: string;
  };
  tasks: {
    open: number;
    overdue: number;
    items: SummaryTask[];
  };
  budget: {
    services: SummaryBudgetService[];
    total_budgeted_minutes: number;
    total_worked_minutes: number;
    burn_rate_percent: number;
  };
  recent_activity: {
    time_entries_last_7_days: number;
    total_time_last_7_days_minutes: number;
  };
}

/**
 * Options for team_pulse summary (no options needed)
 */
export interface TeamPulseSummaryOptions {
  // No options - fetches all active users
}

/**
 * Person time summary for team pulse
 */
export interface PersonTimeSummary {
  person_id: string;
  person_name: string;
  email: string;
  logged_today_minutes: number;
  entries_today: number;
  active_timer?: SummaryTimer;
}

/**
 * Result for team_pulse summary
 */
export interface TeamPulseSummaryResult {
  summary_type: 'team_pulse';
  generated_at: string;
  date: string;
  team: {
    total_active: number;
    tracking_today: number;
    with_active_timer: number;
  };
  people: PersonTimeSummary[];
}

/**
 * Helper to convert ProductiveTask to SummaryTask
 */
export function toSummaryTask(
  task: ProductiveTask,
  included?: Array<{ id: string; type: string; attributes: Record<string, unknown> }>,
): SummaryTask {
  // Try to resolve project name from included resources
  let projectName: string | undefined;
  const projectRel = task.relationships?.project?.data;
  if (projectRel && included) {
    const project = included.find((r) => r.type === 'projects' && r.id === projectRel.id);
    if (project) {
      projectName = project.attributes.name as string;
    }
  }

  // Try to resolve workflow status from included resources
  let status: string | undefined;
  const statusRel = task.relationships?.workflow_status?.data;
  if (statusRel && included) {
    const workflowStatus = included.find(
      (r) => r.type === 'workflow_statuses' && r.id === statusRel.id,
    );
    if (workflowStatus) {
      status = workflowStatus.attributes.name as string;
    }
  }

  return {
    id: task.id,
    title: task.attributes.title,
    project_name: projectName,
    due_date: task.attributes.due_date,
    status,
  };
}

/**
 * Helper to convert ProductiveTimeEntry to SummaryTimeEntry
 */
export function toSummaryTimeEntry(
  entry: ProductiveTimeEntry,
  included?: Array<{ id: string; type: string; attributes: Record<string, unknown> }>,
): SummaryTimeEntry {
  let serviceName: string | undefined;
  let projectName: string | undefined;

  const serviceRel = entry.relationships?.service?.data;
  if (serviceRel && included) {
    const service = included.find((r) => r.type === 'services' && r.id === serviceRel.id);
    if (service) {
      serviceName = service.attributes.name as string;
    }
  }

  const projectRel = entry.relationships?.project?.data;
  if (projectRel && included) {
    const project = included.find((r) => r.type === 'projects' && r.id === projectRel.id);
    if (project) {
      projectName = project.attributes.name as string;
    }
  }

  return {
    id: entry.id,
    time: entry.attributes.time,
    service_name: serviceName,
    project_name: projectName,
    note: entry.attributes.note,
  };
}

/**
 * Helper to convert ProductiveTimer to SummaryTimer
 */
export function toSummaryTimer(
  timer: ProductiveTimer,
  included?: Array<{ id: string; type: string; attributes: Record<string, unknown> }>,
): SummaryTimer {
  let serviceName: string | undefined;

  // Timers may have service via time_entry relationship
  const timeEntryRel = timer.relationships?.time_entry?.data;
  if (timeEntryRel && included) {
    const timeEntry = included.find((r) => r.type === 'time_entries' && r.id === timeEntryRel.id);
    if (timeEntry) {
      const serviceRel = (timeEntry as unknown as ProductiveTimeEntry).relationships?.service?.data;
      if (serviceRel) {
        const service = included.find((r) => r.type === 'services' && r.id === serviceRel.id);
        if (service) {
          serviceName = service.attributes.name as string;
        }
      }
    }
  }

  return {
    id: timer.id,
    started_at: timer.attributes.started_at,
    total_time: timer.attributes.total_time,
    service_name: serviceName,
  };
}
