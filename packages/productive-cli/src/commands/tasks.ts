import { OutputFormatter } from "../output.js";
import { colors } from "../utils/colors.js";
import { stripHtml } from "../utils/html.js";
import {
  linkedId,
  linkedProject,
  linkedPerson,
} from "../utils/productive-links.js";
import type { OutputFormat } from "../types.js";
import { exitWithValidationError, runCommand } from "../error-handler.js";
import { createContext, type CommandContext, type CommandOptions } from "../context.js";
import { formatTask, formatListResponse } from "../formatters/index.js";

/**
 * Parse filter string into key-value pairs
 * @example parseFilters("assignee_id=123,status=open") => { assignee_id: "123", status: "open" }
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

export function showTasksHelp(subcommand?: string): void {
  if (subcommand === "list" || subcommand === "ls") {
    console.log(`
${colors.bold("productive tasks list")} - List tasks

${colors.bold("USAGE:")}
  productive tasks list [options]

${colors.bold("OPTIONS:")}
  --mine              Filter by configured user ID (assignee)
  --status <status>   Filter by status: open, completed, all (default: open)
  --person <id>       Filter by assignee person ID
  --project <id>      Filter by project ID
  --filter <filters>  Generic filters (comma-separated key=value pairs)
  -p, --page <num>    Page number (default: 1)
  -s, --size <num>    Page size (default: 100)
  --sort <field>      Sort by field (prefix with - for descending)
  -f, --format <fmt>  Output format: json, human, csv, table, kanban

${colors.bold("EXAMPLES:")}
  productive tasks list
  productive tasks list --mine
  productive tasks list --mine --status completed
  productive tasks list --status all --project 12345
  productive tasks list --filter assignee_id=123
  productive tasks list --format kanban --project 12345
`);
  } else if (subcommand === "get") {
    console.log(`
${colors.bold("productive tasks get")} - Get task details

${colors.bold("USAGE:")}
  productive tasks get <id>

${colors.bold("ARGUMENTS:")}
  <id>                Task ID (required)

${colors.bold("OPTIONS:")}
  -f, --format <fmt>  Output format: json, human

${colors.bold("EXAMPLES:")}
  productive tasks get 12345
  productive tasks get 12345 --format json
`);
  } else {
    console.log(`
${colors.bold("productive tasks")} - Manage tasks

${colors.bold("USAGE:")}
  productive tasks <subcommand> [options]

${colors.bold("SUBCOMMANDS:")}
  list, ls            List tasks
  get <id>            Get task details

${colors.bold("COMMON OPTIONS:")}
  -f, --format <fmt>  Output format: json, human, csv, table
  -p, --page <num>    Page number for pagination
  -s, --size <num>    Page size (default: 100)
  -h, --help          Show help for a subcommand

${colors.bold("EXAMPLES:")}
  productive tasks list
  productive tasks list --project 12345
  productive tasks get 67890

Run ${colors.cyan("productive tasks <subcommand> --help")} for subcommand details.
`);
  }
}

export async function handleTasksCommand(
  subcommand: string,
  args: string[],
  options: Record<string, string | boolean>,
): Promise<void> {
  const format = (options.format || options.f || "human") as OutputFormat;
  const formatter = new OutputFormatter(format, options["no-color"] === true);

  const ctx = createContext(options as CommandOptions);

  switch (subcommand) {
    case "list":
    case "ls":
      await tasksListWithContext(ctx);
      break;
    case "get":
      await tasksGetWithContext(args, ctx);
      break;
    default:
      formatter.error(`Unknown tasks subcommand: ${subcommand}`);
      process.exit(1);
  }
}

/**
 * Format time in minutes to human readable format
 */
