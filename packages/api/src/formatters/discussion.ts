/**
 * Formatter for Discussion resources
 */

import type { JsonApiResource, FormatOptions } from './types.js';

import { stripHtml } from '../utils/html.js';
import { DEFAULT_FORMAT_OPTIONS } from './types.js';

const STATUS_LABELS: Record<number, string> = {
  1: 'active',
  2: 'resolved',
};

export interface FormattedDiscussion {
  [key: string]: unknown;
  id: string;
  title: string | null;
  body: string | null;
  status: string;
  status_id: number;
  resolved_at: string | null;
  page_id?: string;
  creator_id?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Format a Discussion resource for output
 */
export function formatDiscussion(
  discussion: JsonApiResource,
  options?: FormatOptions,
): FormattedDiscussion {
  const opts = { ...DEFAULT_FORMAT_OPTIONS, ...options };
  const attrs = discussion.attributes;

  const bodyRaw = attrs.body as string | null | undefined;
  const body = opts.stripHtml ? stripHtml(bodyRaw) || null : bodyRaw || null;

  const statusId = (attrs.status as number) || 1;

  const result: FormattedDiscussion = {
    id: discussion.id,
    title: (attrs.title as string) || null,
    body,
    status: STATUS_LABELS[statusId] || 'unknown',
    status_id: statusId,
    resolved_at: (attrs.resolved_at as string) || null,
  };

  if (opts.includeRelationshipIds) {
    result.page_id = discussion.relationships?.page?.data?.id;
    result.creator_id = discussion.relationships?.creator?.data?.id;
  }

  if (opts.includeTimestamps) {
    result.created_at = attrs.created_at ? String(attrs.created_at) : undefined;
    result.updated_at = attrs.updated_at ? String(attrs.updated_at) : undefined;
  }

  return result;
}
