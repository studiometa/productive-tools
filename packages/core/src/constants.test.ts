import { describe, it, expect } from 'vitest';

import { RESOURCES, ACTIONS, REPORT_TYPES, VALID_REPORT_TYPES } from './constants.js';

describe('constants', () => {
  describe('RESOURCES', () => {
    it('should be a non-empty readonly array', () => {
      expect(Array.isArray(RESOURCES)).toBe(true);
      expect(RESOURCES.length).toBeGreaterThan(0);
    });

    it('should contain core resources', () => {
      expect(RESOURCES).toContain('projects');
      expect(RESOURCES).toContain('tasks');
      expect(RESOURCES).toContain('time');
      expect(RESOURCES).toContain('people');
      expect(RESOURCES).toContain('pages');
      expect(RESOURCES).toContain('reports');
    });

    it('should have unique values', () => {
      const unique = new Set(RESOURCES);
      expect(unique.size).toBe(RESOURCES.length);
    });
  });

  describe('ACTIONS', () => {
    it('should be a non-empty readonly array', () => {
      expect(Array.isArray(ACTIONS)).toBe(true);
      expect(ACTIONS.length).toBeGreaterThan(0);
    });

    it('should contain core actions', () => {
      expect(ACTIONS).toContain('list');
      expect(ACTIONS).toContain('get');
      expect(ACTIONS).toContain('create');
      expect(ACTIONS).toContain('update');
      expect(ACTIONS).toContain('help');
    });

    it('should have unique values', () => {
      const unique = new Set(ACTIONS);
      expect(unique.size).toBe(ACTIONS.length);
    });
  });

  describe('REPORT_TYPES', () => {
    it('should be a non-empty readonly array', () => {
      expect(Array.isArray(REPORT_TYPES)).toBe(true);
      expect(REPORT_TYPES.length).toBeGreaterThan(0);
    });

    it('should contain core report types', () => {
      expect(REPORT_TYPES).toContain('time_reports');
      expect(REPORT_TYPES).toContain('project_reports');
      expect(REPORT_TYPES).toContain('budget_reports');
    });

    it('should have unique values', () => {
      const unique = new Set(REPORT_TYPES);
      expect(unique.size).toBe(REPORT_TYPES.length);
    });
  });

  describe('VALID_REPORT_TYPES (deprecated alias)', () => {
    it('should contain the same values as REPORT_TYPES', () => {
      expect(VALID_REPORT_TYPES).toEqual([...REPORT_TYPES]);
    });
  });
});
