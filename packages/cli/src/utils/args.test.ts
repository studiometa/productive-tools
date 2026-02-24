import { describe, it, expect } from 'vitest';

import { parseArgs, getOption, hasFlag } from './args.js';

describe('parseArgs', () => {
  it('should parse command and subcommand', () => {
    const result = parseArgs(['projects', 'list']);
    expect(result.command).toEqual(['projects', 'list']);
    expect(result.positional).toEqual([]);
  });

  it('should parse long options with equals', () => {
    const result = parseArgs(['--format=json']);
    expect(result.options.format).toBe('json');
  });

  it('should parse long options with space', () => {
    const result = parseArgs(['--format', 'json']);
    expect(result.options.format).toBe('json');
  });

  it('should parse long flags', () => {
    const result = parseArgs(['--help']);
    expect(result.options.help).toBe(true);
  });

  it('should parse short options', () => {
    const result = parseArgs(['-f', 'json']);
    expect(result.options.f).toBe('json');
  });

  it('should parse short flags', () => {
    const result = parseArgs(['-h']);
    expect(result.options.h).toBe(true);
  });

  it('should parse multiple short flags', () => {
    const result = parseArgs(['-abc']);
    expect(result.options.a).toBe(true);
    expect(result.options.b).toBe(true);
    expect(result.options.c).toBe(true);
  });

  it('should parse positional arguments', () => {
    const result = parseArgs(['projects', 'get', '123']);
    expect(result.command).toEqual(['projects', 'get']);
    expect(result.positional).toEqual(['123']);
  });

  it('should parse mixed arguments', () => {
    const result = parseArgs(['time', 'list', '--format', 'json', '--page', '2', '-v']);
    expect(result.command).toEqual(['time', 'list']);
    expect(result.positional).toEqual([]);
    expect(result.options.format).toBe('json');
    expect(result.options.page).toBe('2');
    expect(result.options.v).toBe(true);
  });

  it('should handle no arguments', () => {
    const result = parseArgs([]);
    expect(result.command).toEqual([]);
    expect(result.positional).toEqual([]);
    expect(result.options).toEqual({});
  });

  it('should handle --no-color flag', () => {
    const result = parseArgs(['--no-color']);
    expect(result.options['no-color']).toBe(true);
  });

  describe('repeatable options', () => {
    it('should collect repeated --filter into array', () => {
      const result = parseArgs(['--filter', 'project_id=123', '--filter', 'status=1']);
      expect(result.options.filter).toEqual(['project_id=123', 'status=1']);
    });

    it('should collect single --filter as array', () => {
      const result = parseArgs(['--filter', 'project_id=123']);
      expect(result.options.filter).toEqual(['project_id=123']);
    });

    it('should collect repeated --field into array', () => {
      const result = parseArgs(['--field', 'a=1', '--field', 'b=2']);
      expect(result.options.field).toEqual(['a=1', 'b=2']);
    });

    it('should collect repeated --header into array', () => {
      const result = parseArgs(['--header', 'X-A: 1', '--header', 'X-B: 2']);
      expect(result.options.header).toEqual(['X-A: 1', 'X-B: 2']);
    });

    it('should collect repeated --raw-field into array', () => {
      const result = parseArgs(['--raw-field', 'a=1', '--raw-field', 'b=2']);
      expect(result.options['raw-field']).toEqual(['a=1', 'b=2']);
    });

    it('should not collect non-repeatable options into array', () => {
      const result = parseArgs(['--format', 'json', '--format', 'human']);
      expect(result.options.format).toBe('human');
    });

    it('should handle --filter=key=value syntax', () => {
      const result = parseArgs(['--filter=project_id=123', '--filter=status=1']);
      expect(result.options.filter).toEqual(['project_id=123', 'status=1']);
    });
  });
});

describe('getOption', () => {
  it('should get option by first matching name', () => {
    const options = { format: 'json', f: 'csv' };
    const result = getOption(options, ['format', 'f']);
    expect(result).toBe('json');
  });

  it('should get option by second name if first not found', () => {
    const options = { f: 'json' };
    const result = getOption(options, ['format', 'f']);
    expect(result).toBe('json');
  });

  it('should return default if not found', () => {
    const options = {};
    const result = getOption(options, ['format', 'f'], 'human');
    expect(result).toBe('human');
  });

  it('should return undefined if not found and no default', () => {
    const options = {};
    const result = getOption(options, ['format', 'f']);
    expect(result).toBeUndefined();
  });

  it('should return undefined for boolean flags', () => {
    const options = { help: true };
    const result = getOption(options, ['help']);
    expect(result).toBeUndefined();
  });

  it('should return undefined for array values', () => {
    const options = { filter: ['a=1', 'b=2'] };
    const result = getOption(options, ['filter']);
    expect(result).toBeUndefined();
  });
});

describe('hasFlag', () => {
  it('should return true if flag exists', () => {
    const options = { help: true };
    const result = hasFlag(options, ['help', 'h']);
    expect(result).toBe(true);
  });

  it('should return true for any matching name', () => {
    const options = { h: true };
    const result = hasFlag(options, ['help', 'h']);
    expect(result).toBe(true);
  });

  it('should return false if flag not found', () => {
    const options = {};
    const result = hasFlag(options, ['help', 'h']);
    expect(result).toBe(false);
  });

  it('should return false if option is string value', () => {
    const options = { help: 'yes' };
    const result = hasFlag(options, ['help']);
    expect(result).toBe(false);
  });
});
