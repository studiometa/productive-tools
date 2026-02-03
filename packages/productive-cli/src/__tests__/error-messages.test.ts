import { describe, it, expect } from 'vitest';

import { ErrorMessages } from '../error-messages.js';
import { ValidationError, ConfigError } from '../errors.js';

describe('ErrorMessages', () => {
  describe('missingId', () => {
    it('should create error with resource-specific hints', () => {
      const error = ErrorMessages.missingId('get', 'time');
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('id is required');
      expect(error.hints).toContain('Usage: productive time get <id>');
      expect(error.hints).toContain('Find IDs using: productive time list --format json');
    });
  });

  describe('missingRequiredFields', () => {
    it('should create error for single field', () => {
      const error = ErrorMessages.missingRequiredFields('time entry', ['service']);
      expect(error.message).toBe('service is required for creating time entry');
      expect(error.hints).toContain('Provide all required fields: --service');
    });

    it('should create error for multiple fields', () => {
      const error = ErrorMessages.missingRequiredFields('time entry', ['service', 'time', 'date']);
      expect(error.message).toBe('service, time, date are required for creating time entry');
      expect(error.hints).toContain('Provide all required fields: --service --time --date');
    });
  });

  describe('time entry errors', () => {
    it('missingService should provide helpful hints', () => {
      const error = ErrorMessages.missingService();
      expect(error.message).toBe('service is required');
      expect(error.hints).toContain(
        'Find services using: productive services list --project <project_id>',
      );
    });

    it('missingTime should provide examples', () => {
      const error = ErrorMessages.missingTime();
      expect(error.message).toBe('time is required');
      expect(error.hints).toContain('Examples: --time 60 (1 hour), --time 480 (8 hours)');
    });

    it('missingPersonId should return ConfigError', () => {
      const error = ErrorMessages.missingPersonId();
      expect(error).toBeInstanceOf(ConfigError);
      expect(error.message).toContain('User ID not configured');
    });
  });

  describe('task errors', () => {
    it('missingTitle should provide hints', () => {
      const error = ErrorMessages.missingTitle();
      expect(error.message).toBe('title is required');
      expect(error.hints).toContain('Provide a title using: --title "Task title"');
    });

    it('missingTaskList should provide hints', () => {
      const error = ErrorMessages.missingTaskList();
      expect(error.message).toBe('task-list is required');
    });
  });

  describe('comment errors', () => {
    it('missingBody should provide hints', () => {
      const error = ErrorMessages.missingBody();
      expect(error.message).toBe('body is required');
    });

    it('missingCommentTarget should list all target options', () => {
      const error = ErrorMessages.missingCommentTarget();
      expect(error.message).toBe('A target is required for creating a comment');
      expect(error.hints).toContain('Provide one of: --task <id>, --deal <id>, or --company <id>');
    });
  });

  describe('booking errors', () => {
    it('missingBookingTarget should provide hints', () => {
      const error = ErrorMessages.missingBookingTarget();
      expect(error.message).toBe('A service or event is required for creating a booking');
      expect(error.hints).toContain('Provide either: --service <id> or --event <id>');
    });

    it('missingBookingPerson should provide hints', () => {
      const error = ErrorMessages.missingBookingPerson();
      expect(error.message).toBe('person is required');
    });
  });

  describe('timer errors', () => {
    it('missingTimerService should provide hints', () => {
      const error = ErrorMessages.missingTimerService();
      expect(error.message).toBe('service is required');
      expect(error.hints).toContain(
        'Then start timer with: productive timers start --service <service_id>',
      );
    });
  });

  describe('deal errors', () => {
    it('missingDealName should provide hints', () => {
      const error = ErrorMessages.missingDealName();
      expect(error.message).toBe('name is required');
    });

    it('missingDealCompany should provide hints', () => {
      const error = ErrorMessages.missingDealCompany();
      expect(error.message).toBe('company is required');
      expect(error.hints).toContain('Find companies using: productive companies list');
    });
  });

  describe('company errors', () => {
    it('missingCompanyName should provide hints', () => {
      const error = ErrorMessages.missingCompanyName();
      expect(error.message).toBe('name is required');
    });
  });

  describe('report errors', () => {
    it('invalidReportType should list valid types', () => {
      const error = ErrorMessages.invalidReportType('invalid', ['time', 'project', 'budget']);
      expect(error.message).toContain('Invalid report type');
      expect(error.message).toContain('must be one of: time, project, budget');
    });
  });

  describe('generic errors', () => {
    it('noUpdatesSpecified should list available fields', () => {
      const error = ErrorMessages.noUpdatesSpecified('time', ['time', 'note', 'date']);
      expect(error.message).toContain('No updates specified');
      expect(error.message).toContain('--time, --note, --date');
    });

    it('unknownSubcommand should list valid subcommands', () => {
      const error = ErrorMessages.unknownSubcommand('time', 'foo', ['list', 'get', 'add']);
      expect(error.message).toBe('Unknown subcommand: foo');
      expect(error.hints).toContain('Valid subcommands: list, get, add');
    });
  });
});
