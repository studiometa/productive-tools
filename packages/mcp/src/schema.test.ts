import { describe, it, expect } from 'vitest';
import { parse } from 'zod';

import {
  ResourceSchema,
  ActionSchema,
  ReportTypeSchema,
  ParamDate,
  ParamTimeMinutes,
  validateToolInput,
  safeValidateToolInput,
  formatValidationErrors,
} from './schema.js';

describe('schema', () => {
  describe('ResourceSchema', () => {
    it('should accept valid resources', () => {
      expect(parse(ResourceSchema, 'projects')).toBe('projects');
      expect(parse(ResourceSchema, 'time')).toBe('time');
      expect(parse(ResourceSchema, 'tasks')).toBe('tasks');
      expect(parse(ResourceSchema, 'budgets')).toBe('budgets');
      expect(parse(ResourceSchema, 'reports')).toBe('reports');
      expect(parse(ResourceSchema, 'pages')).toBe('pages');
      expect(parse(ResourceSchema, 'discussions')).toBe('discussions');
    });

    it('should reject invalid resources', () => {
      expect(() => parse(ResourceSchema, 'invalid')).toThrow();
      expect(() => parse(ResourceSchema, '')).toThrow();
    });
  });

  describe('ActionSchema', () => {
    it('should accept valid actions', () => {
      expect(parse(ActionSchema, 'list')).toBe('list');
      expect(parse(ActionSchema, 'get')).toBe('get');
      expect(parse(ActionSchema, 'create')).toBe('create');
      expect(parse(ActionSchema, 'help')).toBe('help');
    });

    it('should accept delete action', () => {
      expect(parse(ActionSchema, 'delete')).toBe('delete');
    });

    it('should reject invalid actions', () => {
      expect(() => parse(ActionSchema, 'destroy')).toThrow();
    });

    it('should accept new actions', () => {
      expect(parse(ActionSchema, 'delete')).toBe('delete');
      expect(parse(ActionSchema, 'resolve')).toBe('resolve');
      expect(parse(ActionSchema, 'reopen')).toBe('reopen');
    });

    it('should reject truly invalid actions', () => {
      expect(() => parse(ActionSchema, 'invalid_action')).toThrow();
      expect(() => parse(ActionSchema, '')).toThrow();
    });
  });

  describe('ReportTypeSchema', () => {
    it('should accept valid report types', () => {
      expect(parse(ReportTypeSchema, 'time_reports')).toBe('time_reports');
      expect(parse(ReportTypeSchema, 'project_reports')).toBe('project_reports');
      expect(parse(ReportTypeSchema, 'budget_reports')).toBe('budget_reports');
    });

    it('should reject invalid report types', () => {
      expect(() => parse(ReportTypeSchema, 'custom_reports')).toThrow();
    });
  });

  describe('ParamDate', () => {
    it('should accept valid dates', () => {
      expect(parse(ParamDate, '2024-01-15')).toBe('2024-01-15');
      expect(parse(ParamDate, '2024-12-31')).toBe('2024-12-31');
    });

    it('should trim whitespace', () => {
      expect(parse(ParamDate, '  2024-01-15  ')).toBe('2024-01-15');
    });

    it('should reject invalid date formats', () => {
      expect(() => parse(ParamDate, '01-15-2024')).toThrow();
      expect(() => parse(ParamDate, '2024/01/15')).toThrow();
      expect(() => parse(ParamDate, 'January 15, 2024')).toThrow();
    });
  });

  describe('ParamTimeMinutes', () => {
    it('should accept valid time values', () => {
      expect(parse(ParamTimeMinutes, 60)).toBe(60);
      expect(parse(ParamTimeMinutes, 480)).toBe(480);
      expect(parse(ParamTimeMinutes, 1)).toBe(1);
      expect(parse(ParamTimeMinutes, 1440)).toBe(1440);
    });

    it('should reject values below minimum', () => {
      expect(() => parse(ParamTimeMinutes, 0)).toThrow();
      expect(() => parse(ParamTimeMinutes, -1)).toThrow();
    });

    it('should reject values above maximum', () => {
      expect(() => parse(ParamTimeMinutes, 1441)).toThrow();
    });

    it('should reject non-integer values', () => {
      expect(() => parse(ParamTimeMinutes, 60.5)).toThrow();
    });
  });

  describe('ProductiveToolInputSchema', () => {
    it('should validate minimal input', () => {
      const result = validateToolInput({
        resource: 'projects',
        action: 'list',
      });
      expect(result.resource).toBe('projects');
      expect(result.action).toBe('list');
    });

    it('should validate full input', () => {
      const result = validateToolInput({
        resource: 'time',
        action: 'create',
        person_id: '123',
        service_id: '456',
        date: '2024-01-15',
        time: 480,
        note: 'Development work',
      });
      expect(result.resource).toBe('time');
      expect(result.action).toBe('create');
      expect(result.time).toBe(480);
    });

    it('should reject missing required fields', () => {
      expect(() => validateToolInput({})).toThrow();
      expect(() => validateToolInput({ resource: 'projects' })).toThrow();
      expect(() => validateToolInput({ action: 'list' })).toThrow();
    });
  });

  describe('safeValidateToolInput', () => {
    it('should return success for valid input', () => {
      const result = safeValidateToolInput({
        resource: 'projects',
        action: 'list',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.resource).toBe('projects');
      }
    });

    it('should return error for invalid input', () => {
      const result = safeValidateToolInput({
        resource: 'invalid',
        action: 'list',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('formatValidationErrors', () => {
    it('should format validation errors', () => {
      const result = safeValidateToolInput({
        resource: 'invalid',
        action: 'invalid_action',
      });

      if (!result.success) {
        const formatted = formatValidationErrors(result.error);
        expect(formatted).toContain('**Validation Error:**');
        expect(formatted).toContain('resource');
        expect(formatted).toContain('action');
      }
    });
  });
});
