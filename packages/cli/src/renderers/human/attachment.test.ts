import { describe, it, expect, vi, afterEach } from 'vitest';

import { humanAttachmentListRenderer, humanAttachmentDetailRenderer } from './attachment.js';

describe('HumanAttachmentListRenderer', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('renders empty state', () => {
    humanAttachmentListRenderer.render({ data: [] }, { noColor: true, terminalWidth: 80 });
    expect(spy).toHaveBeenCalledWith('No attachments found');
  });

  it('renders list with pagination', () => {
    humanAttachmentListRenderer.render(
      {
        data: [
          {
            id: '1',
            name: 'screenshot.png',
            content_type: 'image/png',
            size: 204800,
            size_human: '200 KB',
            url: 'https://cdn.example.com/screenshot.png',
            attachable_type: 'Task',
          },
        ],
        meta: { page: 1, total_pages: 2, total_count: 15 },
      },
      { noColor: true, terminalWidth: 80 },
    );
    const output = spy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('screenshot.png');
    expect(output).toContain('image/png');
    expect(output).toContain('200 KB');
    expect(output).toContain('ID: 1');
    expect(output).toContain('[Task]');
    expect(output).toContain('Page 1/2 (15 total)');
  });
});

describe('HumanAttachmentDetailRenderer', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('renders detail view', () => {
    humanAttachmentDetailRenderer.render(
      {
        id: '1',
        name: 'document.pdf',
        content_type: 'application/pdf',
        size: 1048576,
        size_human: '1 MB',
        url: 'https://cdn.example.com/document.pdf',
        attachable_type: 'Deal',
        created_at: '2024-01-15T10:00:00Z',
      },
      { noColor: true, terminalWidth: 80 },
    );
    const output = spy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toContain('document.pdf');
    expect(output).toContain('application/pdf');
    expect(output).toContain('1 MB');
    expect(output).toContain('Deal');
    expect(output).toContain('2024-01-15');
  });
});
