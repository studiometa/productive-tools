/**
 * Summaries MCP handler.
 *
 * Custom handler for dashboard-style summaries (not using createResourceHandler).
 * Routes actions to the appropriate summary executor.
 */

import {
  getMyDaySummary,
  getProjectHealthSummary,
  getTeamPulseSummary,
} from '@studiometa/productive-core';

import type { HandlerContext, ToolResult } from './types.js';

import { ErrorMessages, UserInputError } from '../errors.js';
import { getMyDaySuggestions } from '../suggestions.js';
import { inputErrorResult, jsonResult } from './utils.js';

const VALID_ACTIONS = ['my_day', 'project_health', 'team_pulse', 'help'];

interface SummaryArgs {
  project_id?: string;
}

/**
 * Handle summaries resource.
 *
 * Supports: my_day, project_health, team_pulse
 */
export async function handleSummaries(
  action: string,
  args: SummaryArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  if (!VALID_ACTIONS.includes(action)) {
    return inputErrorResult(ErrorMessages.invalidAction(action, 'summaries', VALID_ACTIONS));
  }

  const execCtx = ctx.executor();

  switch (action) {
    case 'my_day': {
      const result = await getMyDaySummary({}, execCtx);
      if (ctx.includeHints !== false) {
        const suggestions = getMyDaySuggestions(result.data);
        if (suggestions.length > 0) {
          return jsonResult({ ...result.data, _suggestions: suggestions });
        }
      }
      return jsonResult(result.data);
    }

    case 'project_health': {
      if (!args.project_id) {
        return inputErrorResult(
          new UserInputError('project_id is required for project_health summary', [
            'Provide the project_id parameter',
            'You can find project IDs using resource="projects" action="list"',
            'Or use a project number like "PRJ-123"',
          ]),
        );
      }

      const result = await getProjectHealthSummary({ projectId: args.project_id }, execCtx);
      return jsonResult(result.data);
    }

    case 'team_pulse': {
      const result = await getTeamPulseSummary({}, execCtx);
      return jsonResult(result.data);
    }

    case 'help': {
      return jsonResult({
        resource: 'summaries',
        description: 'Dashboard-style summaries that aggregate data from multiple resources',
        actions: {
          my_day: {
            description: 'Personal dashboard for the current user',
            parameters: {},
            returns: {
              tasks: 'Open and overdue tasks assigned to you',
              time: 'Time entries logged today',
              timers: 'Currently running timers',
            },
          },
          project_health: {
            description: 'Project status with budget burn and task stats',
            parameters: {
              project_id: 'Required. Project ID or project number (e.g., PRJ-123)',
            },
            returns: {
              project: 'Project details',
              tasks: 'Open and overdue task counts',
              budget: 'Budget burn rate by service',
              recent_activity: 'Time tracking activity in last 7 days',
            },
          },
          team_pulse: {
            description: 'Team-wide time tracking activity for today',
            parameters: {},
            returns: {
              team: 'Counts of active users, those tracking time, and with timers',
              people: 'Per-person breakdown of time logged and active timers',
            },
          },
        },
      });
    }

    default: {
      return inputErrorResult(ErrorMessages.invalidAction(action, 'summaries', VALID_ACTIONS));
    }
  }
}
