import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { createRenderContext } from '../types.js';
import { HumanActivityListRenderer } from './activity.js';

describe('HumanActivityListRenderer', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  const ctx = createRenderContext({ noColor: true });

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  const renderer = new HumanActivityListRenderer();

  it('renders activity with creator and changeset', () => {
    renderer.render(
      {
        data: [
          {
            id: '1',
            event: 'create',
            changeset: "name: null → 'New Project'",
            created_at: '2026-02-22T10:30:00Z',
            creator_name: 'John Doe',
          },
        ],
      },
      ctx,
    );

    const output = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(output).toContain('create');
    expect(output).toContain('John Doe');
    expect(output).toContain("name: null → 'New Project'");
  });

  it('renders activity without creator', () => {
    renderer.renderItem(
      {
        id: '2',
        event: 'delete',
        changeset: '',
        created_at: '2026-02-22T11:00:00Z',
      },
      ctx,
    );

    const output = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(output).toContain('delete');
    // No "by" prefix when no creator
    expect(output).not.toContain(' by ');
  });

  it('renders pagination', () => {
    renderer.renderPagination({ page: 2, total_pages: 5, total_count: 100 }, ctx);

    const output = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(output).toContain('2/5');
    expect(output).toContain('100');
  });

  it('renders empty list without errors', () => {
    expect(() => renderer.render({ data: [] }, ctx)).not.toThrow();
  });

  it('renders activity without changeset', () => {
    renderer.renderItem(
      {
        id: '3',
        event: 'update',
        changeset: '',
        created_at: '2026-02-22T12:00:00Z',
        creator_name: 'Jane',
      },
      ctx,
    );

    const output = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(output).toContain('update');
    // Empty changeset should not render changeset line
    expect(output).not.toContain('  ');
  });

  it('renders list with meta/pagination', () => {
    renderer.render(
      {
        data: [
          {
            id: '1',
            event: 'create',
            changeset: 'test',
            created_at: '2026-02-22T10:00:00Z',
          },
        ],
        meta: { page: 1, total_pages: 3, total_count: 50 },
      },
      ctx,
    );

    const output = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(output).toContain('1/3');
    expect(output).toContain('50');
  });

  it('handles unknown event type gracefully', () => {
    renderer.renderItem(
      {
        id: '5',
        event: 'unknown_event',
        changeset: 'test change',
        created_at: '2026-02-22T12:00:00Z',
      },
      ctx,
    );

    const output = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(output).toContain('unknown_event');
  });

  it('handles invalid timestamp gracefully', () => {
    renderer.renderItem(
      {
        id: '4',
        event: 'create',
        changeset: 'field: a → b',
        created_at: 'not-a-date',
      },
      ctx,
    );
    // Should not throw
    const output = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(output).toContain('create');
  });
});
