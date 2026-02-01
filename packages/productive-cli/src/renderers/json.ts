/**
 * JSON renderer
 *
 * Outputs data as formatted JSON. This is the preferred format for
 * AI agents and programmatic consumption.
 */

import type { GenericRenderer, RenderContext } from './types.js';

/**
 * JSON renderer - outputs pretty-printed JSON
 */
export class JsonRenderer implements GenericRenderer {
  render(data: unknown, _ctx: RenderContext): void {
    console.log(JSON.stringify(data, null, 2));
  }
}

/**
 * Singleton instance for convenience
 */
export const jsonRenderer = new JsonRenderer();
