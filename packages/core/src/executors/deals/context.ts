/**
 * Get deal context executor.
 *
 * Fetches a deal with all related data in parallel:
 * - The deal itself
 * - Services
 * - Comments
 * - Time entries
 */

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { DealContextResult, GetDealContextOptions } from './types.js';

/** Maximum number of related items to fetch per category */
const MAX_RELATED_ITEMS = 20;

export async function getDealContext(
  options: GetDealContextOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<DealContextResult>> {
  // Resolve human-friendly ID first
  const resolvedId = await ctx.resolver.resolveValue(options.id, 'deal');

  // Fetch all related data in parallel
  const [dealResponse, servicesResponse, commentsResponse, timeEntriesResponse] = await Promise.all(
    [
      ctx.api.getDeal(resolvedId, {
        include: ['company', 'deal_status', 'responsible', 'project'],
      }),
      ctx.api.getServices({
        filter: { deal_id: resolvedId },
        perPage: MAX_RELATED_ITEMS,
      }),
      ctx.api.getComments({
        filter: { deal_id: resolvedId },
        perPage: MAX_RELATED_ITEMS,
        include: ['creator'],
      }),
      ctx.api.getTimeEntries({
        filter: { deal_id: resolvedId },
        perPage: MAX_RELATED_ITEMS,
        sort: '-date',
      }),
    ],
  );

  return {
    data: {
      deal: dealResponse.data,
      services: servicesResponse.data,
      comments: commentsResponse.data,
      time_entries: timeEntriesResponse.data,
    },
    included: [...(dealResponse.included ?? []), ...(commentsResponse.included ?? [])],
  };
}
