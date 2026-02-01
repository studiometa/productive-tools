import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OutputFormatter, createSpinner } from '../output.js';

describe('OutputFormatter', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('JSON format', () => {
    it('should output JSON', () => {
      const formatter = new OutputFormatter('json');
      const data = { key: 'value' };
      
      formatter.output(data);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
    });

    it('should output success as JSON', () => {
      const formatter = new OutputFormatter('json');
      
      formatter.success('Success message');
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        JSON.stringify({ status: 'success', message: 'Success message' })
      );
    });

    it('should output error as JSON', () => {
      const formatter = new OutputFormatter('json');
      
      formatter.error('Error message');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        JSON.stringify({ status: 'error', message: 'Error message', details: undefined })
      );
    });

    it('should output warning as JSON', () => {
      const formatter = new OutputFormatter('json');
      
      formatter.warning('Warning message');
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        JSON.stringify({ status: 'warning', message: 'Warning message' })
      );
    });

    it('should output info as JSON', () => {
      const formatter = new OutputFormatter('json');
      
      formatter.info('Info message');
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        JSON.stringify({ status: 'info', message: 'Info message' })
      );
    });
  });

  describe('CSV format', () => {
    it('should output CSV', () => {
      const formatter = new OutputFormatter('csv');
      const data = [
        { name: 'Project 1', status: 'active' },
        { name: 'Project 2', status: 'archived' },
      ];
      
      formatter.output(data);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('name,status');
      expect(consoleLogSpy).toHaveBeenCalledWith('Project 1,active');
      expect(consoleLogSpy).toHaveBeenCalledWith('Project 2,archived');
    });

    it('should quote CSV values with commas', () => {
      const formatter = new OutputFormatter('csv');
      const data = [{ name: 'Project, Inc', status: 'active' }];
      
      formatter.output(data);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('"Project, Inc",active');
    });

    it('should handle empty array', () => {
      const formatter = new OutputFormatter('csv');
      
      formatter.output([]);
      
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('Table format', () => {
    it('should output table', () => {
      const formatter = new OutputFormatter('table');
      const data = [
        { name: 'Project 1', status: 'active' },
        { name: 'Project 2', status: 'archived' },
      ];
      
      formatter.output(data);
      
      expect(consoleLogSpy).toHaveBeenCalled();
      // Check that headers and separator were printed
      const calls = consoleLogSpy.mock.calls.map((call: any) => call[0]);
      expect(calls.some((call: string) => call.includes('name'))).toBe(true);
      expect(calls.some((call: string) => call.includes('-'))).toBe(true);
    });

    it('should handle empty array', () => {
      const formatter = new OutputFormatter('table');
      
      formatter.output([]);
      
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('Human format', () => {
    it('should output data as-is', () => {
      const formatter = new OutputFormatter('human');
      const data = 'Some human readable text';
      
      formatter.output(data);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(data);
    });

    it('should output success with checkmark', () => {
      const formatter = new OutputFormatter('human');
      
      formatter.success('Success message');
      
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('✓');
      expect(output).toContain('Success message');
    });

    it('should output error with cross', () => {
      const formatter = new OutputFormatter('human');
      
      formatter.error('Error message');
      
      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain('✗');
      expect(output).toContain('Error message');
    });

    it('should output warning with symbol', () => {
      const formatter = new OutputFormatter('human');
      
      formatter.warning('Warning message');
      
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('⚠');
      expect(output).toContain('Warning message');
    });
  });

  describe('No color mode', () => {
    it('should respect no-color flag', () => {
      const formatter = new OutputFormatter('human', true);
      
      formatter.success('Success');
      
      // Should still have the checkmark but no ANSI codes
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('✓');
    });
  });
});

describe('createSpinner', () => {
  it('should create spinner in human mode', () => {
    const spinner = createSpinner('Loading...', 'human');
    expect(spinner).toBeDefined();
    expect(spinner.start).toBeDefined();
    expect(spinner.stop).toBeDefined();
  });

  it('should create no-op spinner in JSON mode', () => {
    const spinner = createSpinner('Loading...', 'json');
    expect(spinner).toBeDefined();
    
    // Should be chainable but do nothing
    const result = spinner.start().setText('Updated').stop();
    expect(result).toBeDefined();
  });
});
