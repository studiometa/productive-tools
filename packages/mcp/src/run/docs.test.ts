/**
 * Tests for the run_script scripting-API docs.
 */

import { describe, it, expect } from 'vitest';

import { searchDocs, findDocSections, DOC_SECTIONS } from './docs.js';
import { SCRIPT_RESOURCES } from './prelude.js';

describe('searchDocs', () => {
  it('returns a compact table of contents when no query is given', () => {
    const docs = searchDocs();
    // Lists every section title and its summary as a bullet...
    for (const section of DOC_SECTIONS) {
      expect(docs).toContain(`**${section.title}**`);
      expect(docs).toContain(section.summary);
    }
    expect(docs).toContain('Call this tool again with a `query`');
    // ...but does NOT inline the full section bodies.
    expect(docs).not.toContain('## productive client');
    expect(docs).not.toContain('output.table(rows)');
  });

  it('returns full section bodies only when queried', () => {
    const docs = searchDocs('productive');
    expect(docs).toContain('## productive client');
    expect(docs).toContain('productive(resource, action, params)');
  });

  it('lists the actual script resources when querying that topic', () => {
    const docs = searchDocs('resources');
    expect(docs).toContain('## resources & actions');
    for (const resource of SCRIPT_RESOURCES) {
      expect(docs).toContain(resource);
    }
  });

  it('filters to matching sections by keyword', () => {
    const docs = searchDocs('csv');
    expect(docs).toContain('## output helpers');
    expect(docs).not.toContain('## dry run');
  });

  it('findDocSections returns matching section objects', () => {
    const sections = findDocSections('table');
    expect(sections.some((s) => s.title === 'output helpers')).toBe(true);
    expect(findDocSections('zzqqxx-nope')).toEqual([]);
  });

  it('matches on title and keyword aliases', () => {
    expect(searchDocs('dry_run')).toContain('## dry run');
    expect(searchDocs('api')).toContain('## api client (raw)');
  });

  it('is case-insensitive', () => {
    expect(searchDocs('TABLE')).toContain('## output helpers');
  });

  it('falls back to the table of contents when nothing matches', () => {
    const docs = searchDocs('zzz-nonexistent');
    expect(docs).toContain('No sections matched');
    expect(docs).toContain('Call this tool again with a `query`');
    expect(docs).toContain('**Overview**');
  });
});
