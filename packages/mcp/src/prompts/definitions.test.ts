import { describe, it, expect } from 'vitest';

import { PROMPT_DEFINITIONS } from './definitions.js';

describe('PROMPT_DEFINITIONS', () => {
  it('should have 5 entries', () => {
    expect(PROMPT_DEFINITIONS).toHaveLength(5);
  });

  it('should include end-of-day prompt', () => {
    const prompt = PROMPT_DEFINITIONS.find((p) => p.name === 'end-of-day');
    expect(prompt).toBeDefined();
    expect(prompt?.description).toBeTruthy();
    expect(Array.isArray(prompt?.arguments)).toBe(true);
  });

  it('should include project-review prompt', () => {
    const prompt = PROMPT_DEFINITIONS.find((p) => p.name === 'project-review');
    expect(prompt).toBeDefined();
    expect(prompt?.description).toBeTruthy();
    expect(Array.isArray(prompt?.arguments)).toBe(true);
  });

  it('should include plan-sprint prompt', () => {
    const prompt = PROMPT_DEFINITIONS.find((p) => p.name === 'plan-sprint');
    expect(prompt).toBeDefined();
    expect(prompt?.description).toBeTruthy();
    expect(Array.isArray(prompt?.arguments)).toBe(true);
  });

  it('should include weekly-report prompt', () => {
    const prompt = PROMPT_DEFINITIONS.find((p) => p.name === 'weekly-report');
    expect(prompt).toBeDefined();
    expect(prompt?.description).toBeTruthy();
    expect(Array.isArray(prompt?.arguments)).toBe(true);
  });

  it('should include invoice-prep prompt', () => {
    const prompt = PROMPT_DEFINITIONS.find((p) => p.name === 'invoice-prep');
    expect(prompt).toBeDefined();
    expect(prompt?.description).toBeTruthy();
    expect(Array.isArray(prompt?.arguments)).toBe(true);
  });

  it('should have name and description on every entry', () => {
    for (const prompt of PROMPT_DEFINITIONS) {
      expect(typeof prompt.name).toBe('string');
      expect(prompt.name.length).toBeGreaterThan(0);
      expect(typeof prompt.description).toBe('string');
      expect(prompt.description.length).toBeGreaterThan(0);
    }
  });

  it('should have valid arguments arrays on every entry', () => {
    for (const prompt of PROMPT_DEFINITIONS) {
      expect(Array.isArray(prompt.arguments)).toBe(true);
      for (const arg of prompt.arguments) {
        expect(typeof arg.name).toBe('string');
        expect(typeof arg.description).toBe('string');
        expect(typeof arg.required).toBe('boolean');
      }
    }
  });

  it('should mark project as required for project-review', () => {
    const prompt = PROMPT_DEFINITIONS.find((p) => p.name === 'project-review')!;
    const projectArg = prompt.arguments.find((a) => a.name === 'project');
    expect(projectArg?.required).toBe(true);
  });

  it('should mark project as required for plan-sprint', () => {
    const prompt = PROMPT_DEFINITIONS.find((p) => p.name === 'plan-sprint')!;
    const projectArg = prompt.arguments.find((a) => a.name === 'project');
    expect(projectArg?.required).toBe(true);
  });

  it('should mark from, to, project as required for invoice-prep', () => {
    const prompt = PROMPT_DEFINITIONS.find((p) => p.name === 'invoice-prep')!;
    const projectArg = prompt.arguments.find((a) => a.name === 'project');
    const fromArg = prompt.arguments.find((a) => a.name === 'from');
    const toArg = prompt.arguments.find((a) => a.name === 'to');
    expect(projectArg?.required).toBe(true);
    expect(fromArg?.required).toBe(true);
    expect(toArg?.required).toBe(true);
  });

  it('should mark format as optional for end-of-day', () => {
    const prompt = PROMPT_DEFINITIONS.find((p) => p.name === 'end-of-day')!;
    const formatArg = prompt.arguments.find((a) => a.name === 'format');
    expect(formatArg?.required).toBe(false);
  });

  it('should mark all arguments as optional for weekly-report', () => {
    const prompt = PROMPT_DEFINITIONS.find((p) => p.name === 'weekly-report')!;
    for (const arg of prompt.arguments) {
      expect(arg.required).toBe(false);
    }
  });
});
