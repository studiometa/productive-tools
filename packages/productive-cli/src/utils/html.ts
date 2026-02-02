/**
 * HTML text utilities for cleaning up API responses
 */

import { isColorEnabled, colors } from './colors.js';

// URL regex pattern
const URL_REGEX = /https?:\/\/[^\s<>"']+/g;

/**
 * Create a clickable terminal hyperlink using OSC 8 escape sequence
 * Falls back to plain text if colors/terminal features are disabled
 * Supported by: iTerm2, WezTerm, Windows Terminal, Konsole, etc.
 */
export function link(text: string, url: string): string {
  if (!isColorEnabled()) return text;
  // OSC 8 hyperlink format: \e]8;;URL\e\\TEXT\e]8;;\e\\
  const underlinedText = colors.underline(text);
  return `\x1b]8;;${url}\x1b\\${underlinedText}\x1b]8;;\x1b\\`;
}

/**
 * Extract links from HTML anchor tags
 * Returns a map of placeholder -> {url, text}
 */
function extractLinks(html: string): {
  text: string;
  links: Map<string, { url: string; text: string }>;
} {
  const links = new Map<string, { url: string; text: string }>();
  let index = 0;

  // Extract <a> tags and replace with placeholders
  const text = html.replace(
    /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi,
    (_, url, linkText) => {
      const placeholder = `__LINK_${index++}__`;
      links.set(placeholder, { url, text: linkText || url });
      return placeholder;
    },
  );

  return { text, links };
}

/**
 * Convert HTML to plain text for terminal display
 * - Converts <br>, <br/>, <br /> to newlines
 * - Converts </p>, </div>, </li> to newlines
 * - Extracts links and makes them clickable
 * - Strips all other HTML tags
 * - Decodes common HTML entities
 * - Trims and normalizes whitespace
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';

  // First extract links to preserve them
  const { text: htmlWithPlaceholders, links } = extractLinks(html);

  let text = htmlWithPlaceholders
    // Convert line-breaking tags to newlines
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr)>/gi, '\n')
    .replace(/<\/?(ul|ol)>/gi, '\n')
    // Convert list items to bullet points
    .replace(/<li[^>]*>/gi, '• ')
    // Strip remaining HTML tags (including images with data-uri)
    .replace(/<[^>]+>/g, '')
    // Decode common HTML entities
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    // Normalize whitespace
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Restore links as clickable terminal links
  for (const [placeholder, { url, text: linkText }] of links) {
    text = text.replace(placeholder, link(linkText, url));
  }

  // Also convert any remaining plain URLs to clickable links
  text = text.replace(URL_REGEX, (url) => {
    // Don't double-link if already processed (check for OSC 8 sequence)
    if (text.includes(`\x1b]8;;${url}`)) return url;
    return link(url, url);
  });

  return text;
}

/**
 * Truncate text to a maximum length, adding ellipsis if needed
 */
export function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}
