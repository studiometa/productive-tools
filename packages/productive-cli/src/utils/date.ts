/**
 * Parse a date string supporting various formats:
 * - ISO date: 2024-01-01
 * - Keywords: today, yesterday, tomorrow
 * - Relative: "2 days ago", "1 week ago", "3 months ago"
 * - Shortcuts: "last week", "last month", "this week", "this month"
 *
 * @param input - Date string to parse
 * @returns ISO date string (YYYY-MM-DD) or null if invalid
 */
export function parseDate(input: string): string | null {
  if (!input) return null;

  const normalized = input.toLowerCase().trim();
  const now = new Date();

  // ISO date format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  // Keywords
  switch (normalized) {
    case 'today':
      return formatDate(now);
    case 'yesterday':
      return formatDate(addDays(now, -1));
    case 'tomorrow':
      return formatDate(addDays(now, 1));
  }

  // Relative dates: "X days/weeks/months ago"
  const relativeMatch = normalized.match(/^(\d+)\s+(day|days|week|weeks|month|months)\s+ago$/);
  if (relativeMatch) {
    const amount = parseInt(relativeMatch[1], 10);
    const unit = relativeMatch[2];

    if (unit.startsWith('day')) {
      return formatDate(addDays(now, -amount));
    } else if (unit.startsWith('week')) {
      return formatDate(addDays(now, -amount * 7));
    } else if (unit.startsWith('month')) {
      return formatDate(addMonths(now, -amount));
    }
  }

  // Shortcuts
  switch (normalized) {
    case 'last week': {
      // Start of last week (Monday)
      const lastWeek = addDays(now, -7);
      return formatDate(getStartOfWeek(lastWeek));
    }
    case 'this week': {
      return formatDate(getStartOfWeek(now));
    }
    case 'last month': {
      const lastMonth = addMonths(now, -1);
      return formatDate(new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1));
    }
    case 'this month': {
      return formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
    }
  }

  return null;
}

/**
 * Parse a date range from a single input
 * Returns { from, to } for range shortcuts, or { from: date, to: date } for single dates
 */
export function parseDateRange(input: string): { from: string; to: string } | null {
  if (!input) return null;

  const normalized = input.toLowerCase().trim();
  const now = new Date();

  // Range shortcuts
  switch (normalized) {
    case 'today':
      return { from: formatDate(now), to: formatDate(now) };
    case 'yesterday': {
      const yesterday = formatDate(addDays(now, -1));
      return { from: yesterday, to: yesterday };
    }
    case 'this week': {
      const start = getStartOfWeek(now);
      const end = addDays(start, 6);
      return { from: formatDate(start), to: formatDate(end) };
    }
    case 'last week': {
      const lastWeekStart = getStartOfWeek(addDays(now, -7));
      const lastWeekEnd = addDays(lastWeekStart, 6);
      return { from: formatDate(lastWeekStart), to: formatDate(lastWeekEnd) };
    }
    case 'this month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: formatDate(start), to: formatDate(end) };
    }
    case 'last month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: formatDate(start), to: formatDate(end) };
    }
  }

  // Single date - use parseDate for other formats
  const singleDate = parseDate(input);
  if (singleDate) {
    return { from: singleDate, to: singleDate };
  }

  return null;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function getStartOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  // Adjust to Monday (day 1), handle Sunday (day 0) as end of week
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
}
