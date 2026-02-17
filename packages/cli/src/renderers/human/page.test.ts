import { describe, it, expect, vi, afterEach } from 'vitest';

import { humanPageListRenderer, humanPageDetailRenderer } from './page.js';

describe('HumanPageListRenderer', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders empty list with noColor', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    humanPageListRenderer.render({ data: [] }, { noColor: true, terminalWidth: 80 });
    expect(spy.mock.calls.flat().join('')).toContain('No pages found');
  });

  it('renders empty list with colors', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    humanPageListRenderer.render({ data: [] }, { noColor: false, terminalWidth: 80 });
    expect(spy.mock.calls.flat().join('')).toContain('No pages found');
  });

  it('renders pages list with noColor', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    humanPageListRenderer.render(
      {
        data: [
          { id: '1', title: 'Page 1', body: 'Content', public: true },
          { id: '2', title: 'Page 2', body: null, public: false },
        ],
        meta: { page: 1, total_pages: 1, total_count: 2 },
      },
      { noColor: true, terminalWidth: 80 },
    );
    const output = spy.mock.calls.flat().join(' ');
    expect(output).toContain('Page 1');
    expect(output).toContain('[PUBLIC]');
    expect(output).toContain('ID: 1');
  });

  it('renders pages list with colors', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    humanPageListRenderer.render(
      {
        data: [
          { id: '1', title: 'Page 1', body: 'Content', public: true },
          { id: '2', title: null, body: null, public: false },
        ],
        meta: { page: 1, total_pages: 1, total_count: 2 },
      },
      { noColor: false, terminalWidth: 80 },
    );
    const output = spy.mock.calls.flat().join(' ');
    expect(output).toContain('Page 1');
    expect(output).toContain('Untitled');
    expect(output).toContain('ID: 1');
  });

  it('renders pages list without meta', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    humanPageListRenderer.render(
      {
        data: [{ id: '1', title: 'Page 1', body: null, public: false }],
      },
      { noColor: true, terminalWidth: 80 },
    );
    const output = spy.mock.calls.flat().join(' ');
    expect(output).toContain('Page 1');
    expect(output).not.toContain('Page 1/');
  });

  it('renders pages with long body truncation', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const longBody = 'B'.repeat(200);
    humanPageListRenderer.render(
      {
        data: [{ id: '1', title: 'Long Page', body: longBody, public: false }],
      },
      { noColor: true, terminalWidth: 80 },
    );
    const output = spy.mock.calls.flat().join(' ');
    expect(output).toContain('...');
  });

  it('renders pages with body containing newlines', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    humanPageListRenderer.render(
      {
        data: [
          {
            id: '1',
            title: 'Newline Page',
            body: 'First line\nSecond line\nThird line',
            public: false,
          },
        ],
      },
      { noColor: true, terminalWidth: 80 },
    );
    const output = spy.mock.calls.flat().join(' ');
    expect(output).toContain('First line Second line');
  });
});

describe('HumanPageDetailRenderer', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders page detail with all fields (noColor)', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    humanPageDetailRenderer.render(
      {
        id: '1',
        title: 'My Page',
        body: 'Body content',
        public: true,
        project_id: '10',
        parent_page_id: '5',
        version_number: 3,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
      { noColor: true, terminalWidth: 80 },
    );
    const output = spy.mock.calls.flat().join(' ');
    expect(output).toContain('My Page');
    expect(output).toContain('[PUBLIC]');
    expect(output).toContain('ID:');
    expect(output).toContain('Project ID:');
    expect(output).toContain('Parent page ID:');
    expect(output).toContain('Version:');
    expect(output).toContain('Body content');
    expect(output).toContain('Created:');
    expect(output).toContain('Updated:');
  });

  it('renders page detail with colors', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    humanPageDetailRenderer.render(
      {
        id: '1',
        title: 'Colored Page',
        body: 'Some body',
        public: true,
        project_id: '10',
        version_number: 1,
      },
      { noColor: false, terminalWidth: 80 },
    );
    const output = spy.mock.calls.flat().join(' ');
    expect(output).toContain('Colored Page');
    expect(output).toContain('ID:');
    expect(output).toContain('Project ID:');
  });

  it('renders page detail without optional fields', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    humanPageDetailRenderer.render(
      {
        id: '1',
        title: 'Minimal Page',
        body: null,
        public: false,
      },
      { noColor: true, terminalWidth: 80 },
    );
    const output = spy.mock.calls.flat().join(' ');
    expect(output).toContain('Minimal Page');
    expect(output).toContain('ID:');
    expect(output).not.toContain('[PUBLIC]');
    expect(output).not.toContain('Project ID:');
    expect(output).not.toContain('Parent page ID:');
    expect(output).not.toContain('Version:');
    expect(output).not.toContain('Body:');
    expect(output).not.toContain('Created:');
    expect(output).not.toContain('Updated:');
  });

  it('renders page detail with private page and colors', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    humanPageDetailRenderer.render(
      {
        id: '2',
        title: 'Private Page',
        body: 'Secret content',
        public: false,
        project_id: '20',
        parent_page_id: '1',
      },
      { noColor: false, terminalWidth: 80 },
    );
    const output = spy.mock.calls.flat().join(' ');
    expect(output).toContain('Private Page');
    expect(output).not.toContain('[PUBLIC]');
    expect(output).toContain('Parent page ID:');
  });

  it('renders page detail with version_number = 0', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    humanPageDetailRenderer.render(
      {
        id: '1',
        title: 'Zero Version',
        body: null,
        public: false,
        version_number: 0,
      },
      { noColor: true, terminalWidth: 80 },
    );
    const output = spy.mock.calls.flat().join(' ');
    expect(output).toContain('Version:');
    expect(output).toContain('0');
  });
});
