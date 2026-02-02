/**
 * Handler implementations for timers command
 */

import { colors } from "../../utils/colors.js";
import type { OutputFormat } from "../../types.js";
import { handleError, exitWithValidationError, runCommand } from "../../error-handler.js";
import { ValidationError } from "../../errors.js";
import type { CommandContext } from "../../context.js";
import { formatTimer, formatListResponse } from "../../formatters/index.js";
import {
  render,
  createRenderContext,
  humanTimerDetailRenderer,
} from "../../renderers/index.js";

/**
 * Parse filter string into key-value pairs
 */
function parseFilters(filterString: string): Record<string, string> {
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
 * Format duration in minutes to human-readable string
 */
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

/**
 * List timers
 */
export async function timersList(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner("Fetching timers...");
  spinner.start();

  await runCommand(async () => {
    const filter: Record<string, string> = {};

    if (ctx.options.filter) {
      Object.assign(filter, parseFilters(String(ctx.options.filter)));
    }

    // Filter by user
    if (ctx.options.mine && ctx.config.userId) {
      filter.person_id = ctx.config.userId;
    } else if (ctx.options.person) {
      filter.person_id = String(ctx.options.person);
    }

    const { page, perPage } = ctx.getPagination();
    const response = await ctx.api.getTimers({
      page,
      perPage,
      filter,
      sort: ctx.getSort() || "-started_at",
      include: ["time_entry"],
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || "human") as OutputFormat;
    const formattedData = formatListResponse(response.data, formatTimer, response.meta, {
      included: response.included,
    });

    if (format === "csv" || format === "table") {
      const data = response.data.map((t) => ({
        id: t.id,
        started: t.attributes.started_at,
        stopped: t.attributes.stopped_at || "running",
        total: formatDuration(t.attributes.total_time),
        person_id: t.attributes.person_id,
      }));
      ctx.formatter.output(data);
    } else {
      const renderCtx = createRenderContext({
        noColor: ctx.options["no-color"] === true,
      });
      render("timer", format, formattedData, renderCtx);
    }
  }, ctx.formatter);
}

/**
 * Get a single timer by ID
 */
export async function timersGet(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;

  if (!id) {
    exitWithValidationError("id", "productive timers get <id>", ctx.formatter);
  }

  const spinner = ctx.createSpinner("Fetching timer...");
  spinner.start();

  await runCommand(async () => {
    const response = await ctx.api.getTimer(id, {
      include: ["time_entry"],
    });
    const timer = response.data;

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || "human") as OutputFormat;
    const formattedData = formatTimer(timer, { included: response.included });

    if (format === "json") {
      ctx.formatter.output(formattedData);
    } else {
      const renderCtx = createRenderContext({
        noColor: ctx.options["no-color"] === true,
      });
      humanTimerDetailRenderer.render(formattedData, renderCtx);
    }
  }, ctx.formatter);
}

/**
 * Start a new timer
 */
export async function timersStart(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner("Starting timer...");
  spinner.start();

  // Must have either service or time-entry
  if (!ctx.options.service && !ctx.options["time-entry"]) {
    spinner.fail();
    handleError(
      ValidationError.invalid(
        "options",
        undefined,
        "Must specify --service or --time-entry to start a timer",
      ),
      ctx.formatter,
    );
    return;
  }

  await runCommand(async () => {
    const response = await ctx.api.startTimer({
      service_id: ctx.options.service ? String(ctx.options.service) : undefined,
      time_entry_id: ctx.options["time-entry"] ? String(ctx.options["time-entry"]) : undefined,
    });

    spinner.succeed();

    const timer = response.data;
    const format = ctx.options.format || ctx.options.f || "human";

    if (format === "json") {
      ctx.formatter.output({
        status: "success",
        ...formatTimer(timer),
      });
    } else {
      ctx.formatter.success("Timer started");
      console.log(colors.cyan("ID:"), timer.id);
      console.log(colors.cyan("Started at:"), timer.attributes.started_at);
    }
  }, ctx.formatter);
}

/**
 * Stop a timer
 */
export async function timersStop(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;

  if (!id) {
    exitWithValidationError("id", "productive timers stop <id>", ctx.formatter);
  }

  const spinner = ctx.createSpinner("Stopping timer...");
  spinner.start();

  await runCommand(async () => {
    const response = await ctx.api.stopTimer(id);

    spinner.succeed();

    const timer = response.data;
    const format = ctx.options.format || ctx.options.f || "human";

    if (format === "json") {
      ctx.formatter.output({
        status: "success",
        id: timer.id,
        total_time: timer.attributes.total_time,
        stopped_at: timer.attributes.stopped_at,
      });
    } else {
      ctx.formatter.success(`Timer ${id} stopped`);
      console.log(colors.cyan("Total time:"), formatDuration(timer.attributes.total_time));
      if (timer.attributes.stopped_at) {
        console.log(colors.cyan("Stopped at:"), timer.attributes.stopped_at);
      }
    }
  }, ctx.formatter);
}
