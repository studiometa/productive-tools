import { describe, it, expect, vi, afterEach } from 'vitest';

import { humanDiscussionListRenderer, humanDiscussionDetailRenderer } from './discussion.js';

describe('HumanDiscussionListRenderer', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders empty list with noColor', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    humanDiscussionListRenderer.render({ data: [] }, { noColor: true, terminalWidth: 80 });
    expect(spy.mock.calls.flat().join('')).toContain('No discussions found');
  });

  it('renders empty list with colors', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    humanDiscussionListRenderer.render({ data: [] }, { noColor: false, terminalWidth: 80 });
    expect(spy.mock.calls.flat().join('')).toContain('No discussions found');
  });

  it('renders discussions list with status badges (noColor)', () => {
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

  it('renders discussions list with status badges (with colors)', () => {
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
            title: null,
            body: null,
            status: 'resolved',
            status_id: 2,
            resolved_at: '2024-01-05',
          },
        ],
        meta: { page: 1, total_pages: 1, total_count: 2 },
      },
      { noColor: false, terminalWidth: 80 },
    );
    const output = spy.mock.calls.flat().join(' ');
    expect(output).toContain('Review');
    expect(output).toContain('Untitled discussion');
    expect(output).toContain('ID: 1');
  });

  it('renders discussions list without meta', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    humanDiscussionListRenderer.render(
      {
        data: [
          {
            id: '1',
            title: 'Review',
            body: null,
            status: 'active',
            status_id: 1,
            resolved_at: null,
          },
        ],
      },
      { noColor: true, terminalWidth: 80 },
    );
    const output = spy.mock.calls.flat().join(' ');
    expect(output).toContain('Review');
    expect(output).not.toContain('Page 1/');
  });

  it('renders discussions with long body truncation', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const longBody = 'A'.repeat(200);
    humanDiscussionListRenderer.render(
      {
        data: [
          {
            id: '1',
            title: 'Long Body',
            body: longBody,
            status: 'active',
            status_id: 1,
            resolved_at: null,
          },
        ],
      },
      { noColor: true, terminalWidth: 80 },
    );
    const output = spy.mock.calls.flat().join(' ');
    expect(output).toContain('...');
  });

  it('renders discussions with body containing newlines', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    humanDiscussionListRenderer.render(
      {
        data: [
          {
            id: '1',
            title: 'Newline Body',
            body: 'Line one\nLine two\nLine three',
            status: 'active',
            status_id: 1,
            resolved_at: null,
          },
        ],
      },
      { noColor: true, terminalWidth: 80 },
    );
    const output = spy.mock.calls.flat().join(' ');
    expect(output).toContain('Line one Line two');
    expect(output).not.toContain('\n');
  });
});

describe('HumanDiscussionDetailRenderer', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders discussion detail with all fields (noColor)', () => {
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
    expect(output).toContain('Resolved at:');
    expect(output).toContain('Created:');
    expect(output).toContain('Updated:');
  });

  it('renders discussion detail with colors', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    humanDiscussionDetailRenderer.render(
      {
        id: '1',
        title: 'Colored Topic',
        body: 'Body content',
        status: 'active',
        status_id: 1,
        resolved_at: null,
        page_id: '10',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
      { noColor: false, terminalWidth: 80 },
    );
    const output = spy.mock.calls.flat().join(' ');
    expect(output).toContain('Colored Topic');
    expect(output).toContain('ID:');
    expect(output).toContain('Page ID:');
  });

  it('renders discussion detail without optional fields', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    humanDiscussionDetailRenderer.render(
      {
        id: '1',
        title: null,
        body: null,
        status: 'active',
        status_id: 1,
        resolved_at: null,
      },
      { noColor: true, terminalWidth: 80 },
    );
    const output = spy.mock.calls.flat().join(' ');
    expect(output).toContain('Untitled discussion');
    expect(output).toContain('[ACTIVE]');
    expect(output).toContain('ID:');
    expect(output).not.toContain('Page ID:');
    expect(output).not.toContain('Resolved at:');
    expect(output).not.toContain('Body:');
    expect(output).not.toContain('Created:');
    expect(output).not.toContain('Updated:');
  });

  it('renders discussion detail with resolved status and colors', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    humanDiscussionDetailRenderer.render(
      {
        id: '1',
        title: 'Resolved Issue',
        body: 'This was resolved',
        status: 'resolved',
        status_id: 2,
        resolved_at: '2024-01-10T12:00:00Z',
        page_id: '5',
      },
      { noColor: false, terminalWidth: 80 },
    );
    const output = spy.mock.calls.flat().join(' ');
    expect(output).toContain('Resolved Issue');
    expect(output).toContain('2024-01-10');
  });
});
