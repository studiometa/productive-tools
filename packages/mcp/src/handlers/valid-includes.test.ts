import { describe, expect, it } from 'vitest';

import { VALID_INCLUDES, validateIncludes } from './valid-includes.js';

describe('VALID_INCLUDES', () => {
  it('contains known resources', () => {
    expect(VALID_INCLUDES).toHaveProperty('tasks');
    expect(VALID_INCLUDES).toHaveProperty('comments');
    expect(VALID_INCLUDES).toHaveProperty('deals');
    expect(VALID_INCLUDES).toHaveProperty('bookings');
    expect(VALID_INCLUDES).toHaveProperty('time');
  });

  it('tasks includes are correct', () => {
    expect(VALID_INCLUDES.tasks).toContain('project');
    expect(VALID_INCLUDES.tasks).toContain('assignee');
    expect(VALID_INCLUDES.tasks).toContain('comments');
    expect(VALID_INCLUDES.tasks).toContain('subtasks');
    expect(VALID_INCLUDES.tasks).toContain('workflow_status');
    expect(VALID_INCLUDES.tasks).toContain('attachments');
    expect(VALID_INCLUDES.tasks).toContain('project.company');
  });

  it('deals includes are correct', () => {
    expect(VALID_INCLUDES.deals).toContain('company');
    expect(VALID_INCLUDES.deals).toContain('deal_status');
    expect(VALID_INCLUDES.deals).toContain('responsible');
    expect(VALID_INCLUDES.deals).toContain('project');
  });

  it('bookings includes are correct', () => {
    expect(VALID_INCLUDES.bookings).toContain('person');
    expect(VALID_INCLUDES.bookings).toContain('service');
    expect(VALID_INCLUDES.bookings).toContain('event');
  });

  it('comments includes are correct', () => {
    expect(VALID_INCLUDES.comments).toContain('creator');
    expect(VALID_INCLUDES.comments).toContain('task');
    expect(VALID_INCLUDES.comments).toContain('deal');
  });

  it('time includes are correct', () => {
    expect(VALID_INCLUDES.time).toContain('person');
    expect(VALID_INCLUDES.time).toContain('service');
    expect(VALID_INCLUDES.time).toContain('task');
  });
});

describe('validateIncludes', () => {
  describe('returns null for unknown resources', () => {
    it('returns null for projects (no include validation)', () => {
      expect(validateIncludes('projects', ['company'])).toBeNull();
    });

    it('returns null for services', () => {
      expect(validateIncludes('services', ['project'])).toBeNull();
    });

    it('returns null for people', () => {
      expect(validateIncludes('people', ['company'])).toBeNull();
    });

    it('returns null for companies', () => {
      expect(validateIncludes('companies', ['contacts'])).toBeNull();
    });

    it('returns null for completely unknown resource', () => {
      expect(validateIncludes('foobar', ['anything'])).toBeNull();
    });
  });

  describe('all valid includes', () => {
    it('returns all values as valid for tasks with valid includes', () => {
      const result = validateIncludes('tasks', ['project', 'assignee']);
      expect(result).not.toBeNull();
      expect(result!.valid).toEqual(['project', 'assignee']);
      expect(result!.invalid).toEqual([]);
      expect(result!.suggestions).toEqual({});
    });

    it('returns all values as valid for deals with valid includes', () => {
      const result = validateIncludes('deals', ['company', 'deal_status']);
      expect(result).not.toBeNull();
      expect(result!.valid).toEqual(['company', 'deal_status']);
      expect(result!.invalid).toEqual([]);
    });

    it('handles empty includes array', () => {
      const result = validateIncludes('tasks', []);
      expect(result).not.toBeNull();
      expect(result!.valid).toEqual([]);
      expect(result!.invalid).toEqual([]);
      expect(result!.suggestions).toEqual({});
    });
  });

  describe('invalid includes', () => {
    it('detects invalid include values for tasks', () => {
      const result = validateIncludes('tasks', ['project', 'notes', 'services']);
      expect(result).not.toBeNull();
      expect(result!.valid).toEqual(['project']);
      expect(result!.invalid).toEqual(['notes', 'services']);
    });

    it('provides known suggestion for "notes"', () => {
      const result = validateIncludes('tasks', ['notes']);
      expect(result!.suggestions.notes).toContain('comments');
    });

    it('provides known suggestion for "services" on deals', () => {
      const result = validateIncludes('deals', ['services']);
      expect(result!.suggestions.services).toContain('resource=services');
    });

    it('provides known suggestion for "time_entries"', () => {
      const result = validateIncludes('tasks', ['time_entries']);
      expect(result!.suggestions.time_entries).toContain('resource=time');
    });

    it('provides known suggestion for "time"', () => {
      const result = validateIncludes('tasks', ['time']);
      expect(result!.suggestions.time).toContain('resource=time');
    });

    it('provides known suggestion for "user"', () => {
      const result = validateIncludes('tasks', ['user']);
      expect(result!.suggestions.user).toContain('assignee');
    });

    it('provides known suggestion for "author"', () => {
      const result = validateIncludes('comments', ['author']);
      expect(result!.suggestions.author).toContain('creator');
    });

    it('provides known suggestion for "owner"', () => {
      const result = validateIncludes('deals', ['owner']);
      expect(result!.suggestions.owner).toContain('responsible');
    });

    it('provides generic suggestion for unknown invalid include', () => {
      const result = validateIncludes('tasks', ['foobar']);
      expect(result!.suggestions.foobar).toContain('Valid includes for tasks');
      expect(result!.suggestions.foobar).toContain('project');
      expect(result!.suggestions.foobar).toContain('assignee');
    });

    it('separates valid and invalid correctly when mixed', () => {
      const result = validateIncludes('tasks', ['project', 'foobar', 'assignee', 'nonexistent']);
      expect(result!.valid).toEqual(['project', 'assignee']);
      expect(result!.invalid).toEqual(['foobar', 'nonexistent']);
      expect(Object.keys(result!.suggestions)).toEqual(['foobar', 'nonexistent']);
    });
  });

  describe('all includes invalid', () => {
    it('returns all as invalid when none are valid', () => {
      const result = validateIncludes('comments', ['notes', 'services', 'tasks_list']);
      expect(result!.valid).toEqual([]);
      expect(result!.invalid).toEqual(['notes', 'services', 'tasks_list']);
    });
  });
});
