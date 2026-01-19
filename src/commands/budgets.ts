import { ProductiveApi, ProductiveApiError } from '../api.js';
import { OutputFormatter, createSpinner } from '../output.js';
import { colors } from '../utils/colors.js';
import type { OutputFormat } from '../types.js';

export function showBudgetsHelp(subcommand?: string): void {
  if (subcommand === 'list' || subcommand === 'ls') {
    console.log(`
${colors.bold('productive budgets list')} - List budgets

${colors.bold('USAGE:')}
  productive budgets list [options]

${colors.bold('OPTIONS:')}
  --project <id>      Filter by project ID
  -p, --page <num>    Page number (default: 1)
  -s, --size <num>    Page size (default: 100)
  -f, --format <fmt>  Output format: json, human, csv, table

${colors.bold('EXAMPLES:')}
  productive budgets list
  productive budgets list --project 12345
  productive budgets list --format json
`);
  } else {
    console.log(`
${colors.bold('productive budgets')} - Manage budgets

${colors.bold('USAGE:')}
  productive budgets <subcommand> [options]

${colors.bold('SUBCOMMANDS:')}
  list, ls            List budgets

${colors.bold('COMMON OPTIONS:')}
  -f, --format <fmt>  Output format: json, human, csv, table
  -p, --page <num>    Page number for pagination
  -s, --size <num>    Page size (default: 100)
  -h, --help          Show help for a subcommand

${colors.bold('EXAMPLES:')}
  productive budgets list
  productive budgets list --project 12345

Run ${colors.cyan('productive budgets list --help')} for subcommand details.
`);
  }
}

export async function handleBudgetsCommand(
  subcommand: string,
  args: string[],
  options: Record<string, string | boolean>
): Promise<void> {
  const format = (options.format || options.f || 'human') as OutputFormat;
  const formatter = new OutputFormatter(format, options['no-color'] === true);

  switch (subcommand) {
    case 'list':
    case 'ls':
      await budgetsList(options, formatter);
      break;
    default:
      formatter.error(`Unknown budgets subcommand: ${subcommand}`);
      process.exit(1);
  }
}

async function budgetsList(
  options: Record<string, string | boolean>,
  formatter: OutputFormatter
): Promise<void> {
  const spinner = createSpinner('Fetching budgets...', formatter['format']);
  spinner.start();

  try {
    const api = new ProductiveApi(options);
    const filter: Record<string, string> = {};

    if (options.project) {
      filter.project_id = String(options.project);
    }

    const response = await api.getBudgets({
      page: parseInt(String(options.page || options.p || '1')),
      perPage: parseInt(String(options.size || options.s || '100')),
      filter,
    });

    spinner.succeed();

    if (formatter['format'] === 'json') {
      formatter.output({
        data: response.data.map((b) => ({
          id: b.id,
          total_time_budget: b.attributes.total_time_budget,
          remaining_time_budget: b.attributes.remaining_time_budget,
          total_monetary_budget: b.attributes.total_monetary_budget,
          remaining_monetary_budget: b.attributes.remaining_monetary_budget,
        })),
        meta: response.meta,
      });
    } else if (formatter['format'] === 'csv' || formatter['format'] === 'table') {
      const data = response.data.map((b) => ({
        id: b.id,
        time_total: b.attributes.total_time_budget || 0,
        time_remaining: b.attributes.remaining_time_budget || 0,
        money_total: b.attributes.total_monetary_budget || 0,
        money_remaining: b.attributes.remaining_monetary_budget || 0,
      }));
      formatter.output(data);
    } else {
      response.data.forEach((budget) => {
        console.log(colors.bold(`Budget ID: ${budget.id}`));
        if (budget.attributes.total_time_budget) {
          const used =
            (budget.attributes.total_time_budget || 0) - (budget.attributes.remaining_time_budget || 0);
          console.log(
            colors.dim(`  Time: ${used}/${budget.attributes.total_time_budget} hours`)
          );
        }
        if (budget.attributes.total_monetary_budget) {
          const used =
            (budget.attributes.total_monetary_budget || 0) -
            (budget.attributes.remaining_monetary_budget || 0);
          console.log(
            colors.dim(`  Money: ${used}/${budget.attributes.total_monetary_budget}`)
          );
        }
        console.log();
      });

      if (response.meta?.total) {
        const currentPage = response.meta.page || 1;
        const perPage = response.meta.per_page || 100;
        const totalPages = Math.ceil(response.meta.total / perPage);
        console.log(colors.dim(`Page ${currentPage}/${totalPages} (Total: ${response.meta.total} budgets)`));
      }
    }
  } catch (error) {
    spinner.fail();
    handleError(error, formatter);
  }
}

function handleError(error: unknown, formatter: OutputFormatter): void {
  if (error instanceof ProductiveApiError) {
    if (formatter['format'] === 'json') {
      formatter.output(error.toJSON());
    } else {
      formatter.error(error.message);
    }
  } else {
    formatter.error('An unexpected error occurred', error);
  }
  process.exit(1);
}
