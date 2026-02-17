/**
 * Formatter for Comment resources
 */

import type { JsonApiResource, FormatOptions } from './types.js';

import { stripHtml } from '../utils/html.js';
import { DEFAULT_FORMAT_OPTIONS } from './types.js';

export interface FormattedComment {
  [key: string]: unknown;
  id: string;
  body: string;
  commentable_type: string;
  draft: boolean;
  pinned: boolean;
  hidden: boolean;
  creator_id?: string;
  creator_name?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get included resource by type and id
 */
function getIncludedResource(
  included: JsonApiResource[] | undefined,
  type: string,
  id: string | undefined,
): Record<string, unknown> | undefined {
  if (!included || !id) return undefined;
  return included.find((r) => r.type === type && r.id === id)?.attributes;
}

/**
 * Format a Comment resource for output
 */
export function formatComment(comment: JsonApiResource, options?: FormatOptions): FormattedComment {
  const opts = { ...DEFAULT_FORMAT_OPTIONS, ...options };
  const attrs = comment.attributes;

  // Get creator info from includes
  const creatorId = comment.relationships?.creator?.data?.id;
  const creatorData = getIncludedResource(opts.included, 'people', creatorId);

  const result: FormattedComment = {
    id: comment.id,
    body: opts.stripHtml ? stripHtml(String(attrs.body || '')) : String(attrs.body || ''),
    commentable_type: String(attrs.commentable_type || ''),
    draft: Boolean(attrs.draft),
    pinned: !!attrs.pinned_at,
    hidden: Boolean(attrs.hidden),
  };

  if (opts.includeRelationshipIds && creatorId) {
    result.creator_id = creatorId;
  }

  if (creatorData) {
    result.creator_name = `${creatorData.first_name} ${creatorData.last_name}`;
  }

  if (opts.includeTimestamps) {
    result.created_at = attrs.created_at ? String(attrs.created_at) : undefined;
    result.updated_at = attrs.updated_at ? String(attrs.updated_at) : undefined;
  }

  return result;
}
