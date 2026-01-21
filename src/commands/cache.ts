import { OutputFormatter } from "../output.js";
import { colors } from "../utils/colors.js";
import { getSqliteCache } from "../utils/sqlite-cache.js";
import { ProductiveApi } from "../api.js";
import { Spinner } from "../utils/spinner.js";
import type { OutputFormat } from "../types.js";

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
  } else {
    console.log(`
${colors.bold("productive cache")} - Manage CLI cache

${colors.bold("USAGE:")}
  productive cache <subcommand> [options]

${colors.bold("SUBCOMMANDS:")}
  status              Show cache statistics
  clear [pattern]     Clear cached data
  sync                Sync reference data to local cache

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

export function handleCacheCommand(
  subcommand: string,
  args: string[],
  options: Record<string, string | boolean>,
): void {
  const format = (options.format || options.f || "human") as OutputFormat;
  const formatter = new OutputFormatter(format, options["no-color"] === true);

  const handleError = (error: Error) => {
    formatter.error(error.message);
    process.exit(1);
  };

  switch (subcommand) {
    case "status":
      cacheStatus(formatter, options).catch(handleError);
      break;
    case "clear":
      cacheClear(args, formatter, options).catch(handleError);
      break;
    case "sync":
      cacheSync(formatter, options).catch(handleError);
      break;
    default:
      formatter.error(`Unknown cache subcommand: ${subcommand}`);
      console.log(
        `Run ${colors.cyan("productive cache --help")} for usage information`,
      );
      process.exit(1);
  }
}

async function cacheStatus(
  formatter: OutputFormatter,
  options: Record<string, string | boolean>,
): Promise<void> {
  const orgId = (options["org-id"] as string) || process.env.PRODUCTIVE_ORG_ID;

  if (!orgId) {
    formatter.error(
      "Organization ID required. Set via --org-id or PRODUCTIVE_ORG_ID",
    );
    process.exit(1);
  }

  const sqliteCache = getSqliteCache(orgId);

  try {
    const queryStats = await sqliteCache.cacheStats();
    const refStats = await sqliteCache.getStats();

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
    formatter.error(
      "Organization ID required. Set via --org-id or PRODUCTIVE_ORG_ID",
    );
    process.exit(1);
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
      throw new Error(
        "Organization ID required. Set via --org-id or PRODUCTIVE_ORG_ID",
      );
    }

    const sqliteCache = getSqliteCache(orgId);

    // Sync projects
    spinner.start("Syncing projects...");
    let allProjects: any[] = [];
    let page = 1;
    while (true) {
      const response = await api.getProjects({ page, perPage: 200 });
      allProjects.push(...response.data);
      if (page >= response.meta.total_pages) break;
      page++;
      spinner.update(
        `Syncing projects... (page ${page}/${response.meta.total_pages})`,
      );
    }
    await sqliteCache.upsertProjects(allProjects);
    spinner.succeed(`Synced ${allProjects.length} projects`);

    // Sync people
    spinner.start("Syncing people...");
    let allPeople: any[] = [];
    page = 1;
    while (true) {
      const response = await api.getPeople({ page, perPage: 200 });
      allPeople.push(...response.data);
      if (page >= response.meta.total_pages) break;
      page++;
      spinner.update(
        `Syncing people... (page ${page}/${response.meta.total_pages})`,
      );
    }
    await sqliteCache.upsertPeople(allPeople);
    spinner.succeed(`Synced ${allPeople.length} people`);

    // Sync services
    spinner.start("Syncing services...");
    let allServices: any[] = [];
    page = 1;
    while (true) {
      const response = await api.getServices({ page, perPage: 200 });
      allServices.push(...response.data);
      if (page >= response.meta.total_pages) break;
      page++;
      spinner.update(
        `Syncing services... (page ${page}/${response.meta.total_pages})`,
      );
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
