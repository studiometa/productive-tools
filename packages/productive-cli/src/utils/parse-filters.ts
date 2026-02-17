/**
 * Parse a comma-separated filter string into key-value pairs.
 *
 * @example
 * ```typescript
 * parseFilters('status=open,project_id=123')
 * // → { status: 'open', project_id: '123' }
 * ```
 */
export function parseFilters(filterString: string): Record<string, string> {
  const filters: Record<string, string> = {};
  if (!filterString) return filters;
  filterString.split(',').forEach((pair) => {
    const [key, value] = pair.split('=');
    if (key && value) filters[key.trim()] = value.trim();
  });
  return filters;
}
