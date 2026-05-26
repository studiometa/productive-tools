/**
 * ScriptOutput implementation for productive run scripts.
 *
 * This module is compiled as a standalone bundle entry (`dist/script.js`) so
 * that the wrapper subprocess can import it via a `file://` URL without any
 * additional module-resolution setup in the user's project.
 */

import type { ScriptOutput, ScriptSpinner } from './types.js';

import { CsvRenderer } from '../renderers/csv.js';
import { TableRenderer } from '../renderers/table.js';
import { createRenderContext } from '../renderers/types.js';
import { colors } from '../utils/colors.js';
import { Spinner } from '../utils/spinner.js';

const tableRenderer = new TableRenderer();
const csvRenderer = new CsvRenderer();

/**
 * Create a ScriptOutput instance ready for use inside a run script.
 *
 * Colors are enabled unless the NO_COLOR environment variable is set.
 */
export function createScriptOutput(): ScriptOutput {
  const noColor = process.env.NO_COLOR !== undefined;
  const renderCtx = createRenderContext({ noColor });

  return {
    table(data: object[], opts?: { columns?: string[] }): void {
      let rows = data as Record<string, unknown>[];

      if (opts?.columns && opts.columns.length > 0) {
        rows = rows.map((row) => {
          const filtered: Record<string, unknown> = {};
          for (const col of opts.columns!) {
            filtered[col] = row[col];
          }
          return filtered;
        });
      }

      tableRenderer.render(rows, renderCtx);
    },

    json(data: unknown, opts?: { pretty?: boolean }): void {
      const indent = opts?.pretty === false ? undefined : 2;
      console.log(JSON.stringify(data, null, indent));
    },

    csv(data: object[], opts?: { columns?: string[] }): void {
      let rows = data as Record<string, unknown>[];

      if (opts?.columns && opts.columns.length > 0) {
        rows = rows.map((row) => {
          const filtered: Record<string, unknown> = {};
          for (const col of opts.columns!) {
            filtered[col] = row[col];
          }
          return filtered;
        });
      }

      csvRenderer.render(rows, renderCtx);
    },

    print(text: string): void {
      console.log(text);
    },

    success(message: string): void {
      console.log(colors.green(`✓ ${message}`));
    },

    error(message: string): void {
      console.error(colors.red(`✗ ${message}`));
    },

    warn(message: string): void {
      console.log(colors.yellow(`⚠ ${message}`));
    },

    info(message: string): void {
      console.log(colors.blue(message));
    },

    spinner(message: string): ScriptSpinner {
      const sp = new Spinner(message).start();

      return {
        update(msg: string): void {
          sp.setText(msg);
        },
        stop(msg?: string): void {
          if (msg) {
            sp.succeed(msg);
          } else {
            sp.stop();
          }
        },
        fail(msg: string): void {
          sp.fail(msg);
        },
      };
    },
  };
}
