/**
 * CSV renderer
 *
 * Outputs data as comma-separated values for spreadsheet import
 * or data processing pipelines.
 */

import type { GenericRenderer, RenderContext } from './types.js';

/**
 * Escape a value for CSV output
 */
function escapeValue(val: unknown): string {
  const str = String(val ?? '');
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * CSV renderer - outputs data as comma-separated values
 */
export class CsvRenderer implements GenericRenderer {
  render(data: unknown, _ctx: RenderContext): void {
    if (!Array.isArray(data)) {
      // For single objects, wrap in array
      if (data && typeof data === 'object' && 'data' in data) {
        const listData = (data as { data: unknown }).data;
        if (Array.isArray(listData)) {
          this.renderArray(listData);
          return;
        }
      }
      // Single object - output as single row
      if (data && typeof data === 'object') {
        this.renderArray([data as Record<string, unknown>]);
        return;
      }
      console.log(String(data));
      return;
    }

    this.renderArray(data);
  }

  private renderArray(data: Record<string, unknown>[]): void {
    if (data.length === 0) {
      return;
    }

    // Get headers from first item
    const headers = Object.keys(data[0]);
    console.log(headers.join(','));

    // Output rows
    for (const row of data) {
      const values = headers.map((h) => escapeValue(row[h]));
      console.log(values.join(','));
    }
  }
}

/**
 * Singleton instance for convenience
 */
export const csvRenderer = new CsvRenderer();
