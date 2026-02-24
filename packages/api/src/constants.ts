/**
 * Status and type constants for Productive.io API resources.
 *
 * Single source of truth for all magic string values (`'1'`, `'2'`, `'3'`)
 * used across the API. Each constant provides:
 *
 * - **Forward lookup**: `TASK_STATUS.OPEN` → `'1'` (for building filters)
 * - **Reverse lookup**: `TASK_STATUS.fromValue('1')` → `'open'` (for formatting)
 * - **Label resolution**: `TASK_STATUS.toValue('open')` → `'1'` (for user input)
 * - **TypeScript literal types**: `TASK_STATUS.OPEN` is typed as `'1'`, not `string`
 */

/**
 * A status/type map with bidirectional lookup capabilities.
 *
 * The base object contains SCREAMING_SNAKE_CASE keys mapping to API string values.
 * Additional methods allow reverse lookups and label-to-value conversion.
 */
export type StatusMap<T extends Record<string, string>> = T & {
  /** Reverse lookup: API value → lowercase label (e.g. `'1'` → `'open'`) */
  fromValue: (value: string) => string;
  /** Label → API value (e.g. `'open'` → `'1'`). Case-insensitive. */
  toValue: (label: string) => string;
  /** All entries as `[label, value]` pairs (e.g. `[['open', '1'], ['closed', '2']]`) */
  entries: () => [string, string][];
};

/**
 * Create a bidirectional status/type map from a `{ LABEL: 'value' }` object.
 *
 * @example
 * ```ts
 * const TASK_STATUS = createStatusMap({ OPEN: '1', CLOSED: '2' } as const);
 *
 * TASK_STATUS.OPEN          // '1' (typed as literal '1')
 * TASK_STATUS.fromValue('1') // 'open'
 * TASK_STATUS.toValue('open') // '1'
 * TASK_STATUS.entries()      // [['open', '1'], ['closed', '2']]
 * ```
 */
export function createStatusMap<T extends Record<string, string>>(map: T): StatusMap<T> {
  const reverse: Record<string, string> = {};
  const forward: Record<string, string> = {};
  const entryPairs: [string, string][] = [];

  for (const [key, value] of Object.entries(map)) {
    const label = key.toLowerCase();
    reverse[value] = label;
    forward[label] = value;
    entryPairs.push([label, value]);
  }

  return Object.assign(Object.create(null), map, {
    fromValue: (value: string): string => reverse[value] ?? value,
    toValue: (label: string): string => forward[label.toLowerCase()] ?? label,
    entries: (): [string, string][] => [...entryPairs],
  }) as StatusMap<T>;
}

// ---------------------------------------------------------------------------
// Task
// ---------------------------------------------------------------------------

/** Task status values */
export const TASK_STATUS = createStatusMap({
  OPEN: '1',
  CLOSED: '2',
} as const);

/** Task overdue status values */
export const TASK_OVERDUE_STATUS = createStatusMap({
  NOT_OVERDUE: '1',
  OVERDUE: '2',
} as const);

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

/** Project status values */
export const PROJECT_STATUS = createStatusMap({
  ACTIVE: '1',
  ARCHIVED: '2',
} as const);

/** Project type values */
export const PROJECT_TYPE = createStatusMap({
  INTERNAL: '1',
  CLIENT: '2',
} as const);

// ---------------------------------------------------------------------------
// Deal
// ---------------------------------------------------------------------------

/** Deal stage status values */
export const DEAL_STATUS = createStatusMap({
  OPEN: '1',
  WON: '2',
  LOST: '3',
} as const);

/** Deal type values (deal vs budget) */
export const DEAL_TYPE = createStatusMap({
  DEAL: '1',
  BUDGET: '2',
} as const);

/** Deal budget status values */
export const DEAL_BUDGET_STATUS = createStatusMap({
  OPEN: '1',
  CLOSED: '2',
} as const);

// ---------------------------------------------------------------------------
// Time Entry
// ---------------------------------------------------------------------------

/** Time entry approval status values */
export const TIME_STATUS = createStatusMap({
  APPROVED: '1',
  UNAPPROVED: '2',
  REJECTED: '3',
} as const);

/** Time entry billing type values */
export const TIME_BILLING_TYPE = createStatusMap({
  FIXED: '1',
  ACTUALS: '2',
  NON_BILLABLE: '3',
} as const);

/** Time entry invoicing status values */
export const TIME_INVOICING_STATUS = createStatusMap({
  NOT_INVOICED: '1',
  DRAFTED: '2',
  FINALIZED: '3',
} as const);

// ---------------------------------------------------------------------------
// Person
// ---------------------------------------------------------------------------

/** Person status values */
export const PERSON_STATUS = createStatusMap({
  ACTIVE: '1',
  DEACTIVATED: '2',
} as const);

/** Person type values */
export const PERSON_TYPE = createStatusMap({
  USER: '1',
  CONTACT: '2',
  PLACEHOLDER: '3',
} as const);

// ---------------------------------------------------------------------------
// Company
// ---------------------------------------------------------------------------

/** Company status values */
export const COMPANY_STATUS = createStatusMap({
  ACTIVE: '1',
  ARCHIVED: '2',
} as const);

// ---------------------------------------------------------------------------
// Discussion
// ---------------------------------------------------------------------------

/** Discussion status values */
export const DISCUSSION_STATUS = createStatusMap({
  ACTIVE: '1',
  RESOLVED: '2',
} as const);

// ---------------------------------------------------------------------------
// Service (budget line item)
// ---------------------------------------------------------------------------

/** Service budget status values */
export const SERVICE_BUDGET_STATUS = createStatusMap({
  OPEN: '1',
  DELIVERED: '2',
} as const);

/** Service billing type values */
export const SERVICE_BILLING_TYPE = createStatusMap({
  FIXED: '1',
  ACTUALS: '2',
  NONE: '3',
} as const);
