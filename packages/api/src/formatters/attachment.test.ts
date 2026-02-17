import { describe, it, expect } from 'vitest';

import { formatAttachment, formatBytes } from './attachment.js';

const fullAttachment = {
  id: '1',
  type: 'attachments',
  attributes: {
    name: 'screenshot.png',
    content_type: 'image/png',
    size: 204800,
    url: 'https://cdn.example.com/screenshot.png',
    attachable_type: 'Task',
    created_at: '2024-01-15T10:00:00Z',
  },
};

describe('formatBytes', () => {
  it('formats 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats bytes', () => {
    expect(formatBytes(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('formats megabytes', () => {
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(204800)).toBe('200 KB');
  });

  it('formats gigabytes', () => {
    expect(formatBytes(1073741824)).toBe('1 GB');
  });
});

describe('formatAttachment', () => {
  it('formats with all fields', () => {
    const r = formatAttachment(fullAttachment);
    expect(r.id).toBe('1');
    expect(r.name).toBe('screenshot.png');
    expect(r.content_type).toBe('image/png');
    expect(r.size).toBe(204800);
    expect(r.size_human).toBe('200 KB');
    expect(r.url).toBe('https://cdn.example.com/screenshot.png');
    expect(r.attachable_type).toBe('Task');
    expect(r.created_at).toBe('2024-01-15T10:00:00Z');
  });

  it('handles missing attributes', () => {
    const r = formatAttachment({ id: '2', type: 'attachments', attributes: {} });
    expect(r.name).toBe('');
    expect(r.content_type).toBe('');
    expect(r.size).toBe(0);
    expect(r.size_human).toBe('0 B');
    expect(r.url).toBe('');
    expect(r.attachable_type).toBeUndefined();
  });

  it('excludes timestamps when disabled', () => {
    const r = formatAttachment(fullAttachment, { includeTimestamps: false });
    expect(r.created_at).toBeUndefined();
  });

  it('includes timestamps by default', () => {
    const r = formatAttachment(fullAttachment);
    expect(r.created_at).toBe('2024-01-15T10:00:00Z');
  });

  it('handles missing attachable_type', () => {
    const r = formatAttachment({
      id: '3',
      type: 'attachments',
      attributes: {
        name: 'file.pdf',
        content_type: 'application/pdf',
        size: 1024,
        url: 'https://cdn.example.com/file.pdf',
      },
    });
    expect(r.attachable_type).toBeUndefined();
  });
});
