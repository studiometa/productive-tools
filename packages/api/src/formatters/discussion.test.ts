import { describe, it, expect } from 'vitest';

import { formatDiscussion } from './discussion.js';

const fullDiscussion = {
  id: '1',
  type: 'discussions',
  attributes: {
    title: 'Review needed',
    body: '<p>Please review this section</p>',
    status: 1,
    created_at: '2024-01-01',
    updated_at: '2024-01-02',
    resolved_at: null,
  },
  relationships: {
    page: { data: { type: 'pages', id: '10' } },
    creator: { data: { type: 'people', id: '20' } },
  },
};

describe('formatDiscussion', () => {
  it('formats active discussion with all fields', () => {
    const r = formatDiscussion(fullDiscussion);
    expect(r.id).toBe('1');
    expect(r.title).toBe('Review needed');
    expect(r.body).toBe('Please review this section'); // HTML stripped
    expect(r.status).toBe('active');
    expect(r.status_id).toBe(1);
    expect(r.resolved_at).toBeNull();
    expect(r.page_id).toBe('10');
    expect(r.creator_id).toBe('20');
    expect(r.created_at).toBe('2024-01-01');
    expect(r.updated_at).toBe('2024-01-02');
  });

  it('formats resolved discussion', () => {
    const r = formatDiscussion({
      ...fullDiscussion,
      attributes: {
        ...fullDiscussion.attributes,
        status: 2,
        resolved_at: '2024-01-05',
      },
    });
    expect(r.status).toBe('resolved');
    expect(r.status_id).toBe(2);
    expect(r.resolved_at).toBe('2024-01-05');
  });

  it('keeps HTML when stripHtml is disabled', () => {
    const r = formatDiscussion(fullDiscussion, { stripHtml: false });
    expect(r.body).toBe('<p>Please review this section</p>');
  });

  it('returns null body when body is empty and stripHtml is disabled', () => {
    const r = formatDiscussion(
      { ...fullDiscussion, attributes: { ...fullDiscussion.attributes, body: '' } },
      { stripHtml: false },
    );
    expect(r.body).toBeNull();
  });

  it('handles missing body and title', () => {
    const r = formatDiscussion({
      id: '2',
      type: 'discussions',
      attributes: { status: 1 },
    });
    expect(r.body).toBeNull();
    expect(r.title).toBeNull();
  });

  it('excludes relationship IDs when disabled', () => {
    const r = formatDiscussion(fullDiscussion, { includeRelationshipIds: false });
    expect(r.page_id).toBeUndefined();
    expect(r.creator_id).toBeUndefined();
  });

  it('excludes timestamps when disabled', () => {
    const r = formatDiscussion(fullDiscussion, { includeTimestamps: false });
    expect(r.created_at).toBeUndefined();
    expect(r.updated_at).toBeUndefined();
  });

  it('handles unknown status', () => {
    const r = formatDiscussion({
      ...fullDiscussion,
      attributes: { ...fullDiscussion.attributes, status: 99 },
    });
    expect(r.status).toBe('unknown');
    expect(r.status_id).toBe(99);
  });

  it('defaults status to 1 when missing', () => {
    const r = formatDiscussion({
      id: '3',
      type: 'discussions',
      attributes: {},
    });
    expect(r.status_id).toBe(1);
    expect(r.status).toBe('active');
  });
});
