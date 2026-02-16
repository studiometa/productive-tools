/**
 * Convert HTML to plain text.
 * - Converts <br>, </p>, </div>, </li> to newlines
 * - Converts <li> to bullet points
 * - Strips all HTML tags
 * - Decodes common HTML entities
 * - Normalizes whitespace
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';

  return (
    html
      // Convert line-breaking tags to newlines
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|tr)>/gi, '\n')
      .replace(/<\/?(ul|ol)>/gi, '\n')
      // Convert list items to bullet points
      .replace(/<li[^>]*>/gi, '• ')
      // Extract link text from <a> tags
      .replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi, '$2 ($1)')
      // Strip remaining HTML tags
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
      .trim()
  );
}

/**
 * Truncate text to a maximum length, adding ellipsis if needed.
 */
export function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}
