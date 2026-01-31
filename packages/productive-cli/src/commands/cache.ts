import { OutputFormatter } from "../output.js";
import { colors } from "../utils/colors.js";
import { getSqliteCache } from "../utils/sqlite-cache.js";
import { getCache } from "../utils/cache.js";
import { ProductiveApi } from "../api.js";
import { Spinner } from "../utils/spinner.js";
import type {
  OutputFormat,
  ProductiveProject,
  ProductivePerson,
  ProductiveService,
} from "../types.js";
import { handleError, runCommand } from "../error-handler.js";
import { ConfigError, CommandError } from "../errors.js";

export function showCacheHelp(subcommand?: string): void {
  if (subcommand === "status") {
    console.log(`
${colors.bold("productive cache status")} - Show cache statistics

${colors.bold("USAGE:")}
  productive cache status

${colors.bold("OPTIONS:")}
  -f, --format <fmt>  Output format: json, human

${colors.bold("EXAMPLES:")}
  productive cache status
  productive cache status --format json
`);
  } else if (subcommand === "clear") {
    console.log(`
${colors.bold("productive cache clear")} - Clear cached data

${colors.bold("USAGE:")}
  productive cache clear [pattern]

${colors.bold("ARGUMENTS:")}
  [pattern]           Optional: clear only matching endpoints (e.g., "projects", "time")

${colors.bold("EXAMPLES:")}
  productive cache clear              # Clear all cache
  productive cache clear projects     # Clear only projects cache
  productive cache clear time         # Clear only time entries cache
`);
  } else if (subcommand === "sync") {
    console.log(`
${colors.bold("productive cache sync")} - Sync reference data to local cache

${colors.bold("USAGE:")}
  productive cache sync [options]

${colors.bold("DESCRIPTION:")}
  Fetches and caches reference data (projects, people, services) locally
  for fast offline search and autocomplete.

${colors.bold("OPTIONS:")}
  -f, --format <fmt>  Output format: json, human

${colors.bold("EXAMPLES:")}
  productive cache sync
  productive cache sync --format json
`);
  } else if (subcommand === "queue") {
    console.log(`
${colors.bold("productive cache queue")} - Manage background refresh queue

${colors.bold("USAGE:")}
  productive cache queue [options]

${colors.bold("DESCRIPTION:")}
  Shows and manages the background refresh queue. Stale cache entries are
  automatically queued for refresh and processed on the next CLI invocation.

${colors.bold("OPTIONS:")}
  -f, --format <fmt>  Output format: json, human
  --clear             Clear all pending refresh jobs

${colors.bold("EXAMPLES:")}
  productive cache queue              # Show queue status
  productive cache queue --clear      # Clear the queue
  productive cache queue --format json
`);
  } else {
    console.log(`
${colors.bold("productive cache")} - Manage CLI cache

${colors.bold("USAGE:")}
  productive cache <subcommand> [options]

${colors.bold("SUBCOMMANDS:")}
  status              Show cache statistics
  clear [pattern]     Clear cached data
  sync                Sync reference data to local cache
  queue               Manage background refresh queue

${colors.bold("CACHE BEHAVIOR:")}
  - GET requests are cached automatically
  - Write operations (create, update, delete) invalidate related cache
  - Different TTLs per data type:
    • Projects, People, Services: 1 hour
    • Time entries: 5 minutes
    • Tasks, Budgets: 15 minutes

${colors.bold("GLOBAL OPTIONS:")}
  --no-cache          Bypass cache for a single command
  --refresh           Force refresh (fetch fresh data, update cache)

${colors.bold("EXAMPLES:")}
  productive cache status
  productive cache clear
  productive projects list --no-cache
  productive time list --refresh

Run ${colors.cyan("productive cache <subcommand> --help")} for subcommand details.
`);
  }
}

export async function handleCacheCommand(
  subcommand: string,
  args: string[],
  options: Record<string, string | boolean>,
): Promise<void> {
  const format = (options.format || options.f || "human") as OutputFormat;
  const formatter = new OutputFormatter(format, options["no-color"] === true);

  await runCommand(async () => {
    switch (subcommand) {
      case "status":
        await cacheStatus(formatter, options);
        break;
      case "clear":
        await cacheClear(args, formatter, options);
        break;
      case "sync":
        await cacheSync(formatter, options);
        break;
      case "queue":
        await cacheQueue(formatter, options);
        break;
      default:
        throw CommandError.unknownSubcommand("cache", subcommand);
    }
  }, formatter);
}

