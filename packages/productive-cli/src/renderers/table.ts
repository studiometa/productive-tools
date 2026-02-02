/**
 * Table renderer
 *
 * Outputs data as an ASCII table with aligned columns.
 * Good for human viewing in terminals.
 */

import type { GenericRenderer, RenderContext } from './types.js';

/**
 * Table renderer - outputs data as formatted ASCII table
 */
export class TableRenderer implements GenericRenderer {
  render(data: unknown, ctx: RenderContext): void {
    if (!Array.isArray(data)) {
      // For single objects, wrap in array
      if (data && typeof data === 'object' && 'data' in data) {
        const listData = (data as { data: unknown }).data;
        if (Array.isArray(listData)) {
          this.renderArray(listData, ctx);
          return;
        }
      }
      // Single object - output as single row
      if (data && typeof data === 'object') {
        this.renderArray([data as Record<string, unknown>], ctx);
        return;
      }
      console.log(String(data));
      return;
    }

    this.renderArray(data, ctx);
  }

  private renderArray(data: Record<string, unknown>[], _ctx: RenderContext): void {
    if (data.length === 0) {
      return;
    }

    // Get headers from first item
    const headers = Object.keys(data[0]);

    // Calculate column widths
    const colWidths = headers.map((header) => {
      const maxDataWidth = Math.max(...data.map((row) => String(row[header] ?? '').length));
      return Math.max(header.length, maxDataWidth);
    });

    // Output header row
    const headerRow = headers.map((h, i) => h.padEnd(colWidths[i])).join(' | ');
    console.log(headerRow);

    // Output separator
    console.log(colWidths.map((w) => '-'.repeat(w)).join('-+-'));

    // Output data rows
    for (const row of data) {
      const rowStr = headers.map((h, i) => String(row[h] ?? '').padEnd(colWidths[i])).join(' | ');
      console.log(rowStr);
    }
  }
}

/**
 * Singleton instance for convenience
 */
export const tableRenderer = new TableRenderer();
