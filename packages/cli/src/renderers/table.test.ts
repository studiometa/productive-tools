import { describe, it, expect, vi, afterEach } from 'vitest';

import type { RenderContext } from './types.js';

import { TableRenderer, tableRenderer } from './table.js';

const ctx: RenderContext = { noColor: false, terminalWidth: 80 };

describe('TableRenderer', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  describe('render array data', () => {
    it('renders headers, separator, and rows', () => {
      const renderer = new TableRenderer();
      renderer.render(
        [
          { id: '1', name: 'Alice' },
          { id: '2', name: 'Bob' },
        ],
        ctx,
      );

      expect(spy).toHaveBeenCalledTimes(4);
      // Header row
      expect(spy).toHaveBeenNthCalledWith(1, 'id | name ');
      // Separator
      expect(spy).toHaveBeenNthCalledWith(2, '---+------');
      // Data rows
      expect(spy).toHaveBeenNthCalledWith(3, '1  | Alice');
      expect(spy).toHaveBeenNthCalledWith(4, '2  | Bob  ');
    });

    it('renders empty array as nothing', () => {
      new TableRenderer().render([], ctx);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('column alignment', () => {
    it('pads columns to match longest value', () => {
      new TableRenderer().render(
        [
          { id: '1', name: 'Al' },
          { id: '123', name: 'Alexander' },
        ],
        ctx,
      );

      // Check that header and data are aligned
      const headerCall = spy.mock.calls[0][0];
      const row1Call = spy.mock.calls[2][0];
      const row2Call = spy.mock.calls[3][0];

      // All rows should have the same format structure
      expect(headerCall).toBe('id  | name     ');
      expect(row1Call).toBe('1   | Al       ');
      expect(row2Call).toBe('123 | Alexander');
    });

    it('handles header longer than data', () => {
      new TableRenderer().render([{ longheader: 'x' }], ctx);

      expect(spy).toHaveBeenNthCalledWith(1, 'longheader');
      expect(spy).toHaveBeenNthCalledWith(2, '----------');
      expect(spy).toHaveBeenNthCalledWith(3, 'x         ');
    });
  });

  describe('render list with pagination wrapper', () => {
    it('extracts data from { data: [...] } structure', () => {
      const renderer = new TableRenderer();
      renderer.render(
        {
          data: [
            { id: '1', title: 'Task A' },
            { id: '2', title: 'Task B' },
          ],
          meta: { page: 1, total_pages: 1, total_count: 2 },
        },
        ctx,
      );

      expect(spy).toHaveBeenCalledTimes(4);
      expect(spy).toHaveBeenNthCalledWith(1, 'id | title ');
    });
  });

  describe('render single object', () => {
    it('wraps single object as one-row table', () => {
      new TableRenderer().render({ id: '42', name: 'Single' }, ctx);

      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenNthCalledWith(1, 'id | name  ');
      expect(spy).toHaveBeenNthCalledWith(2, '---+-------');
      expect(spy).toHaveBeenNthCalledWith(3, '42 | Single');
    });
  });

  describe('render primitive', () => {
    it('outputs string as-is', () => {
      new TableRenderer().render('hello', ctx);
      expect(spy).toHaveBeenCalledWith('hello');
    });

    it('outputs number as string', () => {
      new TableRenderer().render(456, ctx);
      expect(spy).toHaveBeenCalledWith('456');
    });
  });

  describe('missing and null fields', () => {
    it('handles null values as empty strings', () => {
      new TableRenderer().render([{ id: '1', name: null }], ctx);

      expect(spy).toHaveBeenNthCalledWith(3, '1  |     ');
    });

    it('handles undefined values as empty strings', () => {
      new TableRenderer().render([{ id: '1', name: undefined }], ctx);

      expect(spy).toHaveBeenNthCalledWith(3, '1  |     ');
    });

    it('handles missing keys with empty values', () => {
      const data = [
        { id: '1', name: 'Alice', extra: 'val' },
        { id: '2', name: 'Bob' },
      ];
      new TableRenderer().render(data, ctx);

      // Header (1), separator (2), row 1 (3), row 2 (4)
      // Table renderer pads all columns to max width
      expect(spy).toHaveBeenNthCalledWith(3, '1  | Alice | val  ');
      expect(spy).toHaveBeenNthCalledWith(4, '2  | Bob   |      ');
    });
  });

  describe('special characters', () => {
    it('handles values with special characters', () => {
      new TableRenderer().render([{ text: 'hello, world' }], ctx);

      expect(spy).toHaveBeenNthCalledWith(3, 'hello, world');
    });

    it('handles values with pipe character', () => {
      new TableRenderer().render([{ text: 'a | b' }], ctx);

      // The pipe in the value doesn't need escaping, it's part of the content
      expect(spy).toHaveBeenNthCalledWith(3, 'a | b');
    });
  });

  describe('singleton instance', () => {
    it('exports a usable singleton', () => {
      tableRenderer.render([{ x: 1 }], ctx);
      expect(spy).toHaveBeenCalled();
    });
  });
});