async function cacheStatus(
  formatter: OutputFormatter,
  options: Record<string, string | boolean>,
): Promise<void> {
  const orgId = (options["org-id"] as string) || process.env.PRODUCTIVE_ORG_ID;

  if (!orgId) {
    throw ConfigError.missingOrganizationId();
  }

  const sqliteCache = getSqliteCache(orgId);

  try {
    const queryStats = await sqliteCache.cacheStats();
    const refStats = await sqliteCache.getStats();
    const queueCount = await sqliteCache.getRefreshQueueCount();

    if (formatter["format"] === "json") {
      formatter.output({
        query_cache: {
          entries: queryStats.entries,
          size_bytes: queryStats.size,
          size_human: formatBytes(queryStats.size),
          oldest_age_seconds: queryStats.oldestAge,
          oldest_age_human: formatDuration(queryStats.oldestAge),
        },
        reference_cache: {
          projects: refStats.projects,
          people: refStats.people,
          services: refStats.services,
        },
        refresh_queue: {
          pending_jobs: queueCount,
        },
        database: {
          size_bytes: refStats.dbSize,
          size_human: formatBytes(refStats.dbSize),
          location: `~/.cache/productive-cli/productive-${orgId}.db`,
        },
      });
    } else {
      console.log(colors.bold("Cache Statistics"));
      console.log(colors.dim("─".repeat(60)));

      console.log(colors.bold("\nQuery Cache (API Responses):"));
      console.log(colors.cyan("  Entries:"), queryStats.entries);
      console.log(colors.cyan("  Size:"), formatBytes(queryStats.size));
      if (queryStats.entries > 0) {
        console.log(
          colors.cyan("  Oldest entry:"),
          formatDuration(queryStats.oldestAge) + " ago",
        );
      }

      console.log(colors.bold("\nReference Cache (Synced Data):"));
      console.log(colors.cyan("  Projects:"), refStats.projects);
      console.log(colors.cyan("  People:"), refStats.people);
      console.log(colors.cyan("  Services:"), refStats.services);

      console.log(colors.bold("\nRefresh Queue:"));
      console.log(colors.cyan("  Pending jobs:"), queueCount);
      if (queueCount > 0) {
        console.log(colors.dim("  (will be processed on next CLI invocation)"));
      }

      console.log(colors.bold("\nDatabase:"));
      console.log(colors.cyan("  Total size:"), formatBytes(refStats.dbSize));
      console.log(
        colors.dim(
          `  Location: ~/.cache/productive-cli/productive-${orgId}.db`,
        ),
      );
      console.log();
    }
  } finally {
    sqliteCache.close();
  }
}

async function cacheClear(
  args: string[],
  formatter: OutputFormatter,
  options: Record<string, string | boolean>,
): Promise<void> {
  const orgId = (options["org-id"] as string) || process.env.PRODUCTIVE_ORG_ID;

  if (!orgId) {
    throw ConfigError.missingOrganizationId();
  }

  const sqliteCache = getSqliteCache(orgId);
  const pattern = args[0];

  try {
    if (pattern) {
      const deleted = await sqliteCache.cacheInvalidate(pattern);
      formatter.success(
        `Cache cleared for pattern: ${pattern} (${deleted} entries removed)`,
      );
    } else {
      await sqliteCache.clear();
      formatter.success("All cache cleared");
    }
  } finally {
    sqliteCache.close();
  }
}

