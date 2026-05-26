import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createScriptOutput } from './output.js';

describe('createScriptOutput', () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    stderrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Ensure NO_COLOR is unset so colors are enabled
    delete process.env.NO_COLOR;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('json()', () => {
    it('pretty-prints by default', () => {
      const output = createScriptOutput();
      output.json({ a: 1 });
      expect(stdoutSpy).toHaveBeenCalledWith(JSON.stringify({ a: 1 }, null, 2));
    });

    it('compact output when pretty=false', () => {
      const output = createScriptOutput();
      output.json({ a: 1 }, { pretty: false });
      expect(stdoutSpy).toHaveBeenCalledWith(JSON.stringify({ a: 1 }));
    });
  });

  describe('print()', () => {
    it('writes text to stdout', () => {
      const output = createScriptOutput();
      output.print('hello world');
      expect(stdoutSpy).toHaveBeenCalledWith('hello world');
    });
  });

  describe('success()', () => {
    it('prints a success message with ✓', () => {
      const output = createScriptOutput();
      output.success('Done');
      expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('✓ Done'));
    });
  });

  describe('error()', () => {
    it('writes to stderr with ✗', () => {
      const output = createScriptOutput();
      output.error('Oops');
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('✗ Oops'));
    });
  });

  describe('warn()', () => {
    it('prints a warning message with ⚠', () => {
      const output = createScriptOutput();
      output.warn('Careful');
      expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('⚠ Careful'));
    });
  });

  describe('info()', () => {
    it('prints an info message', () => {
      const output = createScriptOutput();
      output.info('FYI');
      expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('FYI'));
    });
  });

  describe('table()', () => {
    it('renders an array of objects as a table', () => {
      const output = createScriptOutput();
      output.table([
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
      ]);
      expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('id'));
      expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('name'));
      expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('Alice'));
    });

    it('filters to specified columns', () => {
      const output = createScriptOutput();
      output.table(
        [
          { id: '1', name: 'Alice', secret: 'x' },
          { id: '2', name: 'Bob', secret: 'y' },
        ],
        { columns: ['id', 'name'] },
      );
      // Should contain id and name headers
      const allCalls = stdoutSpy.mock.calls.flat().join(' ');
      expect(allCalls).toContain('id');
      expect(allCalls).toContain('name');
      // Should not show the 'secret' column header in the header row
      const headerRow = stdoutSpy.mock.calls[0][0] as string;
      expect(headerRow).not.toContain('secret');
    });

    it('handles empty arrays gracefully', () => {
      const output = createScriptOutput();
      output.table([]);
      // TableRenderer does nothing for empty arrays — no output expected
      expect(stdoutSpy).not.toHaveBeenCalled();
    });
  });

  describe('csv()', () => {
    it('renders an array of objects as CSV', () => {
      const output = createScriptOutput();
      output.csv([
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
      ]);
      expect(stdoutSpy).toHaveBeenCalledWith('id,name');
      expect(stdoutSpy).toHaveBeenCalledWith('1,Alice');
      expect(stdoutSpy).toHaveBeenCalledWith('2,Bob');
    });

    it('filters to specified columns', () => {
      const output = createScriptOutput();
      output.csv([{ id: '1', name: 'Alice', extra: 'x' }], { columns: ['id', 'name'] });
      expect(stdoutSpy).toHaveBeenCalledWith('id,name');
    });

    it('handles empty arrays gracefully', () => {
      const output = createScriptOutput();
      output.csv([]);
      expect(stdoutSpy).not.toHaveBeenCalled();
    });
  });

  describe('spinner() — handle form', () => {
    it('returns an object with update, stop, and fail methods', () => {
      const output = createScriptOutput();
      const sp = output.spinner('Loading…');
      expect(typeof sp.update).toBe('function');
      expect(typeof sp.stop).toBe('function');
      expect(typeof sp.fail).toBe('function');
    });

    it('stop() with a message calls succeed on the spinner', () => {
      const output = createScriptOutput();
      const sp = output.spinner('Loading…');
      // Should not throw
      expect(() => sp.stop('Done!')).not.toThrow();
    });

    it('stop() without a message stops silently', () => {
      const output = createScriptOutput();
      const sp = output.spinner('Loading…');
      expect(() => sp.stop()).not.toThrow();
    });

    it('fail() calls fail on the spinner', () => {
      const output = createScriptOutput();
      const sp = output.spinner('Loading…');
      expect(() => sp.fail('Failed!')).not.toThrow();
    });
  });

  describe('spinner() — wrap form', () => {
    it('returns a promise when a task function is provided', () => {
      const output = createScriptOutput();
      const result = output.spinner('Loading…', () => Promise.resolve(42));
      expect(result).toBeInstanceOf(Promise);
    });

    it('resolves with the task return value on success', async () => {
      const output = createScriptOutput();
      const value = await output.spinner('Loading…', () => Promise.resolve('hello'));
      expect(value).toBe('hello');
    });

    it('passes through a complex object returned by the task', async () => {
      const output = createScriptOutput();
      const data = [{ id: 1 }, { id: 2 }];
      const result = await output.spinner('Fetching…', () => Promise.resolve(data));
      expect(result).toBe(data);
    });

    it('re-throws the error when the task rejects', async () => {
      const output = createScriptOutput();
      const err = new Error('network error');
      await expect(output.spinner('Loading…', () => Promise.reject(err))).rejects.toThrow(
        'network error',
      );
    });

    it('re-throws non-Error rejections', async () => {
      const output = createScriptOutput();
      await expect(output.spinner('Loading…', () => Promise.reject('oops'))).rejects.toBe('oops');
    });
  });
});
