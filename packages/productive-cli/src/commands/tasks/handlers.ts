/**
 * Handler implementations for tasks command
 */

import type { OutputFormat } from "../../types.js";
import { exitWithValidationError, runCommand } from "../../error-handler.js";
import type { CommandContext } from "../../context.js";
import { formatTask, formatListResponse } from "../../formatters/index.js";
import {
  render,
  createRenderContext,
  humanTaskDetailRenderer,
  formatTime,
} from "../../renderers/index.js";

/**
 * Parse filter string into key-value pairs
 */
export function parseFilters(filterString: string): Record<string, string> {
  const filters: Record<string, string> = {};
  if (!filterString) return filters;

  filterString.split(",").forEach((pair) => {
    const [key, value] = pair.split("=");
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
  included:
    | Array<{ id: string; type: string; attributes: Record<string, unknown> }>
    | undefined,
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
  const spinner = ctx.createSpinner("Fetching tasks...");
  spinner.start();

  await runCommand(async () => {
    const filter: Record<string, string> = {};

    if (ctx.options.filter) {
      Object.assign(filter, parseFilters(String(ctx.options.filter)));
    }

    if (ctx.options.mine && ctx.config.userId) {
      filter.assignee_id = ctx.config.userId;
    } else if (ctx.options.person) {
      filter.assignee_id = String(ctx.options.person);
    }
    if (ctx.options.project) {
      filter.project_id = String(ctx.options.project);
    }

    const status = String(ctx.options.status || "open").toLowerCase();
    if (status === "open") {
      filter.status = "1";
    } else if (status === "completed" || status === "done") {
      filter.status = "2";
    }

    const { page, perPage } = ctx.getPagination();
    const response = await ctx.api.getTasks({
      page,
      perPage,
      filter,
      sort: ctx.getSort(),
      include: ["project", "assignee", "workflow_status"],
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || "human") as OutputFormat;
    const formattedData = formatListResponse(response.data, formatTask, response.meta, {
      included: response.included,
    });

    if (format === "csv" || format === "table") {
      // For CSV/table, flatten the data for OutputFormatter
      const data = response.data.map((t) => {
        const projectData = getIncludedResource(
          response.included,
          "projects",
          t.relationships?.project?.data?.id,
        );
        const assigneeData = getIncludedResource(
          response.included,
          "people",
          t.relationships?.assignee?.data?.id,
        );
        const statusData = getIncludedResource(
          response.included,
          "workflow_statuses",
          t.relationships?.workflow_status?.data?.id,
        );
        return {
          id: t.id,
          number: t.attributes.number || "",
          title: t.attributes.title,
          project: projectData?.name || "",
          assignee: assigneeData
            ? `${assigneeData.first_name} ${assigneeData.last_name}`
            : "",
          status: statusData?.name || "",
          worked: formatTime(t.attributes.worked_time),
          estimate: formatTime(t.attributes.initial_estimate),
          due_date: t.attributes.due_date || "",
        };
      });
      ctx.formatter.output(data);
    } else {
      // Use renderer for json, human, and kanban formats
      const renderCtx = createRenderContext({
        noColor: ctx.options["no-color"] === true,
      });
      render("task", format, formattedData, renderCtx);
    }
  }, ctx.formatter);
}

/**
 * Get a single task by ID
 */
export async function tasksGet(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;

  if (!id) {
    exitWithValidationError("id", "productive tasks get <id>", ctx.formatter);
  }

  const spinner = ctx.createSpinner("Fetching task...");
  spinner.start();

  await runCommand(async () => {
    const response = await ctx.api.getTask(id, {
      include: ["project", "assignee", "workflow_status"],
    });
    const task = response.data;

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || "human") as OutputFormat;
    const formattedData = formatTask(task, { included: response.included });

    if (format === "json") {
      ctx.formatter.output(formattedData);
    } else {
      // Use detail renderer for human format
      const renderCtx = createRenderContext({
        noColor: ctx.options["no-color"] === true,
      });
      humanTaskDetailRenderer.render(formattedData, renderCtx);
    }
  }, ctx.formatter);
}