async function cacheSync(
  formatter: OutputFormatter,
  options: Record<string, string | boolean>,
): Promise<void> {
  const spinner = new Spinner();

  try {
    const api = new ProductiveApi(options);
    const orgId =
      (options["org-id"] as string) || process.env.PRODUCTIVE_ORG_ID;

    if (!orgId) {
      throw ConfigError.missingOrganizationId();
    }

    const sqliteCache = getSqliteCache(orgId);

    // Sync projects
    spinner.setText("Syncing projects...");
    spinner.start();
    let allProjects: ProductiveProject[] = [];
    let page = 1;
    while (true) {
      const response = await api.getProjects({ page, perPage: 200 });
      allProjects.push(...response.data);
      const totalPages = response.meta?.total_pages ?? 1;
      if (page >= totalPages) break;
      page++;
      spinner.setText(`Syncing projects... (page ${page}/${totalPages})`);
    }
    await sqliteCache.upsertProjects(allProjects);
    spinner.succeed(`Synced ${allProjects.length} projects`);

    // Sync people
    spinner.setText("Syncing people...");
    spinner.start();
    let allPeople: ProductivePerson[] = [];
    page = 1;
    while (true) {
      const response = await api.getPeople({ page, perPage: 200 });
      allPeople.push(...response.data);
      const totalPages = response.meta?.total_pages ?? 1;
      if (page >= totalPages) break;
      page++;
      spinner.setText(`Syncing people... (page ${page}/${totalPages})`);
    }
    await sqliteCache.upsertPeople(allPeople);
    spinner.succeed(`Synced ${allPeople.length} people`);

    // Sync services
    spinner.setText("Syncing services...");
    spinner.start();
    let allServices: ProductiveService[] = [];
    page = 1;
    while (true) {
      const response = await api.getServices({ page, perPage: 200 });
      allServices.push(...response.data);
      const totalPages = response.meta?.total_pages ?? 1;
      if (page >= totalPages) break;
      page++;
      spinner.setText(`Syncing services... (page ${page}/${totalPages})`);
    }
    await sqliteCache.upsertServices(allServices);
    spinner.succeed(`Synced ${allServices.length} services`);

    const stats = await sqliteCache.getStats();
    sqliteCache.close();

    if (formatter["format"] === "json") {
      formatter.output({
        success: true,
        synced: {
          projects: allProjects.length,
          people: allPeople.length,
          services: allServices.length,
        },
        cache_size: stats.dbSize,
      });
    } else {
      console.log();
      console.log(colors.green("✓"), "Cache sync completed");
      console.log(colors.dim(`  Database size: ${formatBytes(stats.dbSize)}`));
    }
  } catch (error: any) {
    spinner.fail("Cache sync failed");
    throw error;
  }
}

async function cacheQueue(
  formatter: OutputFormatter,
  options: Record<string, string | boolean>,
): Promise<void> {
  const orgId = (options["org-id"] as string) || process.env.PRODUCTIVE_ORG_ID;

  if (!orgId) {
    throw ConfigError.missingOrganizationId();
  }

  const cache = getCache();
  cache.setOrgId(orgId);

  // Handle --clear flag
  if (options.clear) {
    const cleared = await cache.clearRefreshQueueAsync();
    if (formatter["format"] === "json") {
      formatter.output({ success: true, cleared });
    } else {
      formatter.success(`Cleared ${cleared} pending refresh job(s)`);
    }
    return;
  }

  // Show queue status
  const jobs = await cache.getPendingRefreshJobsAsync();

  if (formatter["format"] === "json") {
    formatter.output({
      pending_jobs: jobs.length,
      jobs: jobs.map((job) => ({
        cache_key: job.cacheKey,
        endpoint: job.endpoint,
        params: job.params,
        queued_at: new Date(job.queuedAt).toISOString(),
        age_seconds: Math.round((Date.now() - job.queuedAt) / 1000),
      })),
    });
  } else {
    console.log(colors.bold("Refresh Queue"));
    console.log(colors.dim("─".repeat(60)));

    if (jobs.length === 0) {
      console.log(colors.dim("\nNo pending refresh jobs."));
    } else {
      console.log(colors.cyan(`\n${jobs.length} pending job(s):\n`));

      for (const job of jobs) {
        const ageSeconds = Math.round((Date.now() - job.queuedAt) / 1000);
        console.log(colors.bold(`  ${job.endpoint}`));
        console.log(colors.dim(`    Key: ${job.cacheKey}`));
        console.log(
          colors.dim(`    Queued: ${formatDuration(ageSeconds)} ago`),
        );
        if (Object.keys(job.params).length > 0) {
          console.log(colors.dim(`    Params: ${JSON.stringify(job.params)}`));
        }
        console.log();
      }

      console.log(colors.dim("Jobs will be processed on next CLI invocation."));
      console.log(
        colors.dim(
          `Run ${colors.cyan("productive cache queue --clear")} to clear the queue.`,
        ),
      );
    }
    console.log();
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
