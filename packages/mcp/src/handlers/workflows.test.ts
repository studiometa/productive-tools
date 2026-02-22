/**
 * Tests for the workflows MCP handler.
 *
 * Tests handleWorkflows() directly using mock HandlerContext and ExecutorContext.
 */

import { createTestExecutorContext } from '@studiometa/productive-core';
import { describe, it, expect, vi } from 'vitest';

import type { HandlerContext } from './types.js';

import { handleWorkflows } from './workflows.js';

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function parseResult(result: { content: Array<{ type: string; text?: string }> }): unknown {
  const textContent = result.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text' || !textContent.text) {
    throw new Error('No text content in result');
  }
  return JSON.parse(textContent.text);
}

function createCtx(apiOverrides: Record<string, unknown> = {}): HandlerContext {
  const execCtx = createTestExecutorContext({
    api: apiOverrides as never,
    config: { userId: 'user-1', organizationId: 'org-1' },
  });
  return {
    formatOptions: { compact: false },
    perPage: 20,
    executor: () => execCtx,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Action routing
// ────────────────────────────────────────────────────────────────────────────

describe('handleWorkflows — routing', () => {
  it('returns error for unknown action', async () => {
    const ctx = createCtx();
    const result = await handleWorkflows('unknown_action', {}, ctx);
    expect(result.isError).toBe(true);
  });

  it('returns help for action=help', async () => {
    const ctx = createCtx();
    const result = await handleWorkflows('help', {}, ctx);
    expect(result.isError).toBeUndefined();
    const data = parseResult(result) as Record<string, unknown>;
    expect(data.resource).toBe('workflows');
    expect(data.actions).toHaveProperty('complete_task');
    expect(data.actions).toHaveProperty('log_day');
    expect(data.actions).toHaveProperty('weekly_standup');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// complete_task
// ────────────────────────────────────────────────────────────────────────────

describe('handleWorkflows — complete_task', () => {
  it('returns error when task_id is missing', async () => {
    const ctx = createCtx();
    const result = await handleWorkflows('complete_task', {}, ctx);
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('task_id is required');
  });

  it('calls completeTask executor and returns result', async () => {
    const getTask = vi.fn().mockResolvedValue({
      data: {
        id: '42',
        type: 'tasks',
        attributes: { title: 'Fix bug', closed: false },
        relationships: {},
      },
    });
    const updateTask = vi.fn().mockResolvedValue({
      data: {
        id: '42',
        type: 'tasks',
        attributes: { title: 'Fix bug', closed: true },
        relationships: {},
      },
    });
    const getTimers = vi.fn().mockResolvedValue({ data: [], meta: {} });

    const ctx = createCtx({ getTask, updateTask, getTimers });
    const result = await handleWorkflows('complete_task', { task_id: '42' }, ctx);

    expect(result.isError).toBeUndefined();
    const data = parseResult(result) as Record<string, unknown>;
    expect(data.workflow).toBe('complete_task');
    expect((data.task as Record<string, unknown>).id).toBe('42');
  });

  it('passes comment and stop_timer options to executor', async () => {
    const getTask = vi.fn().mockResolvedValue({
      data: {
        id: '42',
        type: 'tasks',
        attributes: { title: 'Fix bug', closed: false },
        relationships: {},
      },
    });
    const updateTask = vi.fn().mockResolvedValue({
      data: {
        id: '42',
        type: 'tasks',
        attributes: { title: 'Fix bug', closed: true },
        relationships: {},
      },
    });
    const createComment = vi.fn().mockResolvedValue({
      data: { id: 'comment-1', type: 'comments', attributes: { body: 'Done!' }, relationships: {} },
    });

    const ctx = createCtx({ getTask, updateTask, createComment });
    const result = await handleWorkflows(
      'complete_task',
      { task_id: '42', comment: 'Done!', stop_timer: false },
      ctx,
    );

    expect(result.isError).toBeUndefined();
    expect(createComment).toHaveBeenCalledWith({ body: 'Done!', task_id: '42' });
    const data = parseResult(result) as Record<string, unknown>;
    expect(data.comment_posted).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// log_day
// ────────────────────────────────────────────────────────────────────────────

describe('handleWorkflows — log_day', () => {
  it('returns error when entries is missing', async () => {
    const ctx = createCtx();
    const result = await handleWorkflows('log_day', {}, ctx);
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('entries is required');
  });

  it('returns error when entries is empty array', async () => {
    const ctx = createCtx();
    const result = await handleWorkflows('log_day', { entries: [] }, ctx);
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('entries is required');
  });

  it('creates time entries and returns log_day result', async () => {
    const createTimeEntry = vi.fn().mockResolvedValue({
      data: {
        id: 'te-1',
        type: 'time_entries',
        attributes: { time: 120, date: '2026-02-22', note: 'Dev work' },
        relationships: {},
      },
    });

    const ctx = createCtx({ createTimeEntry });
    const result = await handleWorkflows(
      'log_day',
      {
        entries: [
          { project_id: '100', service_id: '111', duration_minutes: 120, note: 'Dev work' },
        ],
        date: '2026-02-22',
      },
      ctx,
    );

    expect(result.isError).toBeUndefined();
    const data = parseResult(result) as Record<string, unknown>;
    expect(data.workflow).toBe('log_day');
    expect(data.succeeded).toBe(1);
    expect(data.failed).toBe(0);
    expect(data.total_minutes_logged).toBe(120);
  });

  it('converts entry fields to correct types', async () => {
    const createTimeEntry = vi.fn().mockResolvedValue({
      data: {
        id: 'te-1',
        type: 'time_entries',
        attributes: { time: 60, date: '2026-02-22', note: '' },
        relationships: {},
      },
    });

    const ctx = createCtx({ createTimeEntry });
    await handleWorkflows(
      'log_day',
      {
        entries: [{ project_id: '100', service_id: '111', duration_minutes: 60 }],
      },
      ctx,
    );

    expect(createTimeEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        time: 60,
        service_id: '111',
        person_id: 'user-1',
      }),
    );
  });
});

// ────────────────────────────────────────────────────────────────────────────
// weekly_standup
// ────────────────────────────────────────────────────────────────────────────

describe('handleWorkflows — weekly_standup', () => {
  it('returns weekly_standup result with default user', async () => {
    const getTasks = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });
    const getTimeEntries = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

    const ctx = createCtx({ getTasks, getTimeEntries });
    const result = await handleWorkflows('weekly_standup', {}, ctx);

    expect(result.isError).toBeUndefined();
    const data = parseResult(result) as Record<string, unknown>;
    expect(data.workflow).toBe('weekly_standup');
    expect(data.person_id).toBe('user-1');
  });

  it('passes person_id option to executor', async () => {
    const getTasks = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });
    const getTimeEntries = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

    const ctx = createCtx({ getTasks, getTimeEntries });
    const result = await handleWorkflows('weekly_standup', { person_id: 'user-999' }, ctx);

    expect(result.isError).toBeUndefined();
    const data = parseResult(result) as Record<string, unknown>;
    expect(data.person_id).toBe('user-999');
  });

  it('passes week_start option to executor', async () => {
    const getTasks = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });
    const getTimeEntries = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

    const ctx = createCtx({ getTasks, getTimeEntries });
    const result = await handleWorkflows('weekly_standup', { week_start: '2026-02-16' }, ctx);

    expect(result.isError).toBeUndefined();
    const data = parseResult(result) as Record<string, unknown>;
    const week = data.week as Record<string, unknown>;
    expect(week.start).toBe('2026-02-16');
    expect(week.end).toBe('2026-02-22');
  });

  it('returns structured standup with completed tasks and time data', async () => {
    const getTasks = vi
      .fn()
      .mockResolvedValueOnce({
        data: [
          {
            id: 'task-1',
            type: 'tasks',
            attributes: { title: 'Done task', closed: true, due_date: '2026-02-20' },
            relationships: { project: { data: { type: 'projects', id: 'proj-1' } } },
          },
        ],
        meta: {},
        included: [{ id: 'proj-1', type: 'projects', attributes: { name: 'My Project' } }],
      })
      .mockResolvedValueOnce({ data: [], meta: {}, included: [] });

    const getTimeEntries = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'te-1',
          type: 'time_entries',
          attributes: { time: 240 },
          relationships: { project: { data: { type: 'projects', id: 'proj-1' } } },
        },
      ],
      meta: {},
      included: [],
    });

    const ctx = createCtx({ getTasks, getTimeEntries });
    const result = await handleWorkflows('weekly_standup', {}, ctx);

    const data = parseResult(result) as Record<string, unknown>;
    const completed = data.completed_tasks as Record<string, unknown>;
    const time = data.time_logged as Record<string, unknown>;

    expect(completed.count).toBe(1);
    expect(time.total_minutes).toBe(240);
  });

  it('returns help documentation for action=help', async () => {
    const ctx = createCtx({});
    const result = await handleWorkflows('help', {}, ctx);

    const data = parseResult(result) as Record<string, unknown>;
    expect(data.resource).toBe('workflows');
    expect(data.actions).toBeDefined();
    const actions = data.actions as Record<string, unknown>;
    expect(actions.complete_task).toBeDefined();
    expect(actions.log_day).toBeDefined();
    expect(actions.weekly_standup).toBeDefined();
  });
});
