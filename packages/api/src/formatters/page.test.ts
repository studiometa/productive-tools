import { describe, it, expect } from 'vitest';

import { formatPage } from './page.js';

const fullPage = {
  id: '1',
  type: 'pages',
  attributes: {
    title: 'Getting Started',
    body: '<p>Welcome to the docs</p>',
    public: true,
    version_number: 3,
    created_at: '2024-01-01',
    updated_at: '2024-01-02',
    edited_at: '2024-01-03',
  },
  relationships: {
    project: { data: { type: 'projects', id: '10' } },
    creator: { data: { type: 'people', id: '20' } },
    parent_page: { data: { type: 'pages', id: '5' } },
  },
};

describe('formatPage', () => {
  it('formats with all fields', () => {
    const r = formatPage(fullPage);
    expect(r.id).toBe('1');
    expect(r.title).toBe('Getting Started');
    expect(r.body).toBe('Welcome to the docs'); // HTML stripped
    expect(r.public).toBe(true);
    expect(r.version_number).toBe(3);
    expect(r.project_id).toBe('10');
    expect(r.creator_id).toBe('20');
    expect(r.parent_page_id).toBe('5');
    expect(r.created_at).toBe('2024-01-01');
    expect(r.updated_at).toBe('2024-01-02');
    expect(r.edited_at).toBe('2024-01-03');
  });

  it('keeps HTML when stripHtml is disabled', () => {
    const r = formatPage(fullPage, { stripHtml: false });
    expect(r.body).toBe('<p>Welcome to the docs</p>');
  });

  it('returns null body when body is empty and stripHtml is disabled', () => {
    const r = formatPage(
      { ...fullPage, attributes: { ...fullPage.attributes, body: '' } },
      { stripHtml: false },
    );
    expect(r.body).toBeNull();
  });

  it('handles missing body', () => {
    const r = formatPage({ id: '2', type: 'pages', attributes: { title: 'Empty' } });
    expect(r.body).toBeNull();
    expect(r.title).toBe('Empty');
  });

  it('handles missing title', () => {
    const r = formatPage({ id: '3', type: 'pages', attributes: {} });
    expect(r.title).toBe('Untitled');
  });

  it('excludes relationship IDs when disabled', () => {
    const r = formatPage(fullPage, { includeRelationshipIds: false });
    expect(r.project_id).toBeUndefined();
    expect(r.creator_id).toBeUndefined();
    expect(r.parent_page_id).toBeUndefined();
  });

  it('excludes timestamps when disabled', () => {
    const r = formatPage(fullPage, { includeTimestamps: false });
    expect(r.created_at).toBeUndefined();
    expect(r.updated_at).toBeUndefined();
    expect(r.edited_at).toBeUndefined();
  });

  it('handles non-public page', () => {
    const r = formatPage({
      ...fullPage,
      attributes: { ...fullPage.attributes, public: false },
    });
    expect(r.public).toBe(false);
  });
});
