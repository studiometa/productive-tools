import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { RenderContext } from './types.js';

import { CsvRenderer } from './csv.js';
import { JsonRenderer } from './json.js';
import { TableRenderer } from './table.js';

const defaultCtx: RenderContext = {
  noColor: true,
  terminalWidth: 80,
};

describe('JsonRenderer', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should render objects as pretty JSON', () => {
    const renderer = new JsonRenderer();
    const data = { id: '1', name: 'Test' };

    renderer.render(data, defaultCtx);

    expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
  });

  it('should render arrays as pretty JSON', () => {
    const renderer = new JsonRenderer();
    const data = [{ id: '1' }, { id: '2' }];

    renderer.render(data, defaultCtx);

    expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
  });

  it('should handle nested objects', () => {
    const renderer = new JsonRenderer();
    const data = {
      data: [{ id: '1' }],
      meta: { page: 1, total: 10 },
    };

    renderer.render(data, defaultCtx);

    expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
  });
});

describe('CsvRenderer', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should render array of objects as CSV', () => {
    const renderer = new CsvRenderer();
    const data = [
      { id: '1', name: 'Project A' },
      { id: '2', name: 'Project B' },
    ];

    renderer.render(data, defaultCtx);

    expect(consoleSpy).toHaveBeenNthCalledWith(1, 'id,name');
    expect(consoleSpy).toHaveBeenNthCalledWith(2, '1,Project A');
    expect(consoleSpy).toHaveBeenNthCalledWith(3, '2,Project B');
  });

  it('should escape values with commas', () => {
    const renderer = new CsvRenderer();
    const data = [{ id: '1', name: 'Project, with comma' }];

    renderer.render(data, defaultCtx);

    expect(consoleSpy).toHaveBeenNthCalledWith(2, '1,"Project, with comma"');
  });

  it('should escape values with quotes', () => {
    const renderer = new CsvRenderer();
    const data = [{ id: '1', name: 'Project "quoted"' }];

    renderer.render(data, defaultCtx);

    expect(consoleSpy).toHaveBeenNthCalledWith(2, '1,"Project ""quoted"""');
  });

  it('should handle list response wrapper', () => {
    const renderer = new CsvRenderer();
    const data = {
      data: [{ id: '1', name: 'Test' }],
      meta: { page: 1 },
    };

    renderer.render(data, defaultCtx);

    expect(consoleSpy).toHaveBeenNthCalledWith(1, 'id,name');
    expect(consoleSpy).toHaveBeenNthCalledWith(2, '1,Test');
  });

  it('should handle empty arrays', () => {
    const renderer = new CsvRenderer();
    renderer.render([], defaultCtx);

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('should handle null and undefined values', () => {
    const renderer = new CsvRenderer();
    const data = [{ id: '1', name: null, value: undefined }];

    renderer.render(data, defaultCtx);

    expect(consoleSpy).toHaveBeenNthCalledWith(2, '1,,');
  });

  it('should render single object as single row', () => {
    const renderer = new CsvRenderer();
    const data = { id: '1', name: 'Single Object' };

    renderer.render(data, defaultCtx);

    expect(consoleSpy).toHaveBeenNthCalledWith(1, 'id,name');
    expect(consoleSpy).toHaveBeenNthCalledWith(2, '1,Single Object');
  });

  it('should render primitive values as string', () => {
    const renderer = new CsvRenderer();
    renderer.render('primitive value', defaultCtx);

    expect(consoleSpy).toHaveBeenCalledWith('primitive value');
  });

  it('should render null as string', () => {
    const renderer = new CsvRenderer();
    renderer.render(null, defaultCtx);

    expect(consoleSpy).toHaveBeenCalledWith('null');
  });

  it('should handle values with newlines', () => {
    const renderer = new CsvRenderer();
    const data = [{ id: '1', note: 'Line1\nLine2' }];

    renderer.render(data, defaultCtx);

    expect(consoleSpy).toHaveBeenNthCalledWith(2, '1,"Line1\nLine2"');
  });
});

describe('TableRenderer', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should render array of objects as table', () => {
    const renderer = new TableRenderer();
    const data = [
      { id: '1', name: 'Project A' },
      { id: '2', name: 'Project B' },
    ];

    renderer.render(data, defaultCtx);

    // Header
    expect(consoleSpy).toHaveBeenNthCalledWith(1, 'id | name     ');
    // Separator
    expect(consoleSpy).toHaveBeenNthCalledWith(2, '---+----------');
    // Rows
    expect(consoleSpy).toHaveBeenNthCalledWith(3, '1  | Project A');
    expect(consoleSpy).toHaveBeenNthCalledWith(4, '2  | Project B');
  });

  it('should handle list response wrapper', () => {
    const renderer = new TableRenderer();
    const data = {
      data: [{ id: '1', name: 'Test' }],
      meta: { page: 1 },
    };

    renderer.render(data, defaultCtx);

    expect(consoleSpy).toHaveBeenNthCalledWith(1, 'id | name');
    expect(consoleSpy).toHaveBeenNthCalledWith(2, '---+-----');
    expect(consoleSpy).toHaveBeenNthCalledWith(3, '1  | Test');
  });

  it('should handle empty arrays', () => {
    const renderer = new TableRenderer();
    renderer.render([], defaultCtx);

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('should align columns based on longest value', () => {
    const renderer = new TableRenderer();
    const data = [
      { id: '1', name: 'A' },
      { id: '100', name: 'Very Long Name' },
    ];

    renderer.render(data, defaultCtx);

    // Column widths should be: id=3, name=14
    expect(consoleSpy).toHaveBeenNthCalledWith(1, 'id  | name          ');
    expect(consoleSpy).toHaveBeenNthCalledWith(3, '1   | A             ');
    expect(consoleSpy).toHaveBeenNthCalledWith(4, '100 | Very Long Name');
  });

  it('should render single object as single row table', () => {
    const renderer = new TableRenderer();
    const data = { id: '1', name: 'Single Object' };

    renderer.render(data, defaultCtx);

    expect(consoleSpy).toHaveBeenNthCalledWith(1, 'id | name         ');
    expect(consoleSpy).toHaveBeenNthCalledWith(2, '---+--------------');
    expect(consoleSpy).toHaveBeenNthCalledWith(3, '1  | Single Object');
  });

  it('should render primitive values as string', () => {
    const renderer = new TableRenderer();
    renderer.render('primitive value', defaultCtx);

    expect(consoleSpy).toHaveBeenCalledWith('primitive value');
  });

  it('should render null as string', () => {
    const renderer = new TableRenderer();
    renderer.render(null, defaultCtx);

    expect(consoleSpy).toHaveBeenCalledWith('null');
  });
});
