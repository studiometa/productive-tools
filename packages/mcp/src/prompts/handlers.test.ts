import { describe, it, expect } from 'vitest';

import { getPromptMessages } from './handlers.js';

describe('getPromptMessages', () => {
  describe('end-of-day', () => {
    it('should return messages array', () => {
      const result = getPromptMessages('end-of-day');
      expect(Array.isArray(result.messages)).toBe(true);
      expect(result.messages.length).toBeGreaterThan(0);
    });

    it('should return user role message', () => {
      const result = getPromptMessages('end-of-day');
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[0].content.type).toBe('text');
    });

    it('should instruct to call summaries.my_day', () => {
      const result = getPromptMessages('end-of-day');
      const text = result.messages[0].content.text;
      expect(text).toContain('summaries');
      expect(text).toContain('my_day');
    });

    it('should use plain format by default', () => {
      const result = getPromptMessages('end-of-day');
      const text = result.messages[0].content.text;
      expect(text).toContain('plain');
    });

    it('should use slack format when specified', () => {
      const result = getPromptMessages('end-of-day', { format: 'slack' });
      const text = result.messages[0].content.text;
      expect(text).toContain('Slack');
    });

    it('should use email format when specified', () => {
      const result = getPromptMessages('end-of-day', { format: 'email' });
      const text = result.messages[0].content.text;
      expect(text).toContain('email');
    });

    it('should work with no args', () => {
      const result = getPromptMessages('end-of-day', undefined);
      expect(result.messages.length).toBeGreaterThan(0);
    });
  });

  describe('project-review', () => {
    it('should return messages array', () => {
      const result = getPromptMessages('project-review', { project: 'PRJ-123' });
      expect(Array.isArray(result.messages)).toBe(true);
      expect(result.messages.length).toBeGreaterThan(0);
    });

    it('should include the project identifier in the message', () => {
      const result = getPromptMessages('project-review', { project: 'PRJ-456' });
      const text = result.messages[0].content.text;
      expect(text).toContain('PRJ-456');
    });

    it('should instruct to call projects context action', () => {
      const result = getPromptMessages('project-review', { project: '123' });
      const text = result.messages[0].content.text;
      expect(text).toContain('projects');
      expect(text).toContain('context');
    });

    it('should instruct to fetch tasks', () => {
      const result = getPromptMessages('project-review', { project: '123' });
      const text = result.messages[0].content.text;
      expect(text).toContain('tasks');
    });

    it('should work without project arg', () => {
      const result = getPromptMessages('project-review', undefined);
      expect(result.messages.length).toBeGreaterThan(0);
    });
  });

  describe('plan-sprint', () => {
    it('should return messages array', () => {
      const result = getPromptMessages('plan-sprint', { project: 'PRJ-123' });
      expect(Array.isArray(result.messages)).toBe(true);
      expect(result.messages.length).toBeGreaterThan(0);
    });

    it('should include the project identifier in the message', () => {
      const result = getPromptMessages('plan-sprint', { project: 'PRJ-789' });
      const text = result.messages[0].content.text;
      expect(text).toContain('PRJ-789');
    });

    it('should instruct to fetch open tasks', () => {
      const result = getPromptMessages('plan-sprint', { project: '123' });
      const text = result.messages[0].content.text;
      expect(text).toContain('tasks');
    });

    it('should instruct to fetch services', () => {
      const result = getPromptMessages('plan-sprint', { project: '123' });
      const text = result.messages[0].content.text;
      expect(text).toContain('services');
    });
  });

  describe('weekly-report', () => {
    it('should return messages array', () => {
      const result = getPromptMessages('weekly-report');
      expect(Array.isArray(result.messages)).toBe(true);
      expect(result.messages.length).toBeGreaterThan(0);
    });

    it('should instruct to call workflows.weekly_standup', () => {
      const result = getPromptMessages('weekly-report');
      const text = result.messages[0].content.text;
      expect(text).toContain('workflows');
      expect(text).toContain('weekly_standup');
    });

    it('should include person when provided', () => {
      const result = getPromptMessages('weekly-report', { person: 'user@example.com' });
      const text = result.messages[0].content.text;
      expect(text).toContain('user@example.com');
    });

    it('should instruct to resolve person and pass person_id to weekly_standup', () => {
      const result = getPromptMessages('weekly-report', { person: 'john@test.com' });
      const text = result.messages[0].content.text;
      expect(text).toContain('people');
      expect(text).toContain('resolve');
      expect(text).toContain('person_id');
    });

    it('should not include resolve step when no person provided', () => {
      const result = getPromptMessages('weekly-report');
      const text = result.messages[0].content.text;
      expect(text).not.toContain('resolve');
    });

    it('should use plain format by default', () => {
      const result = getPromptMessages('weekly-report');
      const text = result.messages[0].content.text;
      expect(text).toContain('plain');
    });

    it('should use slack format when specified', () => {
      const result = getPromptMessages('weekly-report', { format: 'slack' });
      const text = result.messages[0].content.text;
      expect(text).toContain('Slack');
    });

    it('should work with no args', () => {
      const result = getPromptMessages('weekly-report', undefined);
      expect(result.messages.length).toBeGreaterThan(0);
    });
  });

  describe('invoice-prep', () => {
    it('should return messages array', () => {
      const result = getPromptMessages('invoice-prep', {
        project: 'PRJ-123',
        from: '2025-01-01',
        to: '2025-01-31',
      });
      expect(Array.isArray(result.messages)).toBe(true);
      expect(result.messages.length).toBeGreaterThan(0);
    });

    it('should include project, from, and to in the message', () => {
      const result = getPromptMessages('invoice-prep', {
        project: 'PRJ-123',
        from: '2025-01-01',
        to: '2025-01-31',
      });
      const text = result.messages[0].content.text;
      expect(text).toContain('PRJ-123');
      expect(text).toContain('2025-01-01');
      expect(text).toContain('2025-01-31');
    });

    it('should instruct to fetch time entries', () => {
      const result = getPromptMessages('invoice-prep', {
        project: '123',
        from: '2025-01-01',
        to: '2025-01-31',
      });
      const text = result.messages[0].content.text;
      expect(text).toContain('time');
    });

    it('should instruct to fetch services', () => {
      const result = getPromptMessages('invoice-prep', {
        project: '123',
        from: '2025-01-01',
        to: '2025-01-31',
      });
      const text = result.messages[0].content.text;
      expect(text).toContain('services');
    });

    it('should instruct to fetch deals', () => {
      const result = getPromptMessages('invoice-prep', {
        project: '123',
        from: '2025-01-01',
        to: '2025-01-31',
      });
      const text = result.messages[0].content.text;
      expect(text).toContain('deals');
    });

    it('should work without args', () => {
      const result = getPromptMessages('invoice-prep', undefined);
      expect(result.messages.length).toBeGreaterThan(0);
    });
  });

  describe('unknown prompt', () => {
    it('should throw for unknown prompt name', () => {
      expect(() => getPromptMessages('not-a-real-prompt')).toThrow(
        'Unknown prompt: not-a-real-prompt',
      );
    });

    it('should throw with the prompt name in the error message', () => {
      expect(() => getPromptMessages('foo-bar')).toThrow('Unknown prompt: foo-bar');
    });
  });
});
