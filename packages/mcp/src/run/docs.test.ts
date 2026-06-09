/**
 * Tests for the run_script scripting-API docs.
 */

import { describe, it, expect } from 'vitest';

import { searchDocs, DOC_SECTIONS } from './docs.js';
import { SCRIPT_RESOURCES } from './prelude.js';

describe('searchDocs', () => {
  it('returns the full reference when no query is given', () => {
    const docs = searchDocs();
    for (const section of DOC_SECTIONS) {
      expect(docs).toContain(`## ${section.title}`);
    }
    expect(docs).toContain('productive(resource, action, params)');
    expect(docs).toContain('output.table');
  });

  it('lists the actual script resources (derived from the prelude)', () => {
    const docs = searchDocs();
    for (const resource of SCRIPT_RESOURCES) {
      expect(docs).toContain(resource);
    }
  });

  it('filters to matching sections by keyword', () => {
    const docs = searchDocs('csv');
    expect(docs).toContain('## output helpers');
    expect(docs).not.toContain('## dry run');
  });

  it('matches on title and keyword aliases', () => {
    expect(searchDocs('dry_run')).toContain('## dry run');
    expect(searchDocs('api')).toContain('## api client (raw)');
  });

  it('is case-insensitive', () => {
    expect(searchDocs('TABLE')).toContain('## output helpers');
  });

  it('returns a topic index when nothing matches', () => {
    const docs = searchDocs('zzz-nonexistent');
    expect(docs).toContain('No sections matched');
    expect(docs).toContain('Available topics:');
    expect(docs).toContain('Overview');
  });
});
