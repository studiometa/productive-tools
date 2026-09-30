import { describe, it, expect } from 'vitest';

import {
  RESOURCES,
  ACTIONS,
  MUTATING_ACTIONS,
  READ_ACTIONS,
  REPORT_TYPES,
  VALID_REPORT_TYPES,
  isMutatingCall,
  isReadCall,
} from './constants.js';

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

  describe('MUTATING_ACTIONS', () => {
    it('should list the actions that change data', () => {
      expect([...MUTATING_ACTIONS]).toEqual([
        'create',
        'update',
        'delete',
        'start',
        'stop',
        'reopen',
        'complete_task',
        'log_day',
      ]);
    });

    it('should only contain known actions', () => {
      for (const action of MUTATING_ACTIONS) {
        expect(ACTIONS).toContain(action);
      }
    });
  });

  describe('READ_ACTIONS', () => {
    it('should be ACTIONS minus MUTATING_ACTIONS, in order', () => {
      const mutating: readonly string[] = MUTATING_ACTIONS;
      expect(READ_ACTIONS).toEqual(ACTIONS.filter((action) => !mutating.includes(action)));
    });

    it('should not contain any mutating action', () => {
      for (const action of MUTATING_ACTIONS) {
        expect(READ_ACTIONS).not.toContain(action);
      }
    });

    it('should contain read actions', () => {
      for (const action of ['list', 'get', 'resolve', 'context', 'help', 'schema', 'run']) {
        expect(READ_ACTIONS).toContain(action);
      }
    });
  });

  describe('isMutatingCall', () => {
    it('should return true for mutating actions on any resource', () => {
      for (const action of MUTATING_ACTIONS) {
        expect(isMutatingCall('tasks', action)).toBe(true);
      }
    });

    it('should treat resolve as a write on discussions only', () => {
      expect(isMutatingCall('discussions', 'resolve')).toBe(true);
      expect(isMutatingCall('tasks', 'resolve')).toBe(false);
      expect(isMutatingCall('people', 'resolve')).toBe(false);
    });

    it('should return false for read actions and non-string values', () => {
      expect(isMutatingCall('tasks', 'list')).toBe(false);
      expect(isMutatingCall('tasks', 'get')).toBe(false);
      expect(isMutatingCall('discussions', 'get')).toBe(false);
      expect(isMutatingCall(undefined, undefined)).toBe(false);
      expect(isMutatingCall('tasks', 42)).toBe(false);
    });
  });

  describe('isReadCall', () => {
    it('should return true for read actions', () => {
      for (const action of READ_ACTIONS) {
        expect(isReadCall('tasks', action)).toBe(true);
      }
      expect(isReadCall('discussions', 'get')).toBe(true);
    });

    it('should return false for mutating actions and discussions resolve', () => {
      for (const action of MUTATING_ACTIONS) {
        expect(isReadCall('tasks', action)).toBe(false);
      }
      expect(isReadCall('discussions', 'resolve')).toBe(false);
    });

    it('should return false for unknown, differently cased or padded actions', () => {
      expect(isReadCall('tasks', 'unknown')).toBe(false);
      expect(isReadCall('tasks', 'Create')).toBe(false);
      expect(isReadCall('tasks', ' list')).toBe(false);
    });

    it('should return false for non-string resource or action', () => {
      expect(isReadCall('time', ['create'])).toBe(false);
      expect(isReadCall('tasks', ['list'])).toBe(false);
      expect(isReadCall('tasks', 42)).toBe(false);
      expect(isReadCall('tasks', undefined)).toBe(false);
      expect(isReadCall(['discussions'], 'get')).toBe(false);
      expect(isReadCall(undefined, 'list')).toBe(false);
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
