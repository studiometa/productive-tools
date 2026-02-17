import type { ProductivePage } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { UpdatePageOptions } from './types.js';

import { ExecutorValidationError } from '../errors.js';

export async function updatePage(
  options: UpdatePageOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductivePage>> {
  const data: Record<string, string | undefined> = {};

  if (options.title !== undefined) data.title = options.title;
  if (options.body !== undefined) data.body = options.body;

  if (Object.keys(data).length === 0) {
    throw new ExecutorValidationError(
      'No updates specified. Provide at least one field to update',
      'options',
    );
  }

  const response = await ctx.api.updatePage(options.id, data);
  return { data: response.data };
}
