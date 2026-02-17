/**
 * Reports MCP handler.
 */

import { getReport, VALID_REPORT_TYPES, type ReportType } from '@studiometa/productive-core';

import type { CommonArgs, HandlerContext, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { inputErrorResult, jsonResult } from './utils.js';

interface ReportArgs extends CommonArgs {
  report_type?: string;
  group?: string;
  from?: string;
  to?: string;
  person_id?: string;
  project_id?: string;
  company_id?: string;
  deal_id?: string;
  status?: string;
}

function formatReportData(data: unknown[]): unknown[] {
  return data.map((item: unknown) => {
    const record = item as { id: string; type: string; attributes: Record<string, unknown> };
    return {
      id: record.id,
      type: record.type,
      ...record.attributes,
    };
  });
}

const VALID_ACTIONS = ['get'];

export async function handleReports(
  action: string,
  args: ReportArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { filter, page, perPage } = ctx;
  const { report_type, group, from, to, person_id, project_id, company_id, deal_id, status } = args;

  if (action !== 'get') {
    return inputErrorResult(ErrorMessages.invalidAction(action, 'reports', VALID_ACTIONS));
  }

  if (!report_type) {
    return inputErrorResult(ErrorMessages.missingReportType());
  }

  if (!VALID_REPORT_TYPES.includes(report_type as ReportType)) {
    return inputErrorResult(ErrorMessages.invalidReportType(report_type, [...VALID_REPORT_TYPES]));
  }

  const execCtx = ctx.executor();

  const result = await getReport(
    {
      reportType: report_type as ReportType,
      page,
      perPage,
      group,
      from,
      to,
      personId: person_id,
      projectId: project_id,
      companyId: company_id,
      dealId: deal_id,
      status,
      additionalFilters: filter,
    },
    execCtx,
  );

  const formattedData = formatReportData(result.data);

  return jsonResult({
    data: formattedData,
    meta: result.meta,
  });
}
