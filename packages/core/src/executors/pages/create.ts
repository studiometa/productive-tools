import type { ProductivePage } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { CreatePageOptions } from './types.js';

export async function createPage(
  options: CreatePageOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductivePage>> {
  const projectId = await ctx.resolver.resolveValue(options.projectId, 'project');

  const response = await ctx.api.createPage({
    title: options.title,
    body: options.body,
    project_id: projectId,
    parent_page_id: options.parentPageId,
  });

  return { data: response.data };
}
