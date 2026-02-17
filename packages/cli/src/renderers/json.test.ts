import { describe, it, expect, vi, afterEach } from 'vitest';

import type { RenderContext } from './types.js';

import { JsonRenderer, jsonRenderer } from './json.js';

const ctx: RenderContext = { noColor: false, terminalWidth: 80 };

describe('JsonRenderer', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  describe('render array data', () => {
    it('outputs pretty-printed JSON array', () => {
      const renderer = new JsonRenderer();
      const data = [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
      ];
      renderer.render(data, ctx);

      expect(spy).toHaveBeenCalledTimes(1);
      const output = spy.mock.calls[0][0];
      expect(JSON.parse(output)).toEqual(data);
      expect(output).toContain('\n'); // Pretty-printed
    });

    it('renders empty array', () => {
      new JsonRenderer().render([], ctx);

      expect(spy).toHaveBeenCalledWith('[]');
    });
  });

  describe('render list with pagination', () => {
    it('includes data and meta in output', () => {
      const renderer = new JsonRenderer();
      const data = {
        data: [
          { id: '1', title: 'Task A' },
          { id: '2', title: 'Task B' },
        ],
        meta: { page: 1, total_pages: 3, total_count: 25 },
      };
      renderer.render(data, ctx);

      const output = spy.mock.calls[0][0];
      const parsed = JSON.parse(output);

      expect(parsed.data).toHaveLength(2);
      expect(parsed.meta.page).toBe(1);
      expect(parsed.meta.total_pages).toBe(3);
      expect(parsed.meta.total_count).toBe(25);
    });
  });

  describe('render single object', () => {
    it('outputs pretty-printed JSON object', () => {
      const data = { id: '42', name: 'Single Item', nested: { key: 'value' } };
      new JsonRenderer().render(data, ctx);

      const output = spy.mock.calls[0][0];
      expect(JSON.parse(output)).toEqual(data);
    });
  });

  describe('render primitives', () => {
    it('outputs string', () => {
      new JsonRenderer().render('hello', ctx);
      expect(spy).toHaveBeenCalledWith('"hello"');
    });

    it('outputs number', () => {
      new JsonRenderer().render(123, ctx);
      expect(spy).toHaveBeenCalledWith('123');
    });

    it('outputs boolean', () => {
      new JsonRenderer().render(true, ctx);
      expect(spy).toHaveBeenCalledWith('true');
    });

    it('outputs null', () => {
      new JsonRenderer().render(null, ctx);
      expect(spy).toHaveBeenCalledWith('null');
    });
  });

  describe('null and undefined handling', () => {
    it('preserves null values in objects', () => {
      const data = { id: '1', name: null };
      new JsonRenderer().render(data, ctx);

      const output = spy.mock.calls[0][0];
      expect(JSON.parse(output)).toEqual({ id: '1', name: null });
    });

    it('omits undefined values in objects (JSON behavior)', () => {
      const data = { id: '1', name: undefined };
      new JsonRenderer().render(data, ctx);

      const output = spy.mock.calls[0][0];
      expect(JSON.parse(output)).toEqual({ id: '1' });
    });
  });

  describe('special values', () => {
    it('handles nested objects', () => {
      const data = {
        user: { name: 'Alice', settings: { theme: 'dark' } },
        tags: ['a', 'b'],
      };
      new JsonRenderer().render(data, ctx);

      const output = spy.mock.calls[0][0];
      expect(JSON.parse(output)).toEqual(data);
    });

    it('handles special characters in strings', () => {
      const data = { text: 'hello\nworld\t"quoted"' };
      new JsonRenderer().render(data, ctx);

      const output = spy.mock.calls[0][0];
      expect(JSON.parse(output)).toEqual(data);
    });

    it('handles unicode characters', () => {
      const data = { emoji: '🚀', accent: 'café' };
      new JsonRenderer().render(data, ctx);

      const output = spy.mock.calls[0][0];
      expect(JSON.parse(output)).toEqual(data);
    });
  });

  describe('formatting', () => {
    it('uses 2-space indentation', () => {
      const data = { a: { b: 1 } };
      new JsonRenderer().render(data, ctx);

      const output = spy.mock.calls[0][0];
      expect(output).toContain('  "a"');
      expect(output).toContain('    "b"');
    });
  });

  describe('singleton instance', () => {
    it('exports a usable singleton', () => {
      jsonRenderer.render({ x: 1 }, ctx);
      expect(spy).toHaveBeenCalled();
    });
  });
});
