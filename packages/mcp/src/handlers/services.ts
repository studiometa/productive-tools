/**
 * Services MCP handler.
 *
 * Uses the createResourceHandler factory for the common list pattern.
 */

import { listServices } from '@studiometa/productive-core';

import type { CommonArgs } from './types.js';

import { formatService } from '../formatters.js';
import { createResourceHandler } from './factory.js';

/**
 * Handle services resource.
 *
 * Supports: list
 */
export const handleServices = createResourceHandler<CommonArgs>({
  resource: 'services',
  actions: ['list'],
  formatter: formatService,
  executors: {
    list: listServices,
  },
});