export function formatTime(minutes: number | undefined): string {
  if (minutes === undefined || minutes === null) return "-";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h${mins}m`;
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
 * Strip ANSI codes for length calculation
 */
export function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(
    /\x1b\[[0-9;]*m|\x1b\]8;;[^\x1b]*\x1b\\|\x1b\]8;;\x1b\\/g,
    "",
  );
}

/**
 * Truncate text to fit width (accounting for ANSI codes)
 */
export function truncateText(text: string, maxWidth: number): string {
  const visibleLength = stripAnsi(text).length;
  if (visibleLength <= maxWidth) return text;

  // Simple truncation - find where to cut
  let visibleCount = 0;
  let cutIndex = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\x1b") {
      // Skip ANSI sequence
      const endBracket = text.indexOf("m", i);
      const endOsc = text.indexOf("\\", i);
      if (endBracket !== -1 && (endOsc === -1 || endBracket < endOsc)) {
        i = endBracket;
      } else if (endOsc !== -1) {
        i = endOsc;
      }
      continue;
    }
    visibleCount++;
    if (visibleCount >= maxWidth - 1) {
      cutIndex = i;
      break;
    }
  }
  return text.slice(0, cutIndex) + "…" + "\x1b[0m";
}

/**
 * Pad text to width (accounting for ANSI codes)
 */
export function padText(text: string, width: number): string {
  const visibleLength = stripAnsi(text).length;
  if (visibleLength >= width) return text;
  return text + " ".repeat(width - visibleLength);
}

interface KanbanTask {
  id: string;
  number?: number;
  title: string;
  assignee?: string;
  statusId?: string;
  statusName?: string;
}

interface KanbanColumn {
  id: string;
  name: string;
  tasks: KanbanTask[];
}

// Render tasks in kanban board view
function renderKanban(columns: KanbanColumn[], terminalWidth: number): void {
  if (columns.length === 0) {
    console.log(colors.dim("No columns to display"));
    return;
  }

  const columnGap = 2;
  const minColumnWidth = 20;
  const maxColumnWidth = 40;

  // Calculate column width based on terminal width and number of columns
  const availableWidth = terminalWidth - (columns.length - 1) * columnGap;
  let columnWidth = Math.floor(availableWidth / columns.length);
  columnWidth = Math.max(minColumnWidth, Math.min(maxColumnWidth, columnWidth));

  // Render header row
  const headers = columns.map((col) => {
    const countBadge = colors.dim(`(${col.tasks.length})`);
    const headerText = `${colors.bold(col.name)} ${countBadge}`;
    return padText(truncateText(headerText, columnWidth), columnWidth);
  });
  console.log(headers.join(" ".repeat(columnGap)));

  // Render separator
  const separators = columns.map(() => colors.dim("─".repeat(columnWidth)));
  console.log(separators.join(" ".repeat(columnGap)));

  // Find max tasks in any column
  const maxTasks = Math.max(...columns.map((col) => col.tasks.length), 0);

  // Render tasks row by row
  for (let taskIndex = 0; taskIndex < maxTasks; taskIndex++) {
    // Task title line
    const titleLine = columns.map((col) => {
      const task = col.tasks[taskIndex];
      if (!task) return " ".repeat(columnWidth);

      const numberPart = task.number
        ? linkedId(task.id, "task").replace(`#${task.id}`, `#${task.number}`) +
          " "
        : "";
      const titleText = `${numberPart}${task.title}`;
      return padText(truncateText(titleText, columnWidth), columnWidth);
    });
    console.log(titleLine.join(" ".repeat(columnGap)));

    // Task assignee line
    const assigneeLine = columns.map((col) => {
      const task = col.tasks[taskIndex];
      if (!task) return " ".repeat(columnWidth);

      if (task.assignee) {
        const assigneeText = colors.dim(`  → ${task.assignee}`);
        return padText(truncateText(assigneeText, columnWidth), columnWidth);
      }
      return " ".repeat(columnWidth);
    });
    // Only print if there's content
    if (assigneeLine.some((line) => line.trim() !== "")) {
      console.log(assigneeLine.join(" ".repeat(columnGap)));
    }

    // Empty line between tasks
    if (taskIndex < maxTasks - 1) {
      console.log(
        columns.map(() => " ".repeat(columnWidth)).join(" ".repeat(columnGap)),
      );
    }
  }
}
// ============================================================================
// Context-based command implementations (new pattern)
// ============================================================================

