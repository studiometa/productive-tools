/**
 * Team Pulse summary executor.
 *
 * Provides a team-wide activity summary including:
 * - Active team members
 * - Who's tracking time today
 * - Who has active timers
 * - Time logged per person
 */

import type {
  IncludedResource,
  ProductivePerson,
  ProductiveTimeEntry,
  ProductiveTimer,
} from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type {
  PersonTimeSummary,
  TeamPulseSummaryOptions,
  TeamPulseSummaryResult,
} from './types.js';

import { toSummaryTimer } from './types.js';

/**
 * Get today's date in YYYY-MM-DD format
 */
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Fetch team_pulse summary.
 *
 * Parallel fetches:
 * - listPeople(status=active, type=user)
 * - listTimeEntries(date=today)
 * - listTimers()
 */
export async function getTeamPulseSummary(
  _options: TeamPulseSummaryOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<TeamPulseSummaryResult>> {
  const today = getToday();

  // Parallel fetch all data
  const [peopleRes, timeEntriesRes, timersRes] = await Promise.all([
    // Active users
    ctx.api.getPeople({
      page: 1,
      perPage: 200, // Get all active users
      filter: {
        status: '1', // active
        person_type: '1', // user (not contact or placeholder)
      },
    }),
    // All time entries today (we'll group by person)
    ctx.api.getTimeEntries({
      page: 1,
      perPage: 500, // Get all entries for today
      filter: {
        after: today,
        before: today,
      },
    }),
    // All active timers
    ctx.api.getTimers({
      page: 1,
      perPage: 100,
      include: ['time_entry'],
    }),
  ]);

  const allIncluded: IncludedResource[] = [...(timersRes.included || [])];

  // Create a map of person ID -> person data
  const peopleMap = new Map<string, ProductivePerson>();
  for (const person of peopleRes.data) {
    peopleMap.set(person.id, person);
  }

  // Group time entries by person
  const timeByPerson = new Map<string, { entries: ProductiveTimeEntry[]; totalTime: number }>();
  for (const entry of timeEntriesRes.data) {
    const personId = entry.relationships?.person?.data?.id;
    if (!personId) continue;

    const existing = timeByPerson.get(personId) || { entries: [], totalTime: 0 };
    existing.entries.push(entry);
    existing.totalTime += entry.attributes.time;
    timeByPerson.set(personId, existing);
  }

  // Group timers by person
  const timersByPerson = new Map<string, ProductiveTimer>();
  for (const timer of timersRes.data) {
    const personId = String(timer.attributes.person_id);
    // Keep only the most recent timer per person (first one in list)
    if (!timersByPerson.has(personId)) {
      timersByPerson.set(personId, timer);
    }
  }

  // Build person summaries for those who are tracking or have timers
  const personSummaries: PersonTimeSummary[] = [];
  const trackingToday = new Set<string>();
  const withActiveTimer = new Set<string>();

  // First, add people who are tracking time today
  for (const [personId, timeData] of timeByPerson.entries()) {
    const person = peopleMap.get(personId);
    if (!person) continue;

    trackingToday.add(personId);
    const timer = timersByPerson.get(personId);
    if (timer) {
      withActiveTimer.add(personId);
    }

    personSummaries.push({
      person_id: personId,
      person_name: `${person.attributes.first_name} ${person.attributes.last_name}`,
      email: person.attributes.email,
      logged_today_minutes: timeData.totalTime,
      entries_today: timeData.entries.length,
      active_timer: timer ? toSummaryTimer(timer, allIncluded) : undefined,
    });
  }

  // Then, add people with active timers who haven't logged time yet today
  for (const [personId, timer] of timersByPerson.entries()) {
    if (trackingToday.has(personId)) continue; // Already added

    const person = peopleMap.get(personId);
    if (!person) continue;

    withActiveTimer.add(personId);

    personSummaries.push({
      person_id: personId,
      person_name: `${person.attributes.first_name} ${person.attributes.last_name}`,
      email: person.attributes.email,
      logged_today_minutes: 0,
      entries_today: 0,
      active_timer: toSummaryTimer(timer, allIncluded),
    });
  }

  // Sort by time logged (descending)
  personSummaries.sort((a, b) => b.logged_today_minutes - a.logged_today_minutes);

  const result: TeamPulseSummaryResult = {
    summary_type: 'team_pulse',
    generated_at: new Date().toISOString(),
    date: today,
    team: {
      total_active: peopleRes.meta?.total_count ?? peopleRes.data.length,
      tracking_today: trackingToday.size,
      with_active_timer: withActiveTimer.size,
    },
    people: personSummaries.slice(0, 50), // Limit to 50 people
  };

  return { data: result };
}
