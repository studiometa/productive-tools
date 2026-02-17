import { describe, it, expect } from 'vitest';

import { formatComment } from '../comment.js';

const fullComment = {
  id: '1',
  type: 'comments',
  attributes: {
    body: '<p>Great work!</p>',
    commentable_type: 'Task',
    draft: false,
    pinned_at: '2024-01-01',
    hidden: false,
    created_at: '2024-01-01',
    updated_at: '2024-01-02',
  },
  relationships: {
    creator: { data: { type: 'people', id: '10' } },
  },
};

const included = [
  { id: '10', type: 'people', attributes: { first_name: 'Jane', last_name: 'Doe' } },
];

describe('formatComment', () => {
  it('formats with all fields and includes', () => {
    const r = formatComment(fullComment, { included });
    expect(r.id).toBe('1');
    expect(r.body).toBe('Great work!'); // HTML stripped
    expect(r.commentable_type).toBe('Task');
    expect(r.draft).toBe(false);
    expect(r.pinned).toBe(true);
    expect(r.hidden).toBe(false);
    expect(r.creator_id).toBe('10');
    expect(r.creator_name).toBe('Jane Doe');
  });

  it('keeps HTML when stripHtml is disabled', () => {
    const r = formatComment(fullComment, { stripHtml: false });
    expect(r.body).toBe('<p>Great work!</p>');
  });

  it('handles unpinned comment', () => {
    const r = formatComment({
      ...fullComment,
      attributes: { ...fullComment.attributes, pinned_at: null },
    });
    expect(r.pinned).toBe(false);
  });

  it('handles missing body', () => {
    const r = formatComment({ id: '2', type: 'comments', attributes: {} });
    expect(r.body).toBe('');
    expect(r.commentable_type).toBe('');
    expect(r.draft).toBe(false);
    expect(r.hidden).toBe(false);
  });

  it('excludes creator_id when relationship IDs disabled', () => {
    const r = formatComment(fullComment, { includeRelationshipIds: false });
    expect(r.creator_id).toBeUndefined();
  });

  it('excludes timestamps when disabled', () => {
    const r = formatComment(fullComment, { includeTimestamps: false });
    expect(r.created_at).toBeUndefined();
    expect(r.updated_at).toBeUndefined();
  });

  it('handles missing creator in included', () => {
    const r = formatComment(fullComment, { included: [] });
    expect(r.creator_name).toBeUndefined();
  });
});
