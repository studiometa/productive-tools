/**
 * Renderers module
 *
 * Provides format-specific output rendering for CLI data.
 * Renderers are responsible for presenting formatted data to users
 * in various formats (json, csv, table, human, kanban).
 *
 * @example
 * ```typescript
 * import { render, createRenderContext } from './renderers/index.js';
 *
 * const ctx = createRenderContext({ noColor: false });
 * render('time_entry', 'human', formattedData, ctx);
 * ```
 */

// Types
export type {
  OutputFormat,
  RenderContext,
  Renderer,
  ListRenderer,
  GenericRenderer,
  ResourceType,
} from './types.js';

export { createRenderContext } from './types.js';

// Registry
export {
  registerRenderer,
  getRenderer,
  render,
  hasRenderer,
  getFormatsForResource,
} from './registry.js';

// Base renderers
export { JsonRenderer, jsonRenderer } from './json.js';
export { CsvRenderer, csvRenderer } from './csv.js';
export { TableRenderer, tableRenderer } from './table.js';

// Human renderers
export * from './human/index.js';
