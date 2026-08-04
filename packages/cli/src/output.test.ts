import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { OutputFormatter, createSpinner } from './output.js';

// Mock console methods
const mockConsoleLog = vi.fn();
const mockConsoleError = vi.fn();
const mockStdoutWrite = vi.fn();
const mockProcessExit = vi.fn();

vi.stubGlobal('console', {
  log: mockConsoleLog,
  error: mockConsoleError,
});

vi.stubGlobal('process', {
  stdout: { write: mockStdoutWrite },
  stderr: { isTTY: true, write: vi.fn() },
  exit: mockProcessExit,
  env: {},
});

describe('OutputFormatter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('without outputField', () => {
    it('outputs JSON format', () => {
      const formatter = new OutputFormatter('json');
      const data = { id: '123', name: 'test' };

      formatter.output(data);

      expect(mockConsoleLog).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
    });

    it('outputs human format', () => {
      const formatter = new OutputFormatter('human');
      const data = 'test data';

      formatter.output(data);

      expect(mockConsoleLog).toHaveBeenCalledWith(data);
    });
  });

  describe('with outputField', () => {
    it('extracts and outputs a simple field', () => {
      const formatter = new OutputFormatter('human', false, 'id');
      const data = { id: '123', name: 'test' };

      formatter.output(data);

      expect(mockStdoutWrite).toHaveBeenCalledWith('123');
      expect(mockStdoutWrite).toHaveBeenCalledWith('\n');
    });

    it('extracts and outputs a nested field', () => {
      const formatter = new OutputFormatter('human', false, 'attributes.title');
      const data = {
        id: '123',
        attributes: { title: 'Test Task', number: 42 },
      };

      formatter.output(data);

      expect(mockStdoutWrite).toHaveBeenCalledWith('Test Task');
      expect(mockStdoutWrite).toHaveBeenCalledWith('\n');
    });

    it('extracts and outputs deeply nested relationship field', () => {
      const formatter = new OutputFormatter('human', false, 'relationships.project.data.id');
      const data = {
        id: '123',
        relationships: {
          project: {
            data: { id: '456', type: 'projects' },
          },
        },
      };

      formatter.output(data);

      expect(mockStdoutWrite).toHaveBeenCalledWith('456');
      expect(mockStdoutWrite).toHaveBeenCalledWith('\n');
    });

    it('handles numeric values', () => {
      const formatter = new OutputFormatter('human', false, 'attributes.number');
      const data = {
        attributes: { number: 42 },
      };

      formatter.output(data);

      expect(mockStdoutWrite).toHaveBeenCalledWith('42');
      expect(mockStdoutWrite).toHaveBeenCalledWith('\n');
    });

    it('handles boolean values', () => {
      const formatter = new OutputFormatter('human', false, 'attributes.is_completed');
      const data = {
        attributes: { is_completed: false },
      };

      formatter.output(data);

      expect(mockStdoutWrite).toHaveBeenCalledWith('false');
      expect(mockStdoutWrite).toHaveBeenCalledWith('\n');
    });

    it('handles null values', () => {
      const formatter = new OutputFormatter('human', false, 'attributes.worked_time');
      const data = {
        attributes: { worked_time: null },
      };

      formatter.output(data);

      expect(mockStdoutWrite).toHaveBeenCalledWith('null');
      expect(mockStdoutWrite).toHaveBeenCalledWith('\n');
    });

    it('handles array values', () => {
      const formatter = new OutputFormatter('human', false, 'tags');
      const data = {
        tags: ['urgent', 'bug'],
      };

      formatter.output(data);

      expect(mockStdoutWrite).toHaveBeenCalledWith('["urgent","bug"]');
      expect(mockStdoutWrite).toHaveBeenCalledWith('\n');
    });

    it('exits with error for non-existent field', () => {
      const formatter = new OutputFormatter('human', false, 'nonexistent.field');
      const data = { id: '123' };

      formatter.output(data);

      expect(mockConsoleError).toHaveBeenCalledWith(
        "Error: Field 'nonexistent.field' not found in data",
      );
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('doesnt add extra newline if value already ends with newline', () => {
      const formatter = new OutputFormatter('human', false, 'message');
      const data = { message: 'Hello\n' };

      formatter.output(data);

      expect(mockStdoutWrite).toHaveBeenCalledWith('Hello\n');
      expect(mockStdoutWrite).toHaveBeenCalledTimes(1);
    });

    it('handles empty string values correctly', () => {
      const formatter = new OutputFormatter('human', false, 'empty');
      const data = { empty: '' };

      formatter.output(data);

      expect(mockStdoutWrite).toHaveBeenCalledWith('');
      expect(mockStdoutWrite).toHaveBeenCalledWith('\n');
    });
  });
});

describe('createSpinner', () => {
  it('creates noop spinner for json format', () => {
    const spinner = createSpinner('test', 'json');

    expect(spinner.start()).toBe(spinner);
    expect(spinner.succeed()).toBe(spinner);
    expect(spinner.fail()).toBe(spinner);
    expect(spinner.stop()).toBe(spinner);
    expect(spinner.setText()).toBe(spinner);
  });

  it('creates noop spinner when outputField is specified', () => {
    const spinner = createSpinner('test', 'human', 'id');

    expect(spinner.start()).toBe(spinner);
    expect(spinner.succeed()).toBe(spinner);
    expect(spinner.fail()).toBe(spinner);
    expect(spinner.stop()).toBe(spinner);
    expect(spinner.setText()).toBe(spinner);
  });

  it('creates real spinner for human format without outputField', () => {
    const spinner = createSpinner('test', 'human');

    // Real spinner should have different behavior than noop
    // We can't test the exact implementation, but we can ensure it's created
    expect(spinner).toBeDefined();
    expect(typeof spinner.start).toBe('function');
  });
});
