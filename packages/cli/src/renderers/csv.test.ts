import { describe, it, expect, vi, afterEach } from 'vitest';

import type { RenderContext } from './types.js';

import { CsvRenderer, csvRenderer } from './csv.js';

const ctx: RenderContext = { noColor: false, terminalWidth: 80 };

describe('CsvRenderer', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  describe('render array data', () => {
    it('renders headers and rows', () => {
      const renderer = new CsvRenderer();
      renderer.render(
        [
          { id: '1', name: 'Alice', role: 'Dev' },
          { id: '2', name: 'Bob', role: 'Designer' },
        ],
        ctx,
      );

      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenNthCalledWith(1, 'id,name,role');
      expect(spy).toHaveBeenNthCalledWith(2, '1,Alice,Dev');
      expect(spy).toHaveBeenNthCalledWith(3, '2,Bob,Designer');
    });

    it('renders empty array as nothing', () => {
      new CsvRenderer().render([], ctx);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('render list with pagination wrapper', () => {
    it('extracts data from { data: [...] } structure', () => {
      const renderer = new CsvRenderer();
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

      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenNthCalledWith(1, 'id,title');
      expect(spy).toHaveBeenNthCalledWith(2, '1,Task A');
      expect(spy).toHaveBeenNthCalledWith(3, '2,Task B');
    });
  });

  describe('render single object', () => {
    it('wraps single object as one-row table', () => {
      new CsvRenderer().render({ id: '42', name: 'Single Item' }, ctx);

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenNthCalledWith(1, 'id,name');
      expect(spy).toHaveBeenNthCalledWith(2, '42,Single Item');
    });
  });

  describe('render primitive', () => {
    it('outputs string as-is', () => {
      new CsvRenderer().render('hello', ctx);
      expect(spy).toHaveBeenCalledWith('hello');
    });

    it('outputs number as string', () => {
      new CsvRenderer().render(123, ctx);
      expect(spy).toHaveBeenCalledWith('123');
    });
  });

  describe('CSV escaping', () => {
    it('escapes values containing commas', () => {
      new CsvRenderer().render([{ text: 'hello, world' }], ctx);

      expect(spy).toHaveBeenNthCalledWith(2, '"hello, world"');
    });

    it('escapes values containing quotes', () => {
      new CsvRenderer().render([{ text: 'say "hello"' }], ctx);

      expect(spy).toHaveBeenNthCalledWith(2, '"say ""hello"""');
    });

    it('escapes values containing newlines', () => {
      new CsvRenderer().render([{ text: 'line1\nline2' }], ctx);

      expect(spy).toHaveBeenNthCalledWith(2, '"line1\nline2"');
    });

    it('escapes complex values with multiple special characters', () => {
      new CsvRenderer().render([{ text: 'hello, "world"\nfoo' }], ctx);

      expect(spy).toHaveBeenNthCalledWith(2, '"hello, ""world""\nfoo"');
    });

    it('does not escape simple values', () => {
      new CsvRenderer().render([{ text: 'simple' }], ctx);

      expect(spy).toHaveBeenNthCalledWith(2, 'simple');
    });
  });

  describe('missing and null fields', () => {
    it('handles null values as empty strings', () => {
      new CsvRenderer().render([{ id: '1', name: null }], ctx);

      expect(spy).toHaveBeenNthCalledWith(2, '1,');
    });

    it('handles undefined values as empty strings', () => {
      new CsvRenderer().render([{ id: '1', name: undefined }], ctx);

      expect(spy).toHaveBeenNthCalledWith(2, '1,');
    });

    it('handles missing keys gracefully', () => {
      const data = [
        { id: '1', name: 'Alice', extra: 'value' },
        { id: '2', name: 'Bob' }, // missing 'extra' key
      ];
      new CsvRenderer().render(data, ctx);

      expect(spy).toHaveBeenNthCalledWith(1, 'id,name,extra');
      expect(spy).toHaveBeenNthCalledWith(2, '1,Alice,value');
      expect(spy).toHaveBeenNthCalledWith(3, '2,Bob,');
    });
  });

  describe('singleton instance', () => {
    it('exports a usable singleton', () => {
      csvRenderer.render([{ x: 1 }], ctx);
      expect(spy).toHaveBeenCalled();
    });
  });
});
