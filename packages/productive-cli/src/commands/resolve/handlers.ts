/**
 * Handler implementations for resolve command
 */

import type { ResolvableResourceType, ResolveResult } from '@studiometa/productive-core';

import {
  resolveResource as resolve,
  detectResourceType,
  ResolveError,
} from '@studiometa/productive-core';

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { runCommand } from '../../error-handler.js';
import { ValidationError } from '../../errors.js';
import { colors } from '../../utils/colors.js';

/**
 * Format a resolve result for human output
 */
function formatResultHuman(result: ResolveResult, noColor: boolean): string {
  const c = noColor
    ? { cyan: (s: string) => s, dim: (s: string) => s, green: (s: string) => s }
    : colors;

  const parts = [c.green(result.id), c.cyan(result.label), c.dim(`(${result.type})`)];

  if (result.exact) {
    parts.push(c.dim('[exact]'));
  }

  return parts.join('  ');
}

/**
 * Resolve a human-friendly identifier to an ID
 */
export async function resolveIdentifier(args: string[], ctx: CommandContext): Promise<void> {
  const [query] = args;

  if (!query) {
    throw ValidationError.required('query');
  }

  const spinner = ctx.createSpinner('Resolving...');
  spinner.start();

  await runCommand(async () => {
    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const quiet = ctx.options.quiet === true || ctx.options.q === true;
    const first = ctx.options.first === true;
    const type = ctx.options.type as ResolvableResourceType | undefined;
    const projectId = ctx.options.project ? String(ctx.options.project) : undefined;

    try {
      const results = await resolve(ctx.api, query, {
        type,
        projectId,
        first,
      });

      spinner.succeed();

      // Quiet mode: output only the ID(s)
      if (quiet) {
        if (results.length > 1 && !first) {
          throw new ResolveError(
            `Multiple matches found for "${query}". Use --first to return the first match.`,
            query,
            type,
            results,
          );
        }
        console.log(results[0].id);
        return;
      }

      // JSON format
      if (format === 'json') {
        ctx.formatter.output({
          query,
          matches: results,
          exact: results.length === 1 && results[0].exact,
        });
        return;
      }

      // Human format
      if (results.length === 1) {
        console.log(formatResultHuman(results[0], ctx.options['no-color'] === true));
      } else {
        console.log(colors.cyan(`Found ${results.length} matches for "${query}":`));
        console.log();
        results.forEach((result) => {
          console.log('  ' + formatResultHuman(result, ctx.options['no-color'] === true));
        });
      }
    } catch (error) {
      spinner.fail();

      if (error instanceof ResolveError) {
        if (format === 'json') {
          ctx.formatter.output(error.toJSON());
          process.exit(1);
        }

        console.error(colors.red(error.message));

        if (error.suggestions && error.suggestions.length > 0) {
          console.log();
          console.log(colors.cyan('Did you mean:'));
          error.suggestions.forEach((suggestion) => {
            console.log('  ' + formatResultHuman(suggestion, ctx.options['no-color'] === true));
          });
        }

        process.exit(1);
      }

      throw error;
    }
  }, ctx.formatter);
}

/**
 * Auto-detect resource type from a query pattern
 */
export async function detectType(args: string[], ctx: CommandContext): Promise<void> {
  const [query] = args;

  if (!query) {
    throw ValidationError.required('query');
  }

  const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
  const detection = detectResourceType(query);

  if (format === 'json') {
    ctx.formatter.output({
      query,
      detection,
    });
    return;
  }

  if (detection) {
    console.log(colors.cyan('Query:'), query);
    console.log(colors.cyan('Type:'), detection.type);
    console.log(colors.cyan('Pattern:'), detection.pattern);
    console.log(colors.cyan('Confidence:'), detection.confidence);
  } else {
    console.log(colors.cyan('Query:'), query);
    console.log(colors.dim('No pattern detected. Use --type to specify resource type.'));
  }
}
