/**
 * Handler implementations for tasks command
 */

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { handleError, exitWithValidationError, runCommand } from '../../error-handler.js';
import { ValidationError } from '../../errors.js';
import { formatTask, formatListResponse } from '../../formatters/index.js';
import {
  render,
  createRenderContext,
  humanTaskDetailRenderer,
  formatTime,
} from '../../renderers/index.js';
import { colors } from '../../utils/colors.js';
import { resolveCommandFilters, tryResolveValue } from '../../utils/resolve-filters.js';

/**
 * Parse filter string into key-value pairs
 */
export function parseFilters(filterString: string): Record<string, string> {
  const filters: Record<string, string> = {};
  if (!filterString) return filters;

  filterString.split(',').forEach((pair) => {
    const [key, value] = pair.split('=');
    if (key && value) {
      filters[key.trim()] = value.trim();
    }
  });
  return filters;
}

/**
 * Get included resource by type and id from JSON:API includes
 */
export function getIncludedResource(
  included: Array<{ id: string; type: string; attributes: Record<string, unknown> }> | undefined,
  type: string,
  id: string | undefined,
): Record<string, unknown> | undefined {
  if (!included || !id) return undefined;
  return included.find((r) => r.type === type && r.id === id)?.attributes;
}

/**
 * List tasks
 */
