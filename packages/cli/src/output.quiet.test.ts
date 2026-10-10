import { describe, it, expect, beforeEach, vi } from 'vitest';

import { OutputFormatter, createSpinner } from './output.js';

// Mock console methods
const consoleMocks = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

describe('OutputFormatter with --quiet flag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success messages', () => {
    it('should suppress success messages in quiet mode', () => {
      const formatter = new OutputFormatter('human', false, true);
      formatter.success('Operation completed');
      expect(consoleMocks.log).not.toHaveBeenCalled();
    });

    it('should show success messages in normal mode', () => {
      const formatter = new OutputFormatter('human', false, false);
      formatter.success('Operation completed');
      expect(consoleMocks.log).toHaveBeenCalledWith(expect.stringContaining('Operation completed'));
    });

    it('should suppress JSON success messages in quiet mode', () => {
      const formatter = new OutputFormatter('json', false, true);
      formatter.success('Operation completed');
      expect(consoleMocks.log).not.toHaveBeenCalled();
    });

    it('should show JSON success messages in normal mode', () => {
      const formatter = new OutputFormatter('json', false, false);
      formatter.success('Operation completed');
      expect(consoleMocks.log).toHaveBeenCalledWith(
        JSON.stringify({ status: 'success', message: 'Operation completed' }),
      );
    });
  });

  describe('warning messages', () => {
    it('should suppress warning messages in quiet mode', () => {
      const formatter = new OutputFormatter('human', false, true);
      formatter.warning('This is a warning');
      expect(consoleMocks.log).not.toHaveBeenCalled();
    });

    it('should show warning messages in normal mode', () => {
      const formatter = new OutputFormatter('human', false, false);
      formatter.warning('This is a warning');
      expect(consoleMocks.log).toHaveBeenCalledWith(expect.stringContaining('This is a warning'));
    });
  });

  describe('info messages', () => {
    it('should suppress info messages in quiet mode', () => {
      const formatter = new OutputFormatter('human', false, true);
      formatter.info('Information message');
      expect(consoleMocks.log).not.toHaveBeenCalled();
    });

    it('should show info messages in normal mode', () => {
      const formatter = new OutputFormatter('human', false, false);
      formatter.info('Information message');
      expect(consoleMocks.log).toHaveBeenCalledWith(expect.stringContaining('Information message'));
    });
  });

  describe('error messages', () => {
    it('should still show error messages in quiet mode but without emoji', () => {
      const formatter = new OutputFormatter('human', false, true);
      formatter.error('Something went wrong');
      // Check that the error was called once
      expect(consoleMocks.error).toHaveBeenCalledTimes(1);
      // Check that the message contains our text
      const errorCall = consoleMocks.error.mock.calls[0][0];
      expect(errorCall).toContain('Something went wrong');
      // Check that it doesn't contain the emoji
      expect(errorCall).not.toContain('✗');
    });

    it('should show error messages with emoji in normal mode', () => {
      const formatter = new OutputFormatter('human', false, false);
      formatter.error('Something went wrong');
      expect(consoleMocks.error).toHaveBeenCalledWith(
        expect.stringContaining('✗ Something went wrong'),
      );
    });

    it('should show JSON error messages in both quiet and normal mode', () => {
      const quietFormatter = new OutputFormatter('json', false, true);
      const normalFormatter = new OutputFormatter('json', false, false);

      quietFormatter.error('Error in quiet');
      normalFormatter.error('Error in normal');

      expect(consoleMocks.error).toHaveBeenCalledTimes(2);
      expect(consoleMocks.error).toHaveBeenCalledWith(
        JSON.stringify({ status: 'error', message: 'Error in quiet', details: undefined }),
      );
      expect(consoleMocks.error).toHaveBeenCalledWith(
        JSON.stringify({ status: 'error', message: 'Error in normal', details: undefined }),
      );
    });
  });

  describe('data output', () => {
    it('should still output data in quiet mode', () => {
      const formatter = new OutputFormatter('json', false, true);
      const data = { id: '123', name: 'Test' };
      formatter.output(data);
      expect(consoleMocks.log).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
    });

    it('should output data in normal mode', () => {
      const formatter = new OutputFormatter('json', false, false);
      const data = { id: '123', name: 'Test' };
      formatter.output(data);
      expect(consoleMocks.log).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
    });
  });

  describe('successWithData', () => {
    it('should output just data in quiet JSON mode', () => {
      const formatter = new OutputFormatter('json', false, true);
      const data = { id: '123', name: 'Test Resource' };
      formatter.successWithData('Resource created', data);

      expect(consoleMocks.log).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
      expect(consoleMocks.log).not.toHaveBeenCalledWith(expect.stringContaining('status'));
    });

    it('should output status wrapper in normal JSON mode', () => {
      const formatter = new OutputFormatter('json', false, false);
      const data = { id: '123', name: 'Test Resource' };
      formatter.successWithData('Resource created', data);

      expect(consoleMocks.log).toHaveBeenCalledWith(
        JSON.stringify({ status: 'success', ...data }, null, 2),
      );
    });

    it('should use regular success behavior in human format (quiet)', () => {
      const formatter = new OutputFormatter('human', false, true);
      const data = { id: '123', name: 'Test Resource' };
      formatter.successWithData('Resource created', data);

      // Should suppress the success message in quiet mode
      expect(consoleMocks.log).not.toHaveBeenCalled();
    });

    it('should use regular success behavior in human format (normal)', () => {
      const formatter = new OutputFormatter('human', false, false);
      const data = { id: '123', name: 'Test Resource' };
      formatter.successWithData('Resource created', data);

      // Should show the success message in normal mode
      expect(consoleMocks.log).toHaveBeenCalledWith(expect.stringContaining('Resource created'));
    });
  });
});

describe('createSpinner with --quiet flag', () => {
  it('should return no-op spinner in quiet mode', () => {
    const spinner = createSpinner('Loading...', 'human', true);

    // Should return a no-op spinner
    expect(spinner.start()).toBe(spinner);
    expect(spinner.succeed()).toBe(spinner);
    expect(spinner.fail()).toBe(spinner);
    expect(spinner.stop()).toBe(spinner);
    expect(spinner.setText()).toBe(spinner);
  });

  it('should return regular spinner in normal mode', () => {
    const spinner = createSpinner('Loading...', 'human', false);

    // Should return a real spinner (we can't test the exact type due to complex mocking,
    // but we can at least verify it returns an object with the expected methods)
    expect(spinner).toHaveProperty('start');
    expect(spinner).toHaveProperty('succeed');
    expect(spinner).toHaveProperty('fail');
    expect(spinner).toHaveProperty('stop');
    expect(spinner).toHaveProperty('setText');
  });

  it('should return no-op spinner for JSON format regardless of quiet flag', () => {
    const quietSpinner = createSpinner('Loading...', 'json', true);
    const normalSpinner = createSpinner('Loading...', 'json', false);

    // Both should be no-op spinners
    expect(quietSpinner.start()).toBe(quietSpinner);
    expect(normalSpinner.start()).toBe(normalSpinner);
  });
});
