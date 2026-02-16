/**
 * Human-readable renderers for Company resources
 */

import type { FormattedCompany, FormattedListResponse } from '../../formatters/types.js';
import type { RenderContext, ListRenderer, Renderer } from '../types.js';

import { colors } from '../../utils/colors.js';

/**
 * Render a list of companies in human-readable format
 */
export class HumanCompanyListRenderer implements ListRenderer<FormattedCompany> {
  render(data: FormattedListResponse<FormattedCompany>, ctx: RenderContext): void {
    const { data: companies, meta } = data;

    if (companies.length === 0) {
      console.log(ctx.noColor ? 'No companies found' : colors.dim('No companies found'));
      return;
    }

    // Header
    if (meta) {
      const pageInfo = `Page ${meta.page}/${meta.total_pages} (${meta.total_count} total)`;
      console.log(ctx.noColor ? pageInfo : colors.dim(pageInfo));
      console.log();
    }

    // List companies
    for (const company of companies) {
      const archived = company.archived ? ' [ARCHIVED]' : '';
      const name = ctx.noColor
        ? `${company.name}${archived}`
        : `${colors.bold(company.name)}${archived ? colors.red(archived) : ''}`;

      const code = company.company_code
        ? ctx.noColor
          ? ` (${company.company_code})`
          : colors.dim(` (${company.company_code})`)
        : '';

      console.log(`${name}${code}`);

      const details: string[] = [];
      if (company.default_currency) details.push(`Currency: ${company.default_currency}`);
      if (company.vat) details.push(`VAT: ${company.vat}`);
      if (company.due_days) details.push(`Due: ${company.due_days} days`);

      if (details.length > 0) {
        const detailLine = details.join(' | ');
        console.log(ctx.noColor ? `  ${detailLine}` : colors.dim(`  ${detailLine}`));
      }

      const idLine = `ID: ${company.id}`;
      console.log(ctx.noColor ? `  ${idLine}` : colors.dim(`  ${idLine}`));
      console.log();
    }
  }
}

/**
 * Render a single company detail in human-readable format
 */
export class HumanCompanyDetailRenderer implements Renderer<FormattedCompany> {
  render(company: FormattedCompany, ctx: RenderContext): void {
    const label = (text: string) => (ctx.noColor ? text : colors.cyan(text));

    console.log();
    console.log(ctx.noColor ? company.name : colors.bold(company.name));
    if (company.archived) {
      console.log(ctx.noColor ? '[ARCHIVED]' : colors.red('[ARCHIVED]'));
    }
    console.log();

    console.log(label('ID:'), company.id);

    if (company.company_code) {
      console.log(label('Code:'), company.company_code);
    }

    if (company.billing_name) {
      console.log(label('Billing Name:'), company.billing_name);
    }

    if (company.vat) {
      console.log(label('VAT/Tax ID:'), company.vat);
    }

    if (company.default_currency) {
      console.log(label('Currency:'), company.default_currency);
    }

    if (company.domain) {
      console.log(label('Domain:'), company.domain);
    }

    if (company.due_days) {
      console.log(label('Payment Terms:'), `${company.due_days} days`);
    }

    if (company.created_at) {
      console.log(label('Created:'), company.created_at.split('T')[0]);
    }

    console.log();
  }
}

// Singleton instances
export const humanCompanyListRenderer = new HumanCompanyListRenderer();
export const humanCompanyDetailRenderer = new HumanCompanyDetailRenderer();
