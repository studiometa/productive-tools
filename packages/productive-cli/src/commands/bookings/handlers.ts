/**
 * Handler implementations for bookings command
 */

import { colors } from "../../utils/colors.js";
import type { OutputFormat } from "../../types.js";
import { handleError, exitWithValidationError, runCommand } from "../../error-handler.js";
import { ValidationError } from "../../errors.js";
import type { CommandContext } from "../../context.js";
import { formatBooking, formatListResponse } from "../../formatters/index.js";
import {
  render,
  createRenderContext,
  humanBookingDetailRenderer,
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
 * List bookings
 */
export async function bookingsList(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner("Fetching bookings...");
  spinner.start();

  await runCommand(async () => {
    const filter: Record<string, string> = {};

    if (ctx.options.filter) {
      Object.assign(filter, parseFilters(String(ctx.options.filter)));
    }

    // Filter by person
    if (ctx.options.mine && ctx.config.userId) {
      filter.person_id = ctx.config.userId;
    } else if (ctx.options.person) {
      filter.person_id = String(ctx.options.person);
    }

    // Filter by date range
    if (ctx.options.from) {
      filter.after = String(ctx.options.from);
    }
    if (ctx.options.to) {
      filter.before = String(ctx.options.to);
    }

    // Include tentative bookings by default
    filter.with_draft = "true";

    const { page, perPage } = ctx.getPagination();
    const response = await ctx.api.getBookings({
      page,
      perPage,
      filter,
      sort: ctx.getSort() || "started_on",
      include: ["person", "service"],
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || "human") as OutputFormat;
    const formattedData = formatListResponse(response.data, formatBooking, response.meta, {
      included: response.included,
    });

    if (format === "csv" || format === "table") {
      const data = response.data.map((b) => ({
        id: b.id,
        start: b.attributes.started_on,
        end: b.attributes.ended_on,
        time: b.attributes.time ? formatDuration(b.attributes.time) : "",
        total: b.attributes.total_time ? formatDuration(b.attributes.total_time) : "",
        draft: b.attributes.draft ? "tentative" : "confirmed",
      }));
      ctx.formatter.output(data);
    } else {
      const renderCtx = createRenderContext({
        noColor: ctx.options["no-color"] === true,
      });
      render("booking", format, formattedData, renderCtx);
    }
  }, ctx.formatter);
}

/**
 * Get a single booking by ID
 */
export async function bookingsGet(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;

  if (!id) {
    exitWithValidationError("id", "productive bookings get <id>", ctx.formatter);
  }

  const spinner = ctx.createSpinner("Fetching booking...");
  spinner.start();

  await runCommand(async () => {
    const response = await ctx.api.getBooking(id, {
      include: ["person", "service", "event", "approver"],
    });
    const booking = response.data;

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || "human") as OutputFormat;
    const formattedData = formatBooking(booking, { included: response.included });

    if (format === "json") {
      ctx.formatter.output(formattedData);
    } else {
      const renderCtx = createRenderContext({
        noColor: ctx.options["no-color"] === true,
      });
      humanBookingDetailRenderer.render(formattedData, renderCtx);
    }
  }, ctx.formatter);
}

/**
 * Add a new booking
 */
export async function bookingsAdd(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner("Creating booking...");
  spinner.start();

  // Validate required fields
  const personId = String(ctx.options.person || ctx.config.userId || "");
  if (!personId) {
    spinner.fail();
    handleError(ValidationError.required("person"), ctx.formatter);
    return;
  }

  if (!ctx.options.from) {
    spinner.fail();
    handleError(ValidationError.required("from"), ctx.formatter);
    return;
  }

  if (!ctx.options.to) {
    spinner.fail();
    handleError(ValidationError.required("to"), ctx.formatter);
    return;
  }

  // Must have either service or event
  if (!ctx.options.service && !ctx.options.event) {
    spinner.fail();
    handleError(
      ValidationError.invalid(
        "options",
        undefined,
        "Must specify --service (for budget booking) or --event (for absence booking)",
      ),
      ctx.formatter,
    );
    return;
  }

  await runCommand(async () => {
    const response = await ctx.api.createBooking({
      person_id: personId,
      service_id: ctx.options.service ? String(ctx.options.service) : undefined,
      event_id: ctx.options.event ? String(ctx.options.event) : undefined,
      started_on: String(ctx.options.from),
      ended_on: String(ctx.options.to),
      time: ctx.options.time ? parseInt(String(ctx.options.time)) : undefined,
      total_time: ctx.options["total-time"] ? parseInt(String(ctx.options["total-time"])) : undefined,
      percentage: ctx.options.percentage ? parseInt(String(ctx.options.percentage)) : undefined,
      draft: ctx.options.tentative === true,
      note: ctx.options.note ? String(ctx.options.note) : undefined,
    });

    spinner.succeed();

    const booking = response.data;
    const format = ctx.options.format || ctx.options.f || "human";

    if (format === "json") {
      ctx.formatter.output({
        status: "success",
        ...formatBooking(booking),
      });
    } else {
      ctx.formatter.success("Booking created");
      console.log(colors.cyan("ID:"), booking.id);
      console.log(colors.cyan("Period:"), `${booking.attributes.started_on} → ${booking.attributes.ended_on}`);
      if (booking.attributes.draft) {
        console.log(colors.yellow("Status: Tentative"));
      }
    }
  }, ctx.formatter);
}

/**
 * Update an existing booking
 */
export async function bookingsUpdate(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;

  if (!id) {
    exitWithValidationError("id", "productive bookings update <id> [options]", ctx.formatter);
  }

  const spinner = ctx.createSpinner("Updating booking...");
  spinner.start();

  await runCommand(async () => {
    const data: Parameters<typeof ctx.api.updateBooking>[1] = {};

    if (ctx.options.from !== undefined) data.started_on = String(ctx.options.from);
    if (ctx.options.to !== undefined) data.ended_on = String(ctx.options.to);
    if (ctx.options.time !== undefined) data.time = parseInt(String(ctx.options.time));
    if (ctx.options["total-time"] !== undefined) data.total_time = parseInt(String(ctx.options["total-time"]));
    if (ctx.options.percentage !== undefined) data.percentage = parseInt(String(ctx.options.percentage));
    if (ctx.options.tentative !== undefined) data.draft = ctx.options.tentative === true;
    if (ctx.options.confirm !== undefined) data.draft = false;
    if (ctx.options.note !== undefined) data.note = String(ctx.options.note);

    if (Object.keys(data).length === 0) {
      spinner.fail();
      throw ValidationError.invalid(
        "options",
        data,
        "No updates specified. Use --from, --to, --time, --tentative, --confirm, --note, etc.",
      );
    }

    const response = await ctx.api.updateBooking(id, data);

    spinner.succeed();

    const format = ctx.options.format || ctx.options.f || "human";
    if (format === "json") {
      ctx.formatter.output({ status: "success", id: response.data.id });
    } else {
      ctx.formatter.success(`Booking ${id} updated`);
    }
  }, ctx.formatter);
}