export async function tasksList(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching tasks...');
  spinner.start();

  await runCommand(async () => {
    const filter: Record<string, string> = {};

    if (ctx.options.filter) {
      Object.assign(filter, parseFilters(String(ctx.options.filter)));
    }

    // Person filtering
    if (ctx.options.mine && ctx.config.userId) {
      filter.assignee_id = ctx.config.userId;
    } else if (ctx.options.assignee) {
      filter.assignee_id = String(ctx.options.assignee);
    } else if (ctx.options.person) {
      // Legacy alias
      filter.assignee_id = String(ctx.options.person);
    }
    if (ctx.options.creator) {
      filter.creator_id = String(ctx.options.creator);
    }

    // Resource filtering
    if (ctx.options.project) {
      filter.project_id = String(ctx.options.project);
    }
    if (ctx.options.company) {
      filter.company_id = String(ctx.options.company);
    }
    if (ctx.options.board) {
      filter.board_id = String(ctx.options.board);
    }
    if (ctx.options['task-list']) {
      filter.task_list_id = String(ctx.options['task-list']);
    }
    if (ctx.options.parent) {
      filter.parent_task_id = String(ctx.options.parent);
    }
    if (ctx.options['workflow-status']) {
      filter.workflow_status_id = String(ctx.options['workflow-status']);
    }

    // Status filtering (open, completed)
    const status = String(ctx.options.status || 'open').toLowerCase();
    if (status === 'open') {
      filter.status = '1';
    } else if (status === 'completed' || status === 'done') {
      filter.status = '2';
    }

    // Due date filtering
    if (ctx.options.overdue) {
      filter.overdue_status = '2'; // 1=not overdue, 2=overdue
    }
    if (ctx.options['due-date']) {
      filter.due_date_on = String(ctx.options['due-date']);
    }
    if (ctx.options['due-before']) {
      filter.due_date_before = String(ctx.options['due-before']);
    }
    if (ctx.options['due-after']) {
      filter.due_date_after = String(ctx.options['due-after']);
    }

    // Resolve any human-friendly identifiers (email, project number, etc.)
    const { resolved: resolvedFilter } = await resolveCommandFilters(ctx, filter);

    const { page, perPage } = ctx.getPagination();
    const response = await ctx.api.getTasks({
      page,
      perPage,
      filter: resolvedFilter,
      sort: ctx.getSort(),
      include: ['project', 'assignee', 'workflow_status'],
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatListResponse(response.data, formatTask, response.meta, {
      included: response.included,
    });

    if (format === 'csv' || format === 'table') {
      // For CSV/table, flatten the data for OutputFormatter
      const data = response.data.map((t) => {
        const projectData = getIncludedResource(
          response.included,
          'projects',
          t.relationships?.project?.data?.id,
        );
        const assigneeData = getIncludedResource(
          response.included,
          'people',
          t.relationships?.assignee?.data?.id,
        );
        const statusData = getIncludedResource(
          response.included,
          'workflow_statuses',
          t.relationships?.workflow_status?.data?.id,
        );
        return {
          id: t.id,
          number: t.attributes.number || '',
          title: t.attributes.title,
          project: projectData?.name || '',
          assignee: assigneeData ? `${assigneeData.first_name} ${assigneeData.last_name}` : '',
          status: statusData?.name || '',
          worked: formatTime(t.attributes.worked_time),
          estimate: formatTime(t.attributes.initial_estimate),
          due_date: t.attributes.due_date || '',
        };
      });
      ctx.formatter.output(data);
    } else {
      // Use renderer for json, human, and kanban formats
      const renderCtx = createRenderContext({
        noColor: ctx.options['no-color'] === true,
      });
      render('task', format, formattedData, renderCtx);
    }
  }, ctx.formatter);
}

/**
 * Get a single task by ID
 */
export async function tasksGet(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;

  if (!id) {
    exitWithValidationError('id', 'productive tasks get <id>', ctx.formatter);
  }

  const spinner = ctx.createSpinner('Fetching task...');
  spinner.start();

  await runCommand(async () => {
    const response = await ctx.api.getTask(id, {
      include: ['project', 'assignee', 'workflow_status'],
    });
    const task = response.data;

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatTask(task, { included: response.included });

    if (format === 'json') {
      ctx.formatter.output(formattedData);
    } else {
      // Use detail renderer for human format
      const renderCtx = createRenderContext({
        noColor: ctx.options['no-color'] === true,
      });
      humanTaskDetailRenderer.render(formattedData, renderCtx);
    }
  }, ctx.formatter);
}

/**
 * Add a new task
 */
export async function tasksAdd(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Creating task...');
  spinner.start();

  // Validate required fields
  if (!ctx.options.title) {
    spinner.fail();
    handleError(ValidationError.required('title'), ctx.formatter);
    return;
  }

  if (!ctx.options.project) {
    spinner.fail();
    handleError(ValidationError.required('project'), ctx.formatter);
    return;
  }

  if (!ctx.options['task-list']) {
    spinner.fail();
    handleError(ValidationError.required('task-list'), ctx.formatter);
    return;
  }

  await runCommand(async () => {
    // Resolve project ID if it's a human-friendly identifier
    const projectId = await tryResolveValue(ctx, String(ctx.options.project), 'project');

    // Resolve assignee ID if provided
    const assigneeId = ctx.options.assignee
      ? await tryResolveValue(ctx, String(ctx.options.assignee), 'person')
      : undefined;

    const response = await ctx.api.createTask({
      title: String(ctx.options.title),
      project_id: projectId,
      task_list_id: String(ctx.options['task-list']),
      assignee_id: assigneeId,
      description: ctx.options.description ? String(ctx.options.description) : undefined,
      due_date: ctx.options['due-date'] ? String(ctx.options['due-date']) : undefined,
      start_date: ctx.options['start-date'] ? String(ctx.options['start-date']) : undefined,
      initial_estimate: ctx.options.estimate ? parseInt(String(ctx.options.estimate)) : undefined,
      workflow_status_id: ctx.options.status ? String(ctx.options.status) : undefined,
      private: ctx.options.private === true,
    });

    spinner.succeed();

    const task = response.data;
    const format = ctx.options.format || ctx.options.f || 'human';

    if (format === 'json') {
      ctx.formatter.output({
        status: 'success',
        ...formatTask(task),
      });
    } else {
      ctx.formatter.success('Task created');
      console.log(colors.cyan('ID:'), task.id);
      console.log(colors.cyan('Title:'), task.attributes.title);
      if (task.attributes.number) {
        console.log(colors.cyan('Number:'), `#${task.attributes.number}`);
      }
      if (task.attributes.due_date) {
        console.log(colors.cyan('Due date:'), task.attributes.due_date);
      }
    }
  }, ctx.formatter);
}

/**
 * Update an existing task
 */
export async function tasksUpdate(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;

  if (!id) {
    exitWithValidationError('id', 'productive tasks update <id> [options]', ctx.formatter);
  }

  const spinner = ctx.createSpinner('Updating task...');
  spinner.start();

  await runCommand(async () => {
    const data: Parameters<typeof ctx.api.updateTask>[1] = {};

    if (ctx.options.title !== undefined) data.title = String(ctx.options.title);
    if (ctx.options.description !== undefined) data.description = String(ctx.options.description);
    if (ctx.options['due-date'] !== undefined) data.due_date = String(ctx.options['due-date']);
    if (ctx.options['start-date'] !== undefined)
      data.start_date = String(ctx.options['start-date']);
    if (ctx.options.estimate !== undefined)
      data.initial_estimate = parseInt(String(ctx.options.estimate));
    if (ctx.options.private !== undefined) data.private = ctx.options.private === true;
    if (ctx.options.assignee !== undefined) {
      // Resolve assignee if it's a human-friendly identifier
      data.assignee_id = await tryResolveValue(ctx, String(ctx.options.assignee), 'person');
    }
    if (ctx.options.status !== undefined) data.workflow_status_id = String(ctx.options.status);

    if (Object.keys(data).length === 0) {
      spinner.fail();
      throw ValidationError.invalid(
        'options',
        data,
        'No updates specified. Use --title, --description, --due-date, --assignee, --status, etc.',
      );
    }

    const response = await ctx.api.updateTask(id, data);

    spinner.succeed();

    const format = ctx.options.format || ctx.options.f || 'human';
    if (format === 'json') {
      ctx.formatter.output({ status: 'success', id: response.data.id });
    } else {
      ctx.formatter.success(`Task ${id} updated`);
    }
  }, ctx.formatter);
}
