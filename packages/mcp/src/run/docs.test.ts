/**
 * Tests for the run_script scripting-API docs content.
 */

import { describe, it, expect } from 'vitest';

import { DOC_SECTIONS, docSectionTitles, findDocSections } from './docs.js';
import { SCRIPT_RESOURCES } from './prelude.js';

describe('DOC_SECTIONS', () => {
  it('every section has a title, summary, keywords, and body', () => {
    for (const section of DOC_SECTIONS) {
      expect(section.title).toBeTruthy();
      expect(section.summary).toBeTruthy();
      expect(section.keywords.length).toBeGreaterThan(0);
      expect(section.body).toBeTruthy();
    }
  });

  it('lists the actual script resources in the resources section', () => {
    const section = DOC_SECTIONS.find((s) => s.title === 'resources & actions');
    for (const resource of SCRIPT_RESOURCES) {
      expect(section?.body).toContain(resource);
    }
  });
});

describe('docSectionTitles', () => {
  it('returns every section title', () => {
    expect(docSectionTitles()).toEqual(DOC_SECTIONS.map((s) => s.title));
    expect(docSectionTitles()).toContain('output helpers');
  });
});

describe('findDocSections', () => {
  it('matches by keyword, title, and body', () => {
    expect(findDocSections('table').some((s) => s.title === 'output helpers')).toBe(true);
    expect(findDocSections('dry_run').some((s) => s.title === 'dry run')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(findDocSections('TABLE').some((s) => s.title === 'output helpers')).toBe(true);
  });

  it('returns nothing for a blank or unmatched query', () => {
    expect(findDocSections('  ')).toEqual([]);
    expect(findDocSections('zzqqxx-nope')).toEqual([]);
  });
});
