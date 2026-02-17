/**
 * CLI adapter for tasks command handlers.
 */

import { formatTask, formatListResponse } from '@studiometa/productive-api';
import {
  fromCommandContext,
  listTasks,
  getTask,
  createTask,
  updateTask,
  ExecutorValidationError,
  type ListTasksOptions,
} from '@studiometa/productive-core';

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { handleError, exitWithValidationError, runCommand } from '../../error-handler.js';
import { ValidationError } from '../../errors.js';
import {
  render,
  createRenderContext,
  humanTaskDetailRenderer,
  formatTime,
} from '../../renderers/index.js';
import { colors } from '../../utils/colors.js';
import { parseFilters } from '../../utils/parse-filters.js';

export function getIncludedResource(
  included: Array<{ id: string; type: string; attributes: Record<string, unknown> }> | undefined,
  type: string,
  id: string | undefined,
): Record<string, unknown> | undefined {
  if (!included || !id) return undefined;
  return included.find((r) => r.type === type && r.id === id)?.attributes;
}

function parseListOptions(ctx: CommandContext): ListTasksOptions {
  const options: ListTasksOptions = {};

  const additionalFilters: Record<string, string> = {};
  if (ctx.options.filter)
    Object.assign(additionalFilters, parseFilters(String(ctx.options.filter)));
  if (Object.keys(additionalFilters).length > 0) options.additionalFilters = additionalFilters;

  if (ctx.options.mine && ctx.config.userId) {
    options.assigneeId = ctx.config.userId;
  } else if (ctx.options.assignee) {
    options.assigneeId = String(ctx.options.assignee);
  } else if (ctx.options.person) {
    options.assigneeId = String(ctx.options.person);
  }
  if (ctx.options.creator) options.creatorId = String(ctx.options.creator);
  if (ctx.options.project) options.projectId = String(ctx.options.project);
  if (ctx.options.company) options.companyId = String(ctx.options.company);
  if (ctx.options.board) options.boardId = String(ctx.options.board);
  if (ctx.options['task-list']) options.taskListId = String(ctx.options['task-list']);
  if (ctx.options.parent) options.parentTaskId = String(ctx.options.parent);
  if (ctx.options['workflow-status'])
    options.workflowStatusId = String(ctx.options['workflow-status']);
  if (ctx.options.status) options.status = String(ctx.options.status);
  if (ctx.options.overdue) options.overdue = true;
  if (ctx.options['due-date']) options.dueDate = String(ctx.options['due-date']);
  if (ctx.options['due-before']) options.dueBefore = String(ctx.options['due-before']);
  if (ctx.options['due-after']) options.dueAfter = String(ctx.options['due-after']);

  const { page, perPage } = ctx.getPagination();
  options.page = page;
  options.perPage = perPage;
  options.sort = ctx.getSort();

  return options;
}

export async function tasksList(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching tasks...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await listTasks(parseListOptions(ctx), execCtx);

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatListResponse(result.data, formatTask, result.meta, {
      included: result.included,
    });

    if (format === 'csv' || format === 'table') {
      const data = result.data.map((t) => {
        const projectData = getIncludedResource(
          result.included,
          'projects',
          t.relationships?.project?.data?.id,
        );
        const assigneeData = getIncludedResource(
          result.included,
          'people',
          t.relationships?.assignee?.data?.id,
        );
        const statusData = getIncludedResource(
          result.included,
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
      const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
      render('task', format, formattedData, renderCtx);
    }
  }, ctx.formatter);
}

export async function tasksGet(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;
  if (!id) exitWithValidationError('id', 'productive tasks get <id>', ctx.formatter);

  const spinner = ctx.createSpinner('Fetching task...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await getTask({ id }, execCtx);

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatTask(result.data, { included: result.included });

    if (format === 'json') {
      ctx.formatter.output(formattedData);
    } else {
      const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
      humanTaskDetailRenderer.render(formattedData, renderCtx);
    }
  }, ctx.formatter);
}

export async function tasksAdd(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Creating task...');
  spinner.start();

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
    const execCtx = fromCommandContext(ctx);
    const result = await createTask(
      {
        title: String(ctx.options.title),
        projectId: String(ctx.options.project),
        taskListId: String(ctx.options['task-list']),
        assigneeId: ctx.options.assignee ? String(ctx.options.assignee) : undefined,
        description: ctx.options.description ? String(ctx.options.description) : undefined,
        dueDate: ctx.options['due-date'] ? String(ctx.options['due-date']) : undefined,
        startDate: ctx.options['start-date'] ? String(ctx.options['start-date']) : undefined,
        initialEstimate: ctx.options.estimate ? parseInt(String(ctx.options.estimate)) : undefined,
        workflowStatusId: ctx.options.status ? String(ctx.options.status) : undefined,
        isPrivate: ctx.options.private === true,
      },
      execCtx,
    );

    spinner.succeed();

    const task = result.data;
    const format = ctx.options.format || ctx.options.f || 'human';

    if (format === 'json') {
      ctx.formatter.output({ status: 'success', ...formatTask(task) });
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

export async function tasksUpdate(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;
  if (!id) exitWithValidationError('id', 'productive tasks update <id> [options]', ctx.formatter);

  const spinner = ctx.createSpinner('Updating task...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);

    try {
      const result = await updateTask(
        {
          id,
          title: ctx.options.title !== undefined ? String(ctx.options.title) : undefined,
          description:
            ctx.options.description !== undefined ? String(ctx.options.description) : undefined,
          dueDate:
            ctx.options['due-date'] !== undefined ? String(ctx.options['due-date']) : undefined,
          startDate:
            ctx.options['start-date'] !== undefined ? String(ctx.options['start-date']) : undefined,
          initialEstimate:
            ctx.options.estimate !== undefined ? parseInt(String(ctx.options.estimate)) : undefined,
          isPrivate: ctx.options.private !== undefined ? ctx.options.private === true : undefined,
          assigneeId: ctx.options.assignee !== undefined ? String(ctx.options.assignee) : undefined,
          workflowStatusId:
            ctx.options.status !== undefined ? String(ctx.options.status) : undefined,
        },
        execCtx,
      );

      spinner.succeed();

      const format = ctx.options.format || ctx.options.f || 'human';
      if (format === 'json') {
        ctx.formatter.output({ status: 'success', id: result.data.id });
      } else {
        ctx.formatter.success(`Task ${id} updated`);
      }
    } catch (error) {
      if (error instanceof ExecutorValidationError) {
        spinner.fail();
        throw ValidationError.invalid(
          'options',
          {},
          'No updates specified. Use --title, --description, --due-date, --assignee, --status, etc.',
        );
      }
      throw error;
    }
  }, ctx.formatter);
}
