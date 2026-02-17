import { describe, it, expect } from 'vitest';

import { UserInputError, ErrorMessages, isUserInputError } from './errors.js';

describe('errors', () => {
  describe('UserInputError', () => {
    it('should create error with message only', () => {
      const error = new UserInputError('Something went wrong');
      expect(error.name).toBe('UserInputError');
      expect(error.message).toBe('Something went wrong');
      expect(error.hints).toBeUndefined();
    });

    it('should create error with hints', () => {
      const error = new UserInputError('Missing field', [
        'Provide the field',
        'Check documentation',
      ]);
      expect(error.hints).toEqual(['Provide the field', 'Check documentation']);
    });

    it('should format message without hints', () => {
      const error = new UserInputError('Simple error');
      expect(error.toFormattedMessage()).toMatchInlineSnapshot(`"**Input Error:** Simple error"`);
    });

    it('should format message with hints', () => {
      const error = new UserInputError('Complex error', ['Hint 1', 'Hint 2']);
      expect(error.toFormattedMessage()).toMatchInlineSnapshot(`
        "**Input Error:** Complex error

        **Hints:**
        - Hint 1
        - Hint 2"
      `);
    });
  });

  describe('isUserInputError', () => {
    it('should return true for UserInputError', () => {
      expect(isUserInputError(new UserInputError('test'))).toBe(true);
    });

    it('should return false for regular Error', () => {
      expect(isUserInputError(new Error('test'))).toBe(false);
    });

    it('should return false for non-error values', () => {
      expect(isUserInputError('string')).toBe(false);
      expect(isUserInputError(null)).toBe(false);
      expect(isUserInputError(undefined)).toBe(false);
    });
  });

  describe('ErrorMessages', () => {
    describe('missingId', () => {
      it('should format get action error', () => {
        const error = ErrorMessages.missingId('get');
        expect(error.toFormattedMessage()).toMatchInlineSnapshot(`
          "**Input Error:** id is required for get action

          **Hints:**
          - Use action="list" first to find the resource ID
          - Then use action="get" with the id parameter"
        `);
      });

      it('should format update action error', () => {
        const error = ErrorMessages.missingId('update');
        expect(error.toFormattedMessage()).toMatchInlineSnapshot(`
          "**Input Error:** id is required for update action

          **Hints:**
          - Use action="list" first to find the resource ID
          - Then use action="update" with the id parameter"
        `);
      });
    });

    describe('missingRequiredFields', () => {
      it('should format single field error', () => {
        const error = ErrorMessages.missingRequiredFields('company', ['name']);
        expect(error.toFormattedMessage()).toMatchInlineSnapshot(`
          "**Input Error:** name is required for creating company

          **Hints:**
          - Provide all required fields: name
          - Use action="help" for detailed documentation on company"
        `);
      });

      it('should format multiple fields error', () => {
        const error = ErrorMessages.missingRequiredFields('time entry', [
          'person_id',
          'service_id',
          'time',
          'date',
        ]);
        expect(error.toFormattedMessage()).toMatchInlineSnapshot(`
          "**Input Error:** person_id, service_id, time, date are required for creating time entry

          **Hints:**
          - Provide all required fields: person_id, service_id, time, date
          - Use action="help" for detailed documentation on time entry"
        `);
      });
    });

    describe('invalidAction', () => {
      it('should format invalid action error', () => {
        const error = ErrorMessages.invalidAction('delete', 'projects', ['list', 'get']);
        expect(error.toFormattedMessage()).toMatchInlineSnapshot(`
          "**Input Error:** Invalid action "delete" for projects

          **Hints:**
          - Valid actions are: list, get
          - Use action="help" with resource="projects" for detailed documentation"
        `);
      });
    });

    describe('unknownResource', () => {
      it('should format unknown resource error', () => {
        const error = ErrorMessages.unknownResource('widgets', ['projects', 'tasks', 'time']);
        expect(error.toFormattedMessage()).toMatchInlineSnapshot(`
          "**Input Error:** Unknown resource: widgets

          **Hints:**
          - Valid resources are: projects, tasks, time
          - Use action="help" without a resource for an overview of all resources"
        `);
      });
    });

    describe('report errors', () => {
      it('should format missing report type error', () => {
        const error = ErrorMessages.missingReportType();
        expect(error.toFormattedMessage()).toMatchInlineSnapshot(`
          "**Input Error:** report_type is required for reports

          **Hints:**
          - Specify report_type parameter (e.g., "time_reports", "project_reports")
          - Use action="help" with resource="reports" for available report types"
        `);
      });

      it('should format invalid report type error', () => {
        const error = ErrorMessages.invalidReportType('custom_reports', [
          'time_reports',
          'project_reports',
        ]);
        expect(error.toFormattedMessage()).toMatchInlineSnapshot(`
          "**Input Error:** Invalid report_type: custom_reports

          **Hints:**
          - Valid report types are: time_reports, project_reports
          - Use action="help" with resource="reports" for detailed documentation"
        `);
      });
    });

    describe('specific resource errors', () => {
      it('should format missing service for timer error', () => {
        const error = ErrorMessages.missingServiceForTimer();
        expect(error.toFormattedMessage()).toMatchInlineSnapshot(`
          "**Input Error:** service_id is required to start a timer

          **Hints:**
          - First find a service using resource="services" action="list"
          - Then start the timer with the service_id"
        `);
      });

      it('should format no user ID configured error', () => {
        const error = ErrorMessages.noUserIdConfigured();
        expect(error.toFormattedMessage()).toMatchInlineSnapshot(`
          "**Input Error:** User ID not configured

          **Hints:**
          - The "me" action requires a user ID to be configured
          - Use action="list" to find people, or configure the user ID"
        `);
      });

      it('should format missing comment target error', () => {
        const error = ErrorMessages.missingCommentTarget();
        expect(error.toFormattedMessage()).toMatchInlineSnapshot(`
          "**Input Error:** A target is required for creating a comment

          **Hints:**
          - Provide one of: task_id, deal_id, or company_id
          - Find targets using resource="tasks", "deals", or "companies" with action="list""
        `);
      });

      it('should format missing booking target error', () => {
        const error = ErrorMessages.missingBookingTarget();
        expect(error.toFormattedMessage()).toMatchInlineSnapshot(`
          "**Input Error:** A service or event is required for creating a booking

          **Hints:**
          - Provide either: service_id or event_id
          - Find services using resource="services" with action="list""
        `);
      });
    });

    describe('apiError', () => {
      it('should format 401 error with hints', () => {
        const error = ErrorMessages.apiError(401, 'Unauthorized');
        expect(error.toFormattedMessage()).toMatchInlineSnapshot(`
          "**Input Error:** API error (401): Unauthorized

          **Hints:**
          - Check that your API token is valid and not expired
          - Verify the organization ID is correct"
        `);
      });

      it('should format 403 error with hints', () => {
        const error = ErrorMessages.apiError(403, 'Forbidden');
        expect(error.toFormattedMessage()).toMatchInlineSnapshot(`
          "**Input Error:** API error (403): Forbidden

          **Hints:**
          - You may not have permission to access this resource
          - Check your API token permissions"
        `);
      });

      it('should format 404 error with hints', () => {
        const error = ErrorMessages.apiError(404, 'Not Found');
        expect(error.toFormattedMessage()).toMatchInlineSnapshot(`
          "**Input Error:** API error (404): Not Found

          **Hints:**
          - The resource may not exist or you may not have access
          - Verify the resource ID is correct
          - Use action="list" to find valid resource IDs"
        `);
      });

      it('should format 422 error with hints', () => {
        const error = ErrorMessages.apiError(422, 'Validation failed');
        expect(error.toFormattedMessage()).toMatchInlineSnapshot(`
          "**Input Error:** API error (422): Validation failed

          **Hints:**
          - The request data may be invalid
          - Check the field values and types
          - Use action="help" for field documentation"
        `);
      });

      it('should format 500 error with hints', () => {
        const error = ErrorMessages.apiError(500, 'Internal Server Error');
        expect(error.toFormattedMessage()).toMatchInlineSnapshot(`
          "**Input Error:** API error (500): Internal Server Error

          **Hints:**
          - This is a server error - try again later"
        `);
      });
    });
  });
});
