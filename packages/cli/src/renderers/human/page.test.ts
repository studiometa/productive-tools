import { describe, it, expect, vi, afterEach } from 'vitest';

import { humanPageListRenderer, humanPageDetailRenderer } from './page.js';

describe('HumanPageListRenderer', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders empty list', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    humanPageListRenderer.render({ data: [] }, { noColor: true, terminalWidth: 80 });
    expect(spy.mock.calls.flat().join('')).toContain('No pages found');
  });

  it('renders pages list', () => {
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
});

describe('HumanPageDetailRenderer', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders page detail', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    humanPageDetailRenderer.render(
      {
        id: '1',
        title: 'My Page',
        body: 'Body content',
        public: true,
        project_id: '10',
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
    expect(output).toContain('Body content');
  });
});