async function tasksListWithContext(ctx: CommandContext): Promise<void> {
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

    const format = ctx.options.format || ctx.options.f || "human";
    if (format === "json") {
      ctx.formatter.output(
        formatListResponse(response.data, formatTask, response.meta, {
          included: response.included,
        })
      );
    } else if (format === "csv" || format === "table") {
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
    } else if (format === "kanban") {
      const statusMap = new Map<string, KanbanColumn>();
      const defaultColumn: KanbanColumn = {
        id: "unknown",
        name: "No Status",
        tasks: [],
      };

      for (const task of response.data) {
        const statusId = task.relationships?.workflow_status?.data?.id;
        const statusData = getIncludedResource(
          response.included,
          "workflow_statuses",
          statusId,
        );
        const assigneeData = getIncludedResource(
          response.included,
          "people",
          task.relationships?.assignee?.data?.id,
        );

        const statusName = statusData
          ? String(statusData.name || "Unknown")
          : null;

        const kanbanTask: KanbanTask = {
          id: task.id,
          number: task.attributes.number,
          title: task.attributes.title || "Untitled",
          assignee: assigneeData
            ? `${assigneeData.first_name} ${assigneeData.last_name}`
            : undefined,
          statusId,
          statusName: statusName || undefined,
        };

        if (statusName) {
          if (!statusMap.has(statusName)) {
            statusMap.set(statusName, {
              id: statusId || statusName,
              name: statusName,
              tasks: [],
            });
          }
          statusMap.get(statusName)!.tasks.push(kanbanTask);
        } else {
          defaultColumn.tasks.push(kanbanTask);
        }
      }

      const columns = Array.from(statusMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      );

      if (defaultColumn.tasks.length > 0) {
        columns.push(defaultColumn);
      }

      const terminalWidth = process.stdout.columns || 80;
      renderKanban(columns, terminalWidth);

      if (response.meta?.total) {
        console.log();
        console.log(colors.dim(`Total: ${response.meta.total} tasks`));
      }
    } else {
      response.data.forEach((task) => {
        const isClosed = task.attributes.closed;
        const statusIcon = isClosed ? colors.green("✓") : colors.yellow("○");
        const title = task.attributes.title || "Untitled";
        const taskNumber = task.attributes.number
          ? `#${task.attributes.number}`
          : "";

        const projectData = getIncludedResource(
          response.included,
          "projects",
          task.relationships?.project?.data?.id,
        );
        const assigneeData = getIncludedResource(
          response.included,
          "people",
          task.relationships?.assignee?.data?.id,
        );
        const statusData = getIncludedResource(
          response.included,
          "workflow_statuses",
          task.relationships?.workflow_status?.data?.id,
        );

        const numberPart = taskNumber ? colors.dim(taskNumber) + " " : "";
        console.log(
          `${statusIcon} ${numberPart}${colors.bold(title)} ${linkedId(task.id, "task")}`,
        );

        const parts: string[] = [];
        if (projectData?.name) {
          const projectId = task.relationships?.project?.data?.id;
          const projectName = colors.cyan(String(projectData.name));
          parts.push(
            projectId ? linkedProject(projectName, projectId) : projectName,
          );
        }
        if (assigneeData) {
          const assigneeId = task.relationships?.assignee?.data?.id;
          const assigneeName = `${assigneeData.first_name} ${assigneeData.last_name}`;
          const assigneeText = assigneeId
            ? linkedPerson(assigneeName, assigneeId)
            : assigneeName;
          parts.push(`${colors.dim("→")} ${assigneeText}`);
        }
        if (statusData?.name) {
          parts.push(colors.dim(`[${statusData.name}]`));
        }
        if (parts.length > 0) {
          console.log(`  ${parts.join(" ")}`);
        }

        const timeInfo: string[] = [];
        const worked = task.attributes.worked_time;
        const estimate = task.attributes.initial_estimate;
        if (worked !== undefined && worked > 0) {
          const workedStr = formatTime(worked);
          if (estimate !== undefined && estimate > 0) {
            const estimateStr = formatTime(estimate);
            const isOverBudget = worked > estimate;
            const ratio = `${workedStr}/${estimateStr}`;
            timeInfo.push(
              `${colors.dim("Time:")} ${isOverBudget ? colors.red(ratio) : ratio}`,
            );
          } else {
            timeInfo.push(`${colors.dim("Time:")} ${workedStr}`);
          }
        } else if (estimate !== undefined && estimate > 0) {
          timeInfo.push(`${colors.dim("Est:")} ${formatTime(estimate)}`);
        }

        if (task.attributes.due_date) {
          const dueDate = new Date(task.attributes.due_date);
          const now = new Date();
          const isOverdue = !isClosed && dueDate < now;
          const dueDateStr = task.attributes.due_date;
          timeInfo.push(
            `${colors.dim("Due:")} ${isOverdue ? colors.red(dueDateStr) : dueDateStr}`,
          );
        }

        if (timeInfo.length > 0) {
          console.log(`  ${timeInfo.join("  ")}`);
        }

        console.log();
      });

      if (response.meta?.total) {
        const currentPage = response.meta.page || 1;
        const perPage = response.meta.per_page || 100;
        const totalPages = Math.ceil(response.meta.total / perPage);
        console.log(
          colors.dim(
            `Page ${currentPage}/${totalPages} (Total: ${response.meta.total} tasks)`,
          ),
        );
      }
    }
  }, ctx.formatter);
}

