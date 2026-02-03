import { describe, it, expect } from 'vitest';

import { INSTRUCTIONS } from '../instructions.js';

describe('instructions', () => {
  it('should export INSTRUCTIONS as a string', () => {
    expect(typeof INSTRUCTIONS).toBe('string');
    expect(INSTRUCTIONS.length).toBeGreaterThan(0);
  });

  it('should contain tool documentation', () => {
    expect(INSTRUCTIONS).toContain('productive');
    expect(INSTRUCTIONS).toContain('resource');
    expect(INSTRUCTIONS).toContain('action');
  });

  it('should contain resources and actions table', () => {
    expect(INSTRUCTIONS).toContain('projects');
    expect(INSTRUCTIONS).toContain('time');
    expect(INSTRUCTIONS).toContain('tasks');
    expect(INSTRUCTIONS).toContain('services');
    expect(INSTRUCTIONS).toContain('people');
  });

  it('should contain time values reference', () => {
    expect(INSTRUCTIONS).toContain('MINUTES');
    expect(INSTRUCTIONS).toContain('480');
    expect(INSTRUCTIONS).toContain('8 hours');
  });

  it('should contain best practices', () => {
    expect(INSTRUCTIONS).toContain('Best Practices');
    expect(INSTRUCTIONS).toContain('Never modify text content');
    expect(INSTRUCTIONS).toContain('Never invent IDs');
    expect(INSTRUCTIONS).toContain('confirm');
  });

  it('should contain examples', () => {
    expect(INSTRUCTIONS).toContain('Examples');
    expect(INSTRUCTIONS).toContain('service_id');
    expect(INSTRUCTIONS).toContain('filter');
  });

  it('should contain filters reference', () => {
    expect(INSTRUCTIONS).toContain('Filters Reference');
    expect(INSTRUCTIONS).toContain('person_id');
    expect(INSTRUCTIONS).toContain('project_id');
  });
});
