import { OutputFormatter } from "../output.js";
import { colors } from "../utils/colors.js";
import { getCache } from "../utils/cache.js";
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

  switch (subcommand) {
    case "status":
      cacheStatus(formatter, options);
      break;
    case "clear":
      cacheClear(args, formatter, options);
      break;
    case "sync":
      cacheSync(formatter, options).catch((error) => {
        formatter.error(error.message);
        process.exit(1);
      });
      break;
    default:
      formatter.error(`Unknown cache subcommand: ${subcommand}`);
      console.log(
        `Run ${colors.cyan("productive cache --help")} for usage information`,
      );
      process.exit(1);
  }
}

function cacheStatus(
  formatter: OutputFormatter,
  options: Record<string, string | boolean>,
): void {
  const fileCache = getCache();
  const fileStats = fileCache.stats();

  if (formatter["format"] === "json") {
    const output: any = {
      file_cache: {
        entries: fileStats.entries,
        size_bytes: fileStats.size,
        size_human: formatBytes(fileStats.size),
        oldest_age_seconds: fileStats.oldestAge,
        oldest_age_human: formatDuration(fileStats.oldestAge),
      },
    };

    // Add SQLite cache stats if available
    try {
      const orgId =
        (options["org-id"] as string) || process.env.PRODUCTIVE_ORG_ID;
      if (orgId) {
        const sqliteCache = getSqliteCache(orgId);
        sqliteCache.getStats().then((sqliteStats) => {
          output.sqlite_cache = {
            projects: sqliteStats.projects,
            people: sqliteStats.people,
            services: sqliteStats.services,
            size_bytes: sqliteStats.dbSize,
            size_human: formatBytes(sqliteStats.dbSize),
          };
          formatter.output(output);
          sqliteCache.close();
        });
        return;
      }
    } catch {
      // SQLite cache not available
    }

    formatter.output(output);
  } else {
    console.log(colors.bold("Cache Statistics"));
    console.log(colors.dim("─".repeat(60)));

    console.log(colors.bold("\nFile Cache (API Queries):"));
    console.log(colors.cyan("  Entries:"), fileStats.entries);
    console.log(colors.cyan("  Size:"), formatBytes(fileStats.size));
    if (fileStats.entries > 0) {
      console.log(
        colors.cyan("  Oldest entry:"),
        formatDuration(fileStats.oldestAge) + " ago",
      );
    }
    console.log(colors.dim("  Location: ~/.cache/productive-cli/queries/"));

    // Add SQLite cache stats if available
    try {
      const orgId =
        (options["org-id"] as string) || process.env.PRODUCTIVE_ORG_ID;
      if (orgId) {
        const sqliteCache = getSqliteCache(orgId);
        sqliteCache.getStats().then((sqliteStats) => {
          console.log(colors.bold("\nSQLite Cache (Reference Data):"));
          console.log(colors.cyan("  Projects:"), sqliteStats.projects);
          console.log(colors.cyan("  People:"), sqliteStats.people);
          console.log(colors.cyan("  Services:"), sqliteStats.services);
          console.log(colors.cyan("  Size:"), formatBytes(sqliteStats.dbSize));
          console.log(
            colors.dim(
              `  Location: ~/.cache/productive-cli/productive-${orgId}.db`,
            ),
          );
          console.log();
          sqliteCache.close();
        });
        return;
      }
    } catch {
      // SQLite cache not available
    }

    console.log();
  }
}

function cacheClear(
  args: string[],
  formatter: OutputFormatter,
  options: Record<string, string | boolean>,
): void {
  const fileCache = getCache();
  const pattern = args[0];

  if (pattern) {
    fileCache.invalidate(pattern);
    formatter.success(`File cache cleared for pattern: ${pattern}`);
  } else {
    fileCache.clear();

    // Also clear SQLite cache if available
    try {
      const orgId =
        (options["org-id"] as string) || process.env.PRODUCTIVE_ORG_ID;
      if (orgId) {
        const sqliteCache = getSqliteCache(orgId);
        sqliteCache.clear().then(() => {
          sqliteCache.close();
          formatter.success("All caches cleared (file + SQLite)");
        });
        return;
      }
    } catch {
      // SQLite cache not available
    }

    formatter.success("File cache cleared");
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