async function tasksGetWithContext(args: string[], ctx: CommandContext): Promise<void> {
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

    const projectData = getIncludedResource(
      response.included,
      "projects",
      task.relationships?.project?.data?.id,
    );
    const assigneeData = getIncludedResource(
      response.included,
      "people",
      task.relationships?.assignee?.data?.id,
    );
    const statusData = getIncludedResource(
      response.included,
      "workflow_statuses",
      task.relationships?.workflow_status?.data?.id,
    );

    spinner.succeed();

    const format = ctx.options.format || ctx.options.f || "human";
    if (format === "json") {
      ctx.formatter.output(formatTask(task, { included: response.included }));
    } else {
      const isClosed = task.attributes.closed;
      const statusIcon = isClosed
        ? colors.green("✓ Completed")
        : colors.yellow("○ Active");
      const taskNumber = task.attributes.number
        ? colors.dim(`#${task.attributes.number} `)
        : "";

      console.log(`${taskNumber}${colors.bold(task.attributes.title)}`);
      console.log(colors.dim("─".repeat(50)));
      console.log(`${colors.cyan("ID:")}       ${linkedId(task.id, "task")}`);
      console.log(`${colors.cyan("Status:")}   ${statusIcon}`);

      if (statusData?.name) {
        console.log(
          `${colors.cyan("Workflow:")} ${colors.dim(`[${statusData.name}]`)}`,
        );
      }

      if (projectData?.name) {
        const projectId = task.relationships?.project?.data?.id;
        const projectName = String(projectData.name);
        const projectText = projectId
          ? linkedProject(projectName, projectId)
          : projectName;
        console.log(`${colors.cyan("Project:")}  ${projectText}`);
      }

      if (assigneeData) {
        const assigneeId = task.relationships?.assignee?.data?.id;
        const assigneeName = `${assigneeData.first_name} ${assigneeData.last_name}`;
        const assigneeText = assigneeId
          ? linkedPerson(assigneeName, assigneeId)
          : assigneeName;
        console.log(`${colors.cyan("Assignee:")} ${assigneeText}`);
      }

      const worked = task.attributes.worked_time;
      const estimate = task.attributes.initial_estimate;
      if (worked !== undefined && worked > 0) {
        const workedStr = formatTime(worked);
        if (estimate !== undefined && estimate > 0) {
          const estimateStr = formatTime(estimate);
          const isOverBudget = worked > estimate;
          const ratio = `${workedStr} / ${estimateStr}`;
          console.log(
            `${colors.cyan("Time:")}     ${isOverBudget ? colors.red(ratio) : ratio}`,
          );
        } else {
          console.log(`${colors.cyan("Time:")}     ${workedStr}`);
        }
      } else if (estimate !== undefined && estimate > 0) {
        console.log(`${colors.cyan("Estimate:")} ${formatTime(estimate)}`);
      }

      if (task.attributes.due_date) {
        const dueDate = new Date(task.attributes.due_date);
        const now = new Date();
        const isOverdue = !isClosed && dueDate < now;
        const dueDateStr = task.attributes.due_date;
        console.log(
          `${colors.cyan("Due:")}      ${isOverdue ? colors.red(dueDateStr) : dueDateStr}`,
        );
      }

      if (task.attributes.description) {
        const description = stripHtml(task.attributes.description);
        if (description) {
          console.log();
          console.log(`${colors.cyan("Description:")}`);
          const lines = description.split("\n").map((line) => `  ${line}`);
          console.log(lines.join("\n"));
        }
      }

      console.log();
      console.log(
        `${colors.dim("Created:")} ${new Date(task.attributes.created_at).toLocaleString()}`,
      );
      console.log(
        `${colors.dim("Updated:")} ${new Date(task.attributes.updated_at).toLocaleString()}`,
      );
    }
  }, ctx.formatter);
}
