/**
 * Summaries executors.
 *
 * Dashboard-style summaries that aggregate data from multiple resources:
 * - my_day: Personal dashboard for the current user
 * - project_health: Project status with budget burn and task stats
 * - team_pulse: Team-wide time tracking activity
 */

export { getMyDaySummary } from './my-day.js';
export { getProjectHealthSummary } from './project-health.js';
export { getTeamPulseSummary } from './team-pulse.js';
export type {
  MyDaySummaryOptions,
  MyDaySummaryResult,
  PersonTimeSummary,
  ProjectHealthSummaryOptions,
  ProjectHealthSummaryResult,
  SummaryBudgetService,
  SummaryTask,
  SummaryTimeEntry,
  SummaryTimer,
  TeamPulseSummaryOptions,
  TeamPulseSummaryResult,
} from './types.js';
