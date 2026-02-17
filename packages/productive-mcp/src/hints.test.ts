/**
 * Tests for contextual hints
 */

import { describe, expect, it } from 'vitest';

import {
  getTaskHints,
  getProjectHints,
  getDealHints,
  getPersonHints,
  getServiceHints,
  getCompanyHints,
  getTimeEntryHints,
  getCommentHints,
  getBookingHints,
  getTimerHints,
} from './hints.js';

describe('hints', () => {
  describe('getTaskHints', () => {
    it('returns hints with task ID', () => {
      const hints = getTaskHints('12345');

      expect(hints.related_resources).toBeDefined();
      expect(hints.related_resources).toHaveLength(3);

      // Check comments hint
      const commentsHint = hints.related_resources?.find((h) => h.resource === 'comments');
      expect(commentsHint).toBeDefined();
      expect(commentsHint?.example).toEqual({
        resource: 'comments',
        action: 'list',
        filter: { task_id: '12345' },
      });

      // Check time hint
      const timeHint = hints.related_resources?.find((h) => h.resource === 'time');
      expect(timeHint).toBeDefined();
      expect(timeHint?.example).toEqual({
        resource: 'time',
        action: 'list',
        filter: { task_id: '12345' },
      });

      // Check common actions
      expect(hints.common_actions).toBeDefined();
      expect(hints.common_actions).toHaveLength(1);
      expect(hints.common_actions?.[0].action).toBe('Add a comment');
    });

    it('includes time logging hint when service ID is provided', () => {
      const hints = getTaskHints('12345', '67890');

      expect(hints.common_actions).toHaveLength(2);
      const timeAction = hints.common_actions?.find((a) => a.action === 'Log time on this task');
      expect(timeAction).toBeDefined();
      expect(timeAction?.example.service_id).toBe('67890');
      expect(timeAction?.example.task_id).toBe('12345');
    });
  });

  describe('getProjectHints', () => {
    it('returns hints with project ID', () => {
      const hints = getProjectHints('12345');

      expect(hints.related_resources).toBeDefined();
      expect(hints.related_resources?.length).toBeGreaterThan(0);

      // Check tasks hint
      const tasksHint = hints.related_resources?.find((h) => h.resource === 'tasks');
      expect(tasksHint).toBeDefined();
      expect(tasksHint?.example).toEqual({
        resource: 'tasks',
        action: 'list',
        filter: { project_id: '12345' },
      });

      // Check services hint
      const servicesHint = hints.related_resources?.find((h) => h.resource === 'services');
      expect(servicesHint).toBeDefined();
    });
  });

  describe('getDealHints', () => {
    it('returns hints with deal ID', () => {
      const hints = getDealHints('12345');

      expect(hints.related_resources).toBeDefined();

      // Check comments hint
      const commentsHint = hints.related_resources?.find((h) => h.resource === 'comments');
      expect(commentsHint).toBeDefined();
      expect(commentsHint?.example).toEqual({
        resource: 'comments',
        action: 'list',
        filter: { deal_id: '12345' },
      });
    });
  });

  describe('getPersonHints', () => {
    it('returns hints with person ID', () => {
      const hints = getPersonHints('12345');

      expect(hints.related_resources).toBeDefined();

      // Check tasks hint
      const tasksHint = hints.related_resources?.find((h) => h.resource === 'tasks');
      expect(tasksHint).toBeDefined();
      expect(tasksHint?.example).toEqual({
        resource: 'tasks',
        action: 'list',
        filter: { assignee_id: '12345' },
      });

      // Check time hint
      const timeHint = hints.related_resources?.find((h) => h.resource === 'time');
      expect(timeHint).toBeDefined();
    });
  });

  describe('getServiceHints', () => {
    it('returns hints with service ID', () => {
      const hints = getServiceHints('12345');

      expect(hints.related_resources).toBeDefined();
      expect(hints.common_actions).toBeDefined();

      // Check time hint
      const timeHint = hints.related_resources?.find((h) => h.resource === 'time');
      expect(timeHint).toBeDefined();

      // Check start timer action
      const timerAction = hints.common_actions?.find((a) => a.action === 'Start a timer');
      expect(timerAction).toBeDefined();
      expect(timerAction?.example.service_id).toBe('12345');
    });
  });

  describe('getCompanyHints', () => {
    it('returns hints with company ID', () => {
      const hints = getCompanyHints('12345');

      expect(hints.related_resources).toBeDefined();

      // Check projects hint
      const projectsHint = hints.related_resources?.find((h) => h.resource === 'projects');
      expect(projectsHint).toBeDefined();
      expect(projectsHint?.example).toEqual({
        resource: 'projects',
        action: 'list',
        filter: { company_id: '12345' },
      });
    });
  });

  describe('getTimeEntryHints', () => {
    it('returns hints with time entry ID', () => {
      const hints = getTimeEntryHints('12345');

      expect(hints.common_actions).toBeDefined();
      expect(hints.common_actions?.[0].action).toBe('Update this time entry');
    });

    it('includes task hint when task ID is provided', () => {
      const hints = getTimeEntryHints('12345', '67890');

      const taskHint = hints.related_resources?.find((h) => h.resource === 'tasks');
      expect(taskHint).toBeDefined();
      expect(taskHint?.example.id).toBe('67890');
    });

    it('includes service hint when service ID is provided', () => {
      const hints = getTimeEntryHints('12345', undefined, '67890');

      const serviceHint = hints.related_resources?.find((h) => h.resource === 'services');
      expect(serviceHint).toBeDefined();
      expect(serviceHint?.example.id).toBe('67890');
    });
  });

  describe('getCommentHints', () => {
    it('returns hints for task comment', () => {
      const hints = getCommentHints('12345', 'task', '67890');

      const taskHint = hints.related_resources?.find((h) => h.resource === 'tasks');
      expect(taskHint).toBeDefined();
      expect(taskHint?.example.id).toBe('67890');
    });

    it('returns hints for deal comment', () => {
      const hints = getCommentHints('12345', 'deal', '67890');

      const dealHint = hints.related_resources?.find((h) => h.resource === 'deals');
      expect(dealHint).toBeDefined();
      expect(dealHint?.example.id).toBe('67890');
    });

    it('returns empty hints when no commentable info', () => {
      const hints = getCommentHints('12345');

      expect(hints.related_resources).toEqual([]);
    });
  });

  describe('getBookingHints', () => {
    it('returns hints with booking ID', () => {
      const hints = getBookingHints('12345');

      expect(hints.common_actions).toBeDefined();
      expect(hints.common_actions?.[0].action).toBe('Update this booking');
    });

    it('includes person hint when person ID is provided', () => {
      const hints = getBookingHints('12345', '67890');

      const personHint = hints.related_resources?.find((h) => h.resource === 'people');
      expect(personHint).toBeDefined();
      expect(personHint?.example.id).toBe('67890');
    });
  });

  describe('getTimerHints', () => {
    it('returns hints with timer ID', () => {
      const hints = getTimerHints('12345');

      expect(hints.common_actions).toBeDefined();
      expect(hints.common_actions?.[0].action).toBe('Stop this timer');
      expect(hints.common_actions?.[0].example.id).toBe('12345');
    });

    it('includes service hint when service ID is provided', () => {
      const hints = getTimerHints('12345', '67890');

      const serviceHint = hints.related_resources?.find((h) => h.resource === 'services');
      expect(serviceHint).toBeDefined();
      expect(serviceHint?.example.id).toBe('67890');
    });
  });
});
