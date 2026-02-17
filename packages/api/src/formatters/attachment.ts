/**
 * Formatter for Attachment resources
 */

import type { JsonApiResource, FormatOptions } from './types.js';

import { DEFAULT_FORMAT_OPTIONS } from './types.js';

export interface FormattedAttachment {
  [key: string]: unknown;
  id: string;
  name: string;
  content_type: string;
  size: number;
  size_human: string;
  url: string;
  attachable_type?: string;
  created_at?: string;
}

/**
 * Format bytes into human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${Number(value.toFixed(i === 0 ? 0 : 1))} ${units[i]}`;
}

/**
 * Format an Attachment resource for output
 */
export function formatAttachment(
  attachment: JsonApiResource,
  options?: FormatOptions,
): FormattedAttachment {
  const opts = { ...DEFAULT_FORMAT_OPTIONS, ...options };
  const attrs = attachment.attributes;

  const size = Number(attrs.size) || 0;

  const result: FormattedAttachment = {
    id: attachment.id,
    name: String(attrs.name || ''),
    content_type: String(attrs.content_type || ''),
    size,
    size_human: formatBytes(size),
    url: String(attrs.url || ''),
  };

  if (attrs.attachable_type) {
    result.attachable_type = String(attrs.attachable_type);
  }

  if (opts.includeTimestamps) {
    result.created_at = attrs.created_at ? String(attrs.created_at) : undefined;
  }

  return result;
}
