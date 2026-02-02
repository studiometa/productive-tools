/**
 * Human-readable renderers
 *
 * Provides human-friendly output formatting for all resource types.
 * These renderers produce colored, formatted output suitable for terminal viewing.
 */

// Time entries
export {
  HumanTimeEntryListRenderer,
  HumanTimeEntryDetailRenderer,
  humanTimeEntryListRenderer,
  humanTimeEntryDetailRenderer,
} from './time-entry.js';

// Projects
export {
  HumanProjectListRenderer,
  HumanProjectDetailRenderer,
  humanProjectListRenderer,
  humanProjectDetailRenderer,
} from './project.js';

// Tasks
export {
  HumanTaskListRenderer,
  HumanTaskDetailRenderer,
  humanTaskListRenderer,
  humanTaskDetailRenderer,
  formatTime,
} from './task.js';

// Kanban
export {
  KanbanRenderer,
  kanbanRenderer,
  stripAnsi,
  truncateText,
  padText,
} from './kanban.js';
export type { KanbanTask, KanbanColumn } from './kanban.js';

// People
export {
  HumanPersonListRenderer,
  HumanPersonDetailRenderer,
  humanPersonListRenderer,
  humanPersonDetailRenderer,
} from './person.js';

// Services
export {
  HumanServiceListRenderer,
  humanServiceListRenderer,
} from './service.js';

// Budgets
export {
  HumanBudgetListRenderer,
  humanBudgetListRenderer,
} from './budget.js';

// Companies
export {
  HumanCompanyListRenderer,
  HumanCompanyDetailRenderer,
  humanCompanyListRenderer,
  humanCompanyDetailRenderer,
} from './company.js';

// Comments
export {
  HumanCommentListRenderer,
  HumanCommentDetailRenderer,
  humanCommentListRenderer,
  humanCommentDetailRenderer,
} from './comment.js';

// Timers
export {
  HumanTimerListRenderer,
  HumanTimerDetailRenderer,
  humanTimerListRenderer,
  humanTimerDetailRenderer,
} from './timer.js';

// Deals
export {
  HumanDealListRenderer,
  HumanDealDetailRenderer,
  humanDealListRenderer,
  humanDealDetailRenderer,
} from './deal.js';

// Bookings
export {
  HumanBookingListRenderer,
  HumanBookingDetailRenderer,
  humanBookingListRenderer,
  humanBookingDetailRenderer,
} from './booking.js';
