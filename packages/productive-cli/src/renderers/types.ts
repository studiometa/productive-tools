/**
 * Renderer types and interfaces
 *
 * Renderers are responsible for outputting formatted data to the console.
 * Each renderer handles a specific output format (json, csv, table, human, kanban).
 */

import type { FormattedPagination } from '../formatters/types.js';

/**
 * Supported output formats
 */
export type OutputFormat = 'json' | 'csv' | 'table' | 'human' | 'kanban';

/**
 * Context passed to renderers for configuration
 */
export interface RenderContext {
  /** Whether colors are disabled */
  noColor: boolean;
  /** Terminal width for layout calculations */
  terminalWidth: number;
}

/**
 * Create a render context with defaults
 */
export function createRenderContext(options: Partial<RenderContext> = {}): RenderContext {
  return {
    noColor: options.noColor ?? false,
    terminalWidth: options.terminalWidth ?? process.stdout.columns ?? 80,
  };
}

/**
 * Base renderer interface for single items
 */
export interface Renderer<T> {
  /**
   * Render data to stdout
   */
  render(data: T, ctx: RenderContext): void;
}

/**
 * Renderer interface for lists with pagination
 */
export interface ListRenderer<T> extends Renderer<{ data: T[]; meta?: FormattedPagination }> {
  /**
   * Render a single item (used internally)
   */
  renderItem?(item: T, ctx: RenderContext): void;

  /**
   * Render pagination info
   */
  renderPagination?(meta: FormattedPagination, ctx: RenderContext): void;
}

/**
 * Generic renderer that can handle any data shape
 */
export interface GenericRenderer {
  /**
   * Render any data structure
   */
  render(data: unknown, ctx: RenderContext): void;
}

/**
 * Resource types that have specific renderers
 */
export type ResourceType =
  | 'time_entry'
  | 'task'
  | 'project'
  | 'person'
  | 'service'
  | 'budget'
  | 'company'
  | 'comment'
  | 'timer'
  | 'deal'
  | 'booking';
