import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { getTeamPulseSummary } from './team-pulse.js';

describe('getTeamPulseSummary', () => {
  const mockPeopleResponse = {
    data: [
      {
        id: '1',
        type: 'people',
        attributes: { first_name: 'Alice', last_name: 'Smith', email: 'alice@example.com' },
      },
      {
        id: '2',
        type: 'people',
        attributes: { first_name: 'Bob', last_name: 'Jones', email: 'bob@example.com' },
      },
      {
        id: '3',
        type: 'people',
        attributes: { first_name: 'Charlie', last_name: 'Brown', email: 'charlie@example.com' },
      },
    ],
    meta: { total_count: 10 },
  };

  const mockTimeEntriesResponse = {
    data: [
      {
        id: '100',
        type: 'time_entries',
        attributes: { time: 120 },
        relationships: { person: { data: { type: 'people', id: '1' } } },
      },
      {
        id: '101',
        type: 'time_entries',
        attributes: { time: 60 },
        relationships: { person: { data: { type: 'people', id: '1' } } },
      },
      {
        id: '102',
        type: 'time_entries',
        attributes: { time: 90 },
        relationships: { person: { data: { type: 'people', id: '2' } } },
      },
    ],
    meta: {},
  };

  const mockTimersResponse = {
    data: [
      {
        id: '200',
        type: 'timers',
        attributes: { started_at: '2026-02-21T09:00:00Z', total_time: 45, person_id: 1 },
        relationships: {},
      },
      {
        id: '201',
        type: 'timers',
        attributes: { started_at: '2026-02-21T10:00:00Z', total_time: 30, person_id: 3 },
        relationships: {},
      },
    ],
    meta: {},
    included: [],
  };

  it('fetches and aggregates data for team_pulse summary', async () => {
    const getPeople = vi.fn().mockResolvedValue(mockPeopleResponse);
    const getTimeEntries = vi.fn().mockResolvedValue(mockTimeEntriesResponse);
    const getTimers = vi.fn().mockResolvedValue(mockTimersResponse);

    const ctx = createTestExecutorContext({
      api: { getPeople, getTimeEntries, getTimers },
    });

    const result = await getTeamPulseSummary({}, ctx);

    expect(result.data.summary_type).toBe('team_pulse');
    expect(result.data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.data.team.total_active).toBe(10);
    expect(result.data.team.tracking_today).toBe(2); // Alice and Bob
    expect(result.data.team.with_active_timer).toBe(2); // Alice and Charlie
    expect(result.data.people).toHaveLength(3); // Alice, Bob, and Charlie (has timer)
  });

  it('groups time entries by person correctly', async () => {
    const getPeople = vi.fn().mockResolvedValue(mockPeopleResponse);
    const getTimeEntries = vi.fn().mockResolvedValue(mockTimeEntriesResponse);
    const getTimers = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

    const ctx = createTestExecutorContext({
      api: { getPeople, getTimeEntries, getTimers },
    });

    const result = await getTeamPulseSummary({}, ctx);

    // Alice has 2 entries totaling 180 minutes
    const alice = result.data.people.find((p) => p.person_name === 'Alice Smith');
    expect(alice).toBeDefined();
    expect(alice?.logged_today_minutes).toBe(180); // 120 + 60
    expect(alice?.entries_today).toBe(2);

    // Bob has 1 entry totaling 90 minutes
    const bob = result.data.people.find((p) => p.person_name === 'Bob Jones');
    expect(bob).toBeDefined();
    expect(bob?.logged_today_minutes).toBe(90);
    expect(bob?.entries_today).toBe(1);
  });

  it('includes active timers in person summaries', async () => {
    const getPeople = vi.fn().mockResolvedValue(mockPeopleResponse);
    const getTimeEntries = vi.fn().mockResolvedValue(mockTimeEntriesResponse);
    const getTimers = vi.fn().mockResolvedValue(mockTimersResponse);

    const ctx = createTestExecutorContext({
      api: { getPeople, getTimeEntries, getTimers },
    });

    const result = await getTeamPulseSummary({}, ctx);

    // Alice has an active timer
    const alice = result.data.people.find((p) => p.person_name === 'Alice Smith');
    expect(alice?.active_timer).toBeDefined();
    expect(alice?.active_timer?.total_time).toBe(45);

    // Bob has no active timer
    const bob = result.data.people.find((p) => p.person_name === 'Bob Jones');
    expect(bob?.active_timer).toBeUndefined();

    // Charlie has active timer but no time entries
    const charlie = result.data.people.find((p) => p.person_name === 'Charlie Brown');
    expect(charlie).toBeDefined();
    expect(charlie?.logged_today_minutes).toBe(0);
    expect(charlie?.active_timer).toBeDefined();
    expect(charlie?.active_timer?.total_time).toBe(30);
  });

  it('sorts people by time logged (descending)', async () => {
    const getPeople = vi.fn().mockResolvedValue(mockPeopleResponse);
    const getTimeEntries = vi.fn().mockResolvedValue(mockTimeEntriesResponse);
    const getTimers = vi.fn().mockResolvedValue(mockTimersResponse);

    const ctx = createTestExecutorContext({
      api: { getPeople, getTimeEntries, getTimers },
    });

    const result = await getTeamPulseSummary({}, ctx);

    // Should be sorted: Alice (180), Bob (90), Charlie (0)
    expect(result.data.people[0].person_name).toBe('Alice Smith');
    expect(result.data.people[0].logged_today_minutes).toBe(180);
    expect(result.data.people[1].person_name).toBe('Bob Jones');
    expect(result.data.people[1].logged_today_minutes).toBe(90);
    expect(result.data.people[2].person_name).toBe('Charlie Brown');
    expect(result.data.people[2].logged_today_minutes).toBe(0);
  });

  it('passes correct filters to API calls', async () => {
    const getPeople = vi.fn().mockResolvedValue({ data: [], meta: {} });
    const getTimeEntries = vi.fn().mockResolvedValue({ data: [], meta: {} });
    const getTimers = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

    const ctx = createTestExecutorContext({
      api: { getPeople, getTimeEntries, getTimers },
    });

    await getTeamPulseSummary({}, ctx);

    // Check people call
    expect(getPeople).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          status: '1', // active
          person_type: '1', // user
        }),
        perPage: 200,
      }),
    );

    // Check time entries call
    expect(getTimeEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          after: expect.any(String),
          before: expect.any(String),
        }),
        perPage: 500,
      }),
    );

    // Check timers call
    expect(getTimers).toHaveBeenCalledWith(
      expect.objectContaining({
        include: ['time_entry'],
      }),
    );
  });

  it('handles empty responses gracefully', async () => {
    const getPeople = vi.fn().mockResolvedValue({ data: [], meta: { total_count: 0 } });
    const getTimeEntries = vi.fn().mockResolvedValue({ data: [], meta: {} });
    const getTimers = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

    const ctx = createTestExecutorContext({
      api: { getPeople, getTimeEntries, getTimers },
    });

    const result = await getTeamPulseSummary({}, ctx);

    expect(result.data.team.total_active).toBe(0);
    expect(result.data.team.tracking_today).toBe(0);
    expect(result.data.team.with_active_timer).toBe(0);
    expect(result.data.people).toHaveLength(0);
  });

  it('ignores time entries without person relationship', async () => {
    const getPeople = vi.fn().mockResolvedValue(mockPeopleResponse);
    const getTimeEntries = vi.fn().mockResolvedValue({
      data: [
        {
          id: '100',
          type: 'time_entries',
          attributes: { time: 120 },
          relationships: {}, // No person relationship
        },
      ],
      meta: {},
    });
    const getTimers = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

    const ctx = createTestExecutorContext({
      api: { getPeople, getTimeEntries, getTimers },
    });

    const result = await getTeamPulseSummary({}, ctx);

    expect(result.data.team.tracking_today).toBe(0);
    expect(result.data.people).toHaveLength(0);
  });

  it('limits people to 50 entries', async () => {
    // Create 60 people
    const manyPeople = {
      data: Array.from({ length: 60 }, (_, i) => ({
        id: String(i + 1),
        type: 'people',
        attributes: {
          first_name: `Person`,
          last_name: `${i + 1}`,
          email: `person${i + 1}@example.com`,
        },
      })),
      meta: { total_count: 60 },
    };

    // Create time entries for all 60 people
    const manyTimeEntries = {
      data: Array.from({ length: 60 }, (_, i) => ({
        id: String(100 + i),
        type: 'time_entries',
        attributes: { time: 60 - i }, // Descending time
        relationships: { person: { data: { type: 'people', id: String(i + 1) } } },
      })),
      meta: {},
    };

    const getPeople = vi.fn().mockResolvedValue(manyPeople);
    const getTimeEntries = vi.fn().mockResolvedValue(manyTimeEntries);
    const getTimers = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

    const ctx = createTestExecutorContext({
      api: { getPeople, getTimeEntries, getTimers },
    });

    const result = await getTeamPulseSummary({}, ctx);

    expect(result.data.people).toHaveLength(50);
  });
});
