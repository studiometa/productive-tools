import type { OutputFormat } from './types.js';

import { colors } from './utils/colors.js';
import { Spinner } from './utils/spinner.js';

export class OutputFormatter {
  constructor(
    private format: OutputFormat = 'human',
    private noColor: boolean = false,
    private quiet: boolean = false,
  ) {
    if (noColor) {
      // Colors are already handled by the colors module
    }
  }

  /**
   * Format output for display
   * AI agents should use format='json' for structured data
   * Humans get 'human' format with colors and formatting
   */
  output(data: unknown): void {
    switch (this.format) {
      case 'json':
        console.log(JSON.stringify(data, null, 2));
        break;
      case 'csv':
        this.outputCsv(data);
        break;
      case 'table':
        this.outputTable(data);
        break;
      case 'human':
      default:
        // Human format is handled by individual commands
        console.log(data);
        break;
    }
  }

  success(message: string): void {
    if (this.quiet) {
      return; // Suppress success messages in quiet mode
    }
    if (this.format === 'json') {
      console.log(JSON.stringify({ status: 'success', message }));
    } else {
      console.log(colors.green(`✓ ${message}`));
    }
  }

  /**
   * Output successful mutation result with data.
   * In quiet + JSON mode: output just the data
   * In regular JSON mode: output { status: 'success', ...data }
   * In other formats: use regular success message
   */
  successWithData(message: string, data: unknown): void {
    if (this.format === 'json') {
      if (this.quiet) {
        // In quiet mode, output just the data without wrapper
        console.log(JSON.stringify(data, null, 2));
      } else {
        // In regular JSON mode, include status wrapper
        const result =
          typeof data === 'object' && data !== null
            ? { status: 'success', ...data }
            : { status: 'success', data };
        console.log(JSON.stringify(result, null, 2));
      }
    } else {
      // For other formats, use regular success behavior
      this.success(message);
    }
  }

  error(message: string, details?: unknown): void {
    if (this.format === 'json') {
      console.error(JSON.stringify({ status: 'error', message, details }));
    } else {
      // In quiet mode, suppress emoji but still output to stderr
      const prefix = this.quiet ? '' : '✗ ';
      console.error(colors.red(`${prefix}${message}`));
      if (details) {
        console.error(details);
      }
    }
  }

  warning(message: string): void {
    if (this.quiet) {
      return; // Suppress warning messages in quiet mode
    }
    if (this.format === 'json') {
      console.log(JSON.stringify({ status: 'warning', message }));
    } else {
      console.log(colors.yellow(`⚠ ${message}`));
    }
  }

  info(message: string): void {
    if (this.quiet) {
      return; // Suppress info messages in quiet mode
    }
    if (this.format === 'json') {
      console.log(JSON.stringify({ status: 'info', message }));
    } else {
      console.log(colors.blue(message));
    }
  }

  private outputCsv(data: unknown): void {
    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]);
      console.log(headers.join(','));
      data.forEach((row) => {
        const values = headers.map((h) => {
          const val = row[h];
          return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
        });
        console.log(values.join(','));
      });
    }
  }

  private outputTable(data: unknown): void {
    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]);
      const colWidths = headers.map((h) => {
        const maxDataWidth = Math.max(...data.map((row) => String(row[h] || '').length));
        return Math.max(h.length, maxDataWidth);
      });

      // Header
      const headerRow = headers.map((h, i) => h.padEnd(colWidths[i])).join(' | ');
      console.log(headerRow);
      console.log(colWidths.map((w) => '-'.repeat(w)).join('-+-'));

      // Rows
      data.forEach((row) => {
        const rowStr = headers.map((h, i) => String(row[h] || '').padEnd(colWidths[i])).join(' | ');
        console.log(rowStr);
      });
    }
  }
}

/**
 * Create a spinner for long-running operations
 * Returns a no-op spinner for JSON format or quiet mode
 */
export function createSpinner(
  message: string,
  format: OutputFormat = 'human',
  quiet: boolean = false,
): Spinner {
  if (format === 'json' || quiet) {
    // No-op spinner for JSON output or quiet mode
    const noopSpinner = {
      start() {
        return this;
      },
      succeed() {
        return this;
      },
      fail() {
        return this;
      },
      stop() {
        return this;
      },
      setText() {
        return this;
      },
    } as unknown as Spinner;
    return noopSpinner;
  }

  return new Spinner(message);
}
