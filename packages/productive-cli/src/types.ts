// Re-export all API types from the shared package
export type {
  IncludedResource,
  ProductiveApiMeta,
  ProductiveApiResponse,
  ProductiveBooking,
  ProductiveBudget,
  ProductiveComment,
  ProductiveCompany,
  ProductiveConfig,
  ProductiveDeal,
  ProductivePerson,
  ProductiveProject,
  ProductiveReport,
  ProductiveService,
  ProductiveTask,
  ProductiveTimeEntry,
  ProductiveTimer,
  RelationshipData,
} from '@studiometa/productive-api';

// CLI-specific types
export type OutputFormat = 'json' | 'human' | 'csv' | 'table' | 'kanban';

export interface CliOptions {
  format?: OutputFormat;
  quiet?: boolean;
  verbose?: boolean;
  noColor?: boolean;
}
