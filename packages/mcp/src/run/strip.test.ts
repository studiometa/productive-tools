/**
 * Tests for TypeScript stripping.
 */

import { describe, it, expect } from 'vitest';

import { stripTypes } from './strip.js';

describe('stripTypes', () => {
  it('removes type annotations', () => {
    const out = stripTypes('const x: number = 1;\nlet y: string = "a";');
    expect(out).not.toContain(': number');
    expect(out).not.toContain(': string');
    expect(out).toContain('const x');
  });

  it('strips function parameter and return types', () => {
    const out = stripTypes('function f(a: string, b: number): string { return a; }');
    expect(out).toContain('function f(a, b)');
    expect(out).not.toContain(': string');
  });

  it('lowers enums to runnable JavaScript', () => {
    const out = stripTypes('enum E { A, B }');
    expect(out).not.toContain('enum E');
    expect(out).toContain('E["A"]');
  });

  it('passes plain JavaScript through unchanged in behaviour', () => {
    const out = stripTypes('const x = 1; output.json(x);');
    expect(out).toContain('const x = 1');
    expect(out).toContain('output.json(x)');
  });

  it('returns the original source when it cannot be parsed as TypeScript', () => {
    // A genuinely broken snippet — stripping throws, so we hand back the input.
    const broken = 'const = = =;';
    expect(stripTypes(broken)).toBe(broken);
  });
});
