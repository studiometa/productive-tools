import { describe, it, expect, vi, afterEach } from 'vitest';

import { humanDiscussionListRenderer, humanDiscussionDetailRenderer } from './discussion.js';

describe('HumanDiscussionListRenderer', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders empty list', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    humanDiscussionListRenderer.render({ data: [] }, { noColor: true, terminalWidth: 80 });
    expect(spy.mock.calls.flat().join('')).toContain('No discussions found');
  });

  it('renders discussions list with status badges', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    humanDiscussionListRenderer.render(
      {
        data: [
          {
            id: '1',
            title: 'Review',
            body: 'Check this',
            status: 'active',
            status_id: 1,
            resolved_at: null,
          },
          {
            id: '2',
            title: 'Done',
            body: null,
            status: 'resolved',
            status_id: 2,
            resolved_at: '2024-01-05',
          },
        ],
        meta: { page: 1, total_pages: 1, total_count: 2 },
      },
      { noColor: true, terminalWidth: 80 },
    );
    const output = spy.mock.calls.flat().join(' ');
    expect(output).toContain('Review');
    expect(output).toContain('[ACTIVE]');
    expect(output).toContain('[RESOLVED]');
    expect(output).toContain('ID: 1');
  });
});

describe('HumanDiscussionDetailRenderer', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders discussion detail', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    humanDiscussionDetailRenderer.render(
      {
        id: '1',
        title: 'Topic',
        body: 'Discussion body',
        status: 'resolved',
        status_id: 2,
        resolved_at: '2024-01-05T00:00:00Z',
        page_id: '10',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
      { noColor: true, terminalWidth: 80 },
    );
    const output = spy.mock.calls.flat().join(' ');
    expect(output).toContain('Topic');
    expect(output).toContain('[RESOLVED]');
    expect(output).toContain('Discussion body');
    expect(output).toContain('Page ID:');
  });
});
