/**
 * Formatter for Page resources
 */

import type { JsonApiResource, FormatOptions } from './types.js';

import { stripHtml } from '../utils/html.js';
import { DEFAULT_FORMAT_OPTIONS } from './types.js';

export interface FormattedPage {
  [key: string]: unknown;
  id: string;
  title: string;
  body: string | null;
  public: boolean;
  version_number?: number;
  parent_page_id?: string;
  project_id?: string;
  creator_id?: string;
  created_at?: string;
  updated_at?: string;
  edited_at?: string;
}

/**
 * Format a Page resource for output
 */
export function formatPage(page: JsonApiResource, options?: FormatOptions): FormattedPage {
  const opts = { ...DEFAULT_FORMAT_OPTIONS, ...options };
  const attrs = page.attributes;

  const bodyRaw = attrs.body as string | null | undefined;
  const body = opts.stripHtml ? stripHtml(bodyRaw) || null : bodyRaw || null;

  const result: FormattedPage = {
    id: page.id,
    title: (attrs.title as string) || 'Untitled',
    body,
    public: Boolean(attrs.public),
  };

  if (attrs.version_number !== undefined) {
    result.version_number = attrs.version_number as number;
  }

  if (opts.includeRelationshipIds) {
    result.project_id = page.relationships?.project?.data?.id;
    result.creator_id = page.relationships?.creator?.data?.id;
    result.parent_page_id = page.relationships?.parent_page?.data?.id;
  }

  if (opts.includeTimestamps) {
    result.created_at = attrs.created_at ? String(attrs.created_at) : undefined;
    result.updated_at = attrs.updated_at ? String(attrs.updated_at) : undefined;
    result.edited_at = attrs.edited_at ? String(attrs.edited_at) : undefined;
  }

  return result;
}
