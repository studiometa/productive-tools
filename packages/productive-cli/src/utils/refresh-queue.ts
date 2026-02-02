/**
 * Background refresh queue processor.
 * Processes stale cache entries queued for refresh on previous CLI invocations.
 */

import { getConfig } from '../config.js';
import { getCache } from './cache.js';

interface RefreshResult {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
}

/**
 * Process pending refresh jobs from the queue.
 * This should be called at CLI startup to refresh stale cache entries.
 *
 * @param options - CLI options containing auth credentials
 * @param maxJobs - Maximum number of jobs to process (default: 10)
 * @returns Result summary
 */
export async function processRefreshQueue(
  options: Record<string, string | boolean> = {},
  maxJobs = 10,
): Promise<RefreshResult> {
  const result: RefreshResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
  };

  // Check if cache is enabled
  if (options['no-cache']) {
    return result;
  }

  // Get config to check if we have valid credentials
  let config;
  try {
    config = getConfig(options);
  } catch {
    // No valid config, skip refresh
    return result;
  }

  if (!config.apiToken || !config.organizationId) {
    return result;
  }

  const cache = getCache();
  cache.setOrgId(config.organizationId);

  // Get pending jobs
  const jobs = await cache.getPendingRefreshJobsAsync();

  if (jobs.length === 0) {
    return result;
  }

  // Limit number of jobs to process
  const jobsToProcess = jobs.slice(0, maxJobs);

  // Process each job
  for (const job of jobsToProcess) {
    result.processed++;

    try {
      // Build the URL with query params
      const baseUrl = config.baseUrl || 'https://api.productive.io/api/v2';
      const url = new URL(`${baseUrl}${job.endpoint}`);

      // Add query params
      for (const [key, value] of Object.entries(job.params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      }

      // Make the API request
      const response = await globalThis.fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          'X-Auth-Token': config.apiToken,
          'X-Organization-Id': config.organizationId,
        },
      });

      if (!response.ok) {
        result.failed++;
        // Remove from queue even on failure to avoid retrying forever
        await cache.dequeueRefreshAsync(job.cacheKey);
        continue;
      }

      const data = await response.json();

      // Update cache with fresh data
      await cache.setAsync(job.endpoint, job.params, config.organizationId, data);

      result.succeeded++;
    } catch {
      result.failed++;
      // Remove from queue to avoid retrying forever
      await cache.dequeueRefreshAsync(job.cacheKey);
    }
  }

  // If there were more jobs than we processed, note how many were skipped
  result.skipped = Math.max(0, jobs.length - maxJobs);

  return result;
}

/**
 * Get the number of pending refresh jobs.
 */
export async function getRefreshQueueCount(
  options: Record<string, string | boolean> = {},
): Promise<number> {
  if (options['no-cache']) {
    return 0;
  }

  let config;
  try {
    config = getConfig(options);
  } catch {
    return 0;
  }

  if (!config.organizationId) {
    return 0;
  }

  const cache = getCache();
  cache.setOrgId(config.organizationId);

  return cache.getRefreshQueueCountAsync();
}
