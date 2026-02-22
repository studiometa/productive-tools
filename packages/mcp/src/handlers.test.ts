import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { ProductiveCredentials } from './auth.js';

import { UserInputError } from './errors.js';
import { executeToolWithCredentials } from './handlers.js';

// Mock the ProductiveApi
vi.mock('@studiometa/productive-api', () => {
  const mockApi = {
    getProjects: vi.fn(),
    getProject: vi.fn(),
    getTimeEntries: vi.fn(),
    getTimeEntry: vi.fn(),
    createTimeEntry: vi.fn(),
    updateTimeEntry: vi.fn(),
    deleteTimeEntry: vi.fn(),
    getTasks: vi.fn(),
    getTask: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    getServices: vi.fn(),
    getPeople: vi.fn(),
    getPerson: vi.fn(),
    getReports: vi.fn(),
    // Additional handlers for include tests
    getDeals: vi.fn(),
    getDeal: vi.fn(),
    createDeal: vi.fn(),
    updateDeal: vi.fn(),
    getBookings: vi.fn(),
    getBooking: vi.fn(),
    createBooking: vi.fn(),
    updateBooking: vi.fn(),
    getComments: vi.fn(),
    getComment: vi.fn(),
    createComment: vi.fn(),
    updateComment: vi.fn(),
    getTimers: vi.fn(),
    getTimer: vi.fn(),
    startTimer: vi.fn(),
    stopTimer: vi.fn(),
    getCompanies: vi.fn(),
    getCompany: vi.fn(),
    createCompany: vi.fn(),
    updateCompany: vi.fn(),
    getAttachments: vi.fn(),
    getAttachment: vi.fn(),
    deleteAttachment: vi.fn(),
    getPages: vi.fn(),
    getPage: vi.fn(),
    createPage: vi.fn(),
    updatePage: vi.fn(),
    deletePage: vi.fn(),
    getDiscussions: vi.fn(),
    getDiscussion: vi.fn(),
    createDiscussion: vi.fn(),
    updateDiscussion: vi.fn(),
    deleteDiscussion: vi.fn(),
    resolveDiscussion: vi.fn(),
    reopenDiscussion: vi.fn(),
  };

  return {
    ProductiveApi: vi.fn(function () {
      return mockApi;
    }),
    formatTimeEntry: vi.fn((entry) => ({ id: entry.id, ...entry.attributes })),
    formatProject: vi.fn((project) => ({ id: project.id, ...project.attributes })),
    formatTask: vi.fn((task) => ({ id: task.id, ...task.attributes })),
    formatPerson: vi.fn((person) => ({ id: person.id, ...person.attributes })),
    formatService: vi.fn((service) => ({ id: service.id, ...service.attributes })),
    formatDeal: vi.fn((deal) => ({ id: deal.id, ...deal.attributes })),
    formatBooking: vi.fn((booking) => ({ id: booking.id, ...booking.attributes })),
    formatComment: vi.fn((comment) => ({ id: comment.id, ...comment.attributes })),
    formatPage: vi.fn((page) => ({ id: page.id, ...page.attributes })),
    formatDiscussion: vi.fn((discussion) => ({ id: discussion.id, ...discussion.attributes })),
    formatTimer: vi.fn((timer) => ({ id: timer.id, ...timer.attributes })),

    formatCompany: vi.fn((company) => ({ id: company.id, ...company.attributes })),
    formatAttachment: vi.fn((attachment) => ({ id: attachment.id, ...attachment.attributes })),
    formatListResponse: vi.fn((data, formatter, meta) => ({
      data: data.map((item: Record<string, unknown>) => formatter(item)),
      meta,
    })),
  };
});

import { ProductiveApi } from '@studiometa/productive-api';

describe('handlers', () => {
  const credentials: ProductiveCredentials = {
    apiToken: 'test-token',
    organizationId: 'test-org',
    userId: '500521',
  };

  let mockApi: ReturnType<typeof ProductiveApi>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi = new ProductiveApi({}) as ReturnType<typeof ProductiveApi>;
  });

  describe('executeToolWithCredentials', () => {
    describe('projects resource', () => {
      it('should handle list action', async () => {
        const mockResponse = {
          data: [
            { id: '1', type: 'projects', attributes: { name: 'Project 1' } },
            { id: '2', type: 'projects', attributes: { name: 'Project 2' } },
          ],
          meta: { current_page: 1, total_pages: 1 },
        };
        mockApi.getProjects.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'projects', action: 'list', page: 1 },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getProjects).toHaveBeenCalledWith(
          expect.objectContaining({ page: 1, perPage: 20 }),
        );
      });

      it('should handle get action', async () => {
        const mockResponse = {
          data: { id: '123', type: 'projects', attributes: { name: 'Test Project' } },
        };
        mockApi.getProject.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'projects', action: 'get', id: '123' },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getProject).toHaveBeenCalledWith('123');
      });

      it('should return error for get without id', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'projects', action: 'get' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('id is required');
      });

      it('should return error for invalid action', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'projects', action: 'create' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Invalid action');
      });

      it('should handle context action', async () => {
        mockApi.getProject.mockResolvedValue({
          data: { id: '123', type: 'projects', attributes: { name: 'Test Project' } },
        });
        mockApi.getTasks.mockResolvedValue({
          data: [{ id: 't1', type: 'tasks', attributes: { title: 'Task 1' } }],
          meta: {},
          included: [],
        });
        mockApi.getServices.mockResolvedValue({
          data: [{ id: 's1', type: 'services', attributes: { name: 'Development' } }],
          meta: {},
        });
        mockApi.getTimeEntries.mockResolvedValue({
          data: [{ id: 'te1', type: 'time_entries', attributes: { time: 480 } }],
          meta: {},
        });

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'projects', action: 'context', id: '123' },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        const content = JSON.parse(result.content[0].text as string);
        expect(content).toHaveProperty('tasks');
        expect(content).toHaveProperty('services');
        expect(content).toHaveProperty('time_entries');
        expect(content.tasks).toHaveLength(1);
        expect(content.services).toHaveLength(1);
        expect(content.time_entries).toHaveLength(1);
      });

      it('should return error for context without id', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'projects', action: 'context' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('id is required');
      });
    });

    describe('time resource', () => {
      it('should handle list action', async () => {
        const mockResponse = {
          data: [{ id: '1', type: 'time_entries', attributes: { date: '2024-01-15', time: 480 } }],
          meta: { current_page: 1, total_pages: 1 },
        };
        mockApi.getTimeEntries.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'time', action: 'list', filter: { person_id: '123' } },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getTimeEntries).toHaveBeenCalledWith(
          expect.objectContaining({ filter: { person_id: '123' } }),
        );
      });

      it('should handle get action', async () => {
        const mockResponse = {
          data: { id: '456', type: 'time_entries', attributes: { date: '2024-01-15', time: 480 } },
        };
        mockApi.getTimeEntry.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'time', action: 'get', id: '456' },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getTimeEntry).toHaveBeenCalledWith('456');
      });

      it('should handle create action', async () => {
        const mockResponse = {
          data: { id: '789', type: 'time_entries', attributes: { date: '2024-01-15', time: 480 } },
        };
        mockApi.createTimeEntry.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          {
            resource: 'time',
            action: 'create',
            person_id: '123',
            service_id: '456',
            time: 480,
            date: '2024-01-15',
            note: 'Test entry',
          },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        const content = JSON.parse(result.content[0].text as string);
        expect(content.success).toBe(true);
        expect(mockApi.createTimeEntry).toHaveBeenCalled();
      });

      it('should return error for create missing required fields', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'time', action: 'create', person_id: '123' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('are required for creating time entry');
      });

      it('should handle update action', async () => {
        const mockResponse = {
          data: { id: '789', type: 'time_entries', attributes: { date: '2024-01-15', time: 240 } },
        };
        mockApi.updateTimeEntry.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'time', action: 'update', id: '789', time: 240 },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        const content = JSON.parse(result.content[0].text as string);
        expect(content.success).toBe(true);
        expect(mockApi.updateTimeEntry).toHaveBeenCalledWith('789', { time: 240 });
      });

      it('should reject invalid action', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'time', action: 'invalid' as never, id: '789' },
          credentials,
        );

        expect(result.isError).toBe(true);
      });

      it('should handle delete action', async () => {
        mockApi.deleteTimeEntry.mockResolvedValue(undefined);

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'time', action: 'delete', id: '789' },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        const content = JSON.parse(result.content[0].text as string);
        expect(content.success).toBe(true);
        expect(content.deleted).toBe('789');
        expect(mockApi.deleteTimeEntry).toHaveBeenCalledWith('789');
      });

      it('should return error for delete without id', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'time', action: 'delete' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('id is required for delete');
      });
    });

    describe('tasks resource', () => {
      it('should handle list action with includes', async () => {
        const mockResponse = {
          data: [{ id: '1', type: 'tasks', attributes: { title: 'Task 1' } }],
          meta: { current_page: 1, total_pages: 1 },
          included: [],
        };
        mockApi.getTasks.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'tasks', action: 'list', filter: { project_id: '123' } },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getTasks).toHaveBeenCalledWith(
          expect.objectContaining({
            include: ['project', 'project.company'],
          }),
        );
      });

      it('should handle get action', async () => {
        const mockResponse = {
          data: { id: '456', type: 'tasks', attributes: { title: 'Test Task' } },
          included: [],
        };
        mockApi.getTask.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'tasks', action: 'get', id: '456' },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getTask).toHaveBeenCalledWith('456', {
          include: ['project', 'project.company'],
        });
      });

      it('should handle context action', async () => {
        mockApi.getTask.mockResolvedValue({
          data: { id: '123', type: 'tasks', attributes: { title: 'Test Task' } },
          included: [],
        });
        mockApi.getComments.mockResolvedValue({
          data: [{ id: 'c1', type: 'comments', attributes: { body: 'A comment' } }],
          meta: {},
          included: [],
        });
        mockApi.getTimeEntries.mockResolvedValue({
          data: [{ id: 't1', type: 'time_entries', attributes: { time: 60 } }],
          meta: {},
        });
        mockApi.getTasks.mockResolvedValue({
          data: [{ id: 's1', type: 'tasks', attributes: { title: 'Subtask 1' } }],
          meta: {},
          included: [],
        });

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'tasks', action: 'context', id: '123' },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        const content = JSON.parse(result.content[0].text as string);
        expect(content).toHaveProperty('comments');
        expect(content).toHaveProperty('time_entries');
        expect(content).toHaveProperty('subtasks');
        expect(content.comments).toHaveLength(1);
        expect(content.time_entries).toHaveLength(1);
        expect(content.subtasks).toHaveLength(1);
      });

      it('should return error for context without id', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'tasks', action: 'context' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('id is required');
      });
    });

    describe('services resource', () => {
      it('should handle list action', async () => {
        const mockResponse = {
          data: [{ id: '1', type: 'services', attributes: { name: 'Development' } }],
          meta: { current_page: 1, total_pages: 1 },
        };
        mockApi.getServices.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'services', action: 'list', filter: { project_id: '123' } },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getServices).toHaveBeenCalledWith(
          expect.objectContaining({ filter: { project_id: '123' } }),
        );
      });

      it('should return error for invalid action', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'services', action: 'get', id: '123' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Invalid action');
      });
    });

    describe('people resource', () => {
      it('should handle list action', async () => {
        const mockResponse = {
          data: [{ id: '1', type: 'people', attributes: { first_name: 'John', last_name: 'Doe' } }],
          meta: { current_page: 1, total_pages: 1 },
        };
        mockApi.getPeople.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'people', action: 'list' },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getPeople).toHaveBeenCalled();
      });

      it('should handle get action', async () => {
        const mockResponse = {
          data: { id: '123', type: 'people', attributes: { first_name: 'John', last_name: 'Doe' } },
        };
        mockApi.getPerson.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'people', action: 'get', id: '123' },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getPerson).toHaveBeenCalledWith('123');
      });

      it('should handle me action with userId', async () => {
        const mockResponse = {
          data: {
            id: '500521',
            type: 'people',
            attributes: { first_name: 'Test', last_name: 'User' },
          },
        };
        mockApi.getPerson.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'people', action: 'me' },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getPerson).toHaveBeenCalledWith('500521');
      });

      it('should handle me action without userId', async () => {
        const credentialsWithoutUser: ProductiveCredentials = {
          apiToken: 'test-token',
          organizationId: 'test-org',
        };

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'people', action: 'me' },
          credentialsWithoutUser,
        );

        expect(result.isError).toBeUndefined();
        const content = JSON.parse(result.content[0].text as string);
        expect(content.message).toContain('User ID not configured');
      });
    });

    describe('reports resource', () => {
      it('should handle get action with time_reports', async () => {
        const mockResponse = {
          data: [
            {
              id: 'report-1',
              type: 'time_reports',
              attributes: { total_worked_time: 480, group: 'Person 1' },
            },
          ],
          meta: { current_page: 1, total_pages: 1 },
        };
        mockApi.getReports.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'reports', action: 'get', report_type: 'time_reports' },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getReports).toHaveBeenCalledWith(
          'time_reports',
          expect.objectContaining({ group: 'person' }),
        );
      });

      it('should handle get action with invoice_reports and filters', async () => {
        const mockResponse = {
          data: [
            {
              id: 'report-1',
              type: 'invoice_reports',
              attributes: { total_amount: 10000 },
            },
          ],
          meta: { current_page: 1, total_pages: 1 },
        };
        mockApi.getReports.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          {
            resource: 'reports',
            action: 'get',
            report_type: 'invoice_reports',
            from: '2024-01-01',
            to: '2024-01-31',
            company_id: '123',
            status: 'overdue',
          },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getReports).toHaveBeenCalledWith(
          'invoice_reports',
          expect.objectContaining({
            filter: expect.objectContaining({
              invoice_date_after: '2024-01-01',
              invoice_date_before: '2024-01-31',
              company_id: '123',
              status: 'overdue',
            }),
          }),
        );
      });

      it('should handle get action with deal_reports and filters', async () => {
        const mockResponse = {
          data: [
            {
              id: 'report-1',
              type: 'deal_reports',
              attributes: { total_value: 50000 },
            },
          ],
          meta: { current_page: 1, total_pages: 1 },
        };
        mockApi.getReports.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          {
            resource: 'reports',
            action: 'get',
            report_type: 'deal_reports',
            from: '2024-01-01',
            to: '2024-12-31',
            status: '456',
          },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getReports).toHaveBeenCalledWith(
          'deal_reports',
          expect.objectContaining({
            filter: expect.objectContaining({
              date_after: '2024-01-01',
              date_before: '2024-12-31',
              deal_status_id: '456',
            }),
          }),
        );
      });

      it('should handle get action with task_reports and person filter', async () => {
        const mockResponse = {
          data: [
            {
              id: 'report-1',
              type: 'task_reports',
              attributes: { total_tasks: 10 },
            },
          ],
          meta: { current_page: 1, total_pages: 1 },
        };
        mockApi.getReports.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          {
            resource: 'reports',
            action: 'get',
            report_type: 'task_reports',
            person_id: '123',
            project_id: '456',
          },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getReports).toHaveBeenCalledWith(
          'task_reports',
          expect.objectContaining({
            filter: expect.objectContaining({
              assignee_id: '123',
              project_id: '456',
            }),
          }),
        );
      });

      it('should handle custom group parameter', async () => {
        const mockResponse = {
          data: [],
          meta: { current_page: 1, total_pages: 1 },
        };
        mockApi.getReports.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          {
            resource: 'reports',
            action: 'get',
            report_type: 'time_reports',
            group: 'project',
          },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getReports).toHaveBeenCalledWith(
          'time_reports',
          expect.objectContaining({ group: 'project' }),
        );
      });

      it('should return error for missing report_type', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'reports', action: 'get' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('report_type is required');
      });

      it('should return error for invalid report_type', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'reports', action: 'get', report_type: 'invalid_reports' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Invalid report_type');
      });

      it('should return error for invalid action', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'reports', action: 'list', report_type: 'time_reports' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Invalid action');
      });

      it('should handle all report types', async () => {
        const reportTypes = [
          'time_reports',
          'project_reports',
          'budget_reports',
          'person_reports',
          'invoice_reports',
          'payment_reports',
          'service_reports',
          'task_reports',
          'company_reports',
          'deal_reports',
          'timesheet_reports',
        ];

        for (const reportType of reportTypes) {
          const mockResponse = {
            data: [{ id: 'report-1', type: reportType, attributes: {} }],
            meta: { current_page: 1, total_pages: 1 },
          };
          mockApi.getReports.mockResolvedValue(mockResponse);

          const result = await executeToolWithCredentials(
            'productive',
            { resource: 'reports', action: 'get', report_type: reportType },
            credentials,
          );

          expect(result.isError).toBeUndefined();
          expect(mockApi.getReports).toHaveBeenCalledWith(reportType, expect.anything());
        }
      });

      it('should handle person_id filter for non-task reports', async () => {
        const mockResponse = {
          data: [],
          meta: { current_page: 1, total_pages: 1 },
        };
        mockApi.getReports.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          {
            resource: 'reports',
            action: 'get',
            report_type: 'time_reports',
            person_id: '123',
          },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getReports).toHaveBeenCalledWith(
          'time_reports',
          expect.objectContaining({
            filter: expect.objectContaining({
              person_id: '123',
            }),
          }),
        );
      });

      it('should handle deal_id filter for non-deal reports', async () => {
        const mockResponse = {
          data: [],
          meta: { current_page: 1, total_pages: 1 },
        };
        mockApi.getReports.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          {
            resource: 'reports',
            action: 'get',
            report_type: 'service_reports',
            deal_id: '456',
          },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getReports).toHaveBeenCalledWith(
          'service_reports',
          expect.objectContaining({
            filter: expect.objectContaining({
              deal_id: '456',
            }),
          }),
        );
      });

      it('should handle deal_id filter for deal_reports (maps to deal_status_id)', async () => {
        const mockResponse = {
          data: [],
          meta: { current_page: 1, total_pages: 1 },
        };
        mockApi.getReports.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          {
            resource: 'reports',
            action: 'get',
            report_type: 'deal_reports',
            deal_id: '789',
          },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getReports).toHaveBeenCalledWith(
          'deal_reports',
          expect.objectContaining({
            filter: expect.objectContaining({
              deal_status_id: '789',
            }),
          }),
        );
      });

      it('should handle payment_reports date filters', async () => {
        const mockResponse = {
          data: [],
          meta: { current_page: 1, total_pages: 1 },
        };
        mockApi.getReports.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          {
            resource: 'reports',
            action: 'get',
            report_type: 'payment_reports',
            from: '2024-01-01',
            to: '2024-12-31',
          },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getReports).toHaveBeenCalledWith(
          'payment_reports',
          expect.objectContaining({
            filter: expect.objectContaining({
              date_after: '2024-01-01',
              date_before: '2024-12-31',
            }),
          }),
        );
      });

      it('should handle timesheet_reports with date filters', async () => {
        const mockResponse = {
          data: [],
          meta: { current_page: 1, total_pages: 1 },
        };
        mockApi.getReports.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          {
            resource: 'reports',
            action: 'get',
            report_type: 'timesheet_reports',
            from: '2024-01-01',
            to: '2024-01-31',
            status: 'pending',
          },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getReports).toHaveBeenCalledWith(
          'timesheet_reports',
          expect.objectContaining({
            filter: expect.objectContaining({
              after: '2024-01-01',
              before: '2024-01-31',
              status: 'pending',
            }),
          }),
        );
      });
    });

    describe('error handling', () => {
      it('should return error for unknown tool', async () => {
        const result = await executeToolWithCredentials('unknown_tool', {}, credentials);

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Unknown tool');
      });

      it('should return error for unknown resource', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'unknown', action: 'list' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Unknown resource');
      });

      it('should handle API errors gracefully', async () => {
        mockApi.getProjects.mockRejectedValue(new Error('API request failed: 401 Unauthorized'));

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'projects', action: 'list' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('401 Unauthorized');
      });

      it('should handle 404 API errors with hints', async () => {
        mockApi.getProject.mockRejectedValue(new Error('API request failed: 404 Not Found'));

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'projects', action: 'get', id: '999' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('404');
        expect(result.content[0].text).toContain('Hints');
      });

      it('should handle 422 API errors with hints', async () => {
        mockApi.createTimeEntry.mockRejectedValue(
          new Error('API request failed: 422 Validation failed'),
        );

        const result = await executeToolWithCredentials(
          'productive',
          {
            resource: 'time',
            action: 'create',
            person_id: '123',
            service_id: '456',
            time: 480,
            date: '2024-01-15',
          },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('422');
        expect(result.content[0].text).toContain('Hints');
      });

      it('should handle errors without status codes', async () => {
        mockApi.getProjects.mockRejectedValue(new Error('Network timeout'));

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'projects', action: 'list' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Network timeout');
      });

      it('should handle non-Error thrown values', async () => {
        mockApi.getProjects.mockRejectedValue('String error');

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'projects', action: 'list' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('String error');
      });

      it('should handle UserInputError thrown by handlers', async () => {
        mockApi.getProjects.mockRejectedValue(
          new UserInputError('Custom validation error', ['Hint 1', 'Hint 2']),
        );

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'projects', action: 'list' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('**Input Error:**');
        expect(result.content[0].text).toContain('Custom validation error');
        expect(result.content[0].text).toContain('Hint 1');
      });
    });

    describe('tasks resource - error paths', () => {
      it('should return error for create without title', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'tasks', action: 'create', project_id: '123', task_list_id: '456' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('is required for creating task');
      });

      it('should return error for update without id', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'tasks', action: 'update', title: 'New title' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('id is required for update');
      });

      it('should return error for invalid action', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'tasks', action: 'delete', id: '123' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Invalid action');
      });

      it('should handle create action', async () => {
        const mockResponse = {
          data: { id: '789', type: 'tasks', attributes: { title: 'New Task' } },
        };
        mockApi.createTask.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          {
            resource: 'tasks',
            action: 'create',
            title: 'New Task',
            project_id: '123',
            task_list_id: '456',
          },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.createTask).toHaveBeenCalled();
      });

      it('should handle update action', async () => {
        const mockResponse = {
          data: { id: '789', type: 'tasks', attributes: { title: 'Updated Task' } },
        };
        mockApi.updateTask.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'tasks', action: 'update', id: '789', title: 'Updated Task' },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.updateTask).toHaveBeenCalledWith('789', { title: 'Updated Task' });
      });
    });

    describe('companies resource', () => {
      it('should handle list action', async () => {
        const mockResponse = {
          data: [{ id: '1', type: 'companies', attributes: { name: 'Company 1' } }],
          meta: { current_page: 1, total_pages: 1 },
        };
        mockApi.getCompanies.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'companies', action: 'list' },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getCompanies).toHaveBeenCalled();
      });

      it('should handle get action', async () => {
        const mockResponse = {
          data: { id: '123', type: 'companies', attributes: { name: 'Test Company' } },
        };
        mockApi.getCompany.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'companies', action: 'get', id: '123' },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getCompany).toHaveBeenCalledWith('123');
      });

      it('should return error for get without id', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'companies', action: 'get' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('id is required for get');
      });

      it('should handle create action', async () => {
        const mockResponse = {
          data: { id: '789', type: 'companies', attributes: { name: 'New Company' } },
        };
        mockApi.createCompany.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'companies', action: 'create', name: 'New Company' },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.createCompany).toHaveBeenCalledWith({ name: 'New Company' });
      });

      it('should return error for create without name', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'companies', action: 'create' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('is required for creating companies');
      });

      it('should handle update action', async () => {
        const mockResponse = {
          data: { id: '123', type: 'companies', attributes: { name: 'Updated Company' } },
        };
        mockApi.updateCompany.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'companies', action: 'update', id: '123', name: 'Updated Company' },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.updateCompany).toHaveBeenCalledWith('123', { name: 'Updated Company' });
      });

      it('should return error for update without id', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'companies', action: 'update', name: 'Updated' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('id is required for update');
      });

      it('should return error for invalid action', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'companies', action: 'delete', id: '123' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Invalid action');
      });
    });

    describe('comments resource - error paths', () => {
      it('should return error for create without body', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'comments', action: 'create', task_id: '123' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('is required for creating comment');
      });

      it('should return error for create without target', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'comments', action: 'create', body: 'Test comment' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('target is required');
      });

      it('should handle create action', async () => {
        const mockResponse = {
          data: { id: '789', type: 'comments', attributes: { body: 'Test comment' } },
        };
        mockApi.createComment.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'comments', action: 'create', body: 'Test comment', task_id: '123' },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.createComment).toHaveBeenCalled();
      });

      it('should return error for update without id', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'comments', action: 'update', body: 'Updated' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('id is required for update');
      });

      it('should return error for update without body', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'comments', action: 'update', id: '123' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('No updates specified');
        expect(result.content[0].text).toContain('body');
      });

      it('should handle update action', async () => {
        const mockResponse = {
          data: { id: '123', type: 'comments', attributes: { body: 'Updated comment' } },
        };
        mockApi.updateComment.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'comments', action: 'update', id: '123', body: 'Updated comment' },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.updateComment).toHaveBeenCalledWith('123', { body: 'Updated comment' });
      });

      it('should return error for invalid action', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'comments', action: 'delete', id: '123' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Invalid action');
      });
    });

    describe('deals resource - error paths', () => {
      it('should return error for create without name', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'deals', action: 'create', company_id: '123' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('is required for creating deal');
      });

      it('should handle create action', async () => {
        const mockResponse = {
          data: { id: '789', type: 'deals', attributes: { name: 'New Deal' } },
        };
        mockApi.createDeal.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'deals', action: 'create', name: 'New Deal', company_id: '123' },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.createDeal).toHaveBeenCalled();
      });

      it('should return error for update without id', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'deals', action: 'update', name: 'Updated' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('id is required for update');
      });

      it('should handle update action', async () => {
        const mockResponse = {
          data: { id: '123', type: 'deals', attributes: { name: 'Updated Deal' } },
        };
        mockApi.updateDeal.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'deals', action: 'update', id: '123', name: 'Updated Deal' },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.updateDeal).toHaveBeenCalledWith('123', { name: 'Updated Deal' });
      });

      it('should return error for invalid action', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'deals', action: 'delete', id: '123' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Invalid action');
      });

      it('should handle context action', async () => {
        mockApi.getDeal.mockResolvedValue({
          data: { id: '123', type: 'deals', attributes: { name: 'Test Deal' } },
          included: [],
        });
        mockApi.getServices.mockResolvedValue({
          data: [{ id: 's1', type: 'services', attributes: { name: 'Development' } }],
          meta: {},
        });
        mockApi.getComments.mockResolvedValue({
          data: [{ id: 'c1', type: 'comments', attributes: { body: 'A comment' } }],
          meta: {},
          included: [],
        });
        mockApi.getTimeEntries.mockResolvedValue({
          data: [{ id: 'te1', type: 'time_entries', attributes: { time: 480 } }],
          meta: {},
        });

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'deals', action: 'context', id: '123' },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        const content = JSON.parse(result.content[0].text as string);
        expect(content).toHaveProperty('services');
        expect(content).toHaveProperty('comments');
        expect(content).toHaveProperty('time_entries');
        expect(content.services).toHaveLength(1);
        expect(content.comments).toHaveLength(1);
        expect(content.time_entries).toHaveLength(1);
      });

      it('should return error for context without id', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'deals', action: 'context' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('id is required');
      });
    });

    describe('bookings resource - error paths', () => {
      it('should return error for create without required fields', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'bookings', action: 'create', person_id: '123' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('are required for creating booking');
      });

      it('should return error for create without service or event', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          {
            resource: 'bookings',
            action: 'create',
            person_id: '123',
            started_on: '2024-01-15',
            ended_on: '2024-01-16',
          },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('service or event is required');
      });

      it('should handle create action', async () => {
        const mockResponse = {
          data: { id: '789', type: 'bookings', attributes: { started_on: '2024-01-15' } },
        };
        mockApi.createBooking.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          {
            resource: 'bookings',
            action: 'create',
            person_id: '123',
            service_id: '456',
            started_on: '2024-01-15',
            ended_on: '2024-01-16',
          },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.createBooking).toHaveBeenCalled();
      });

      it('should return error for update without id', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'bookings', action: 'update', started_on: '2024-01-15' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('id is required for update');
      });

      it('should handle update action', async () => {
        const mockResponse = {
          data: { id: '123', type: 'bookings', attributes: { started_on: '2024-01-20' } },
        };
        mockApi.updateBooking.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'bookings', action: 'update', id: '123', started_on: '2024-01-20' },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.updateBooking).toHaveBeenCalledWith('123', { started_on: '2024-01-20' });
      });

      it('should return error for invalid action', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'bookings', action: 'delete', id: '123' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Invalid action');
      });
    });

    describe('timers resource - error paths', () => {
      it('should return error for start without service', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'timers', action: 'start' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('service_id is required');
      });

      it('should handle start action', async () => {
        const mockResponse = {
          data: { id: '789', type: 'timers', attributes: { started_at: '2024-01-15T10:00:00Z' } },
        };
        mockApi.startTimer.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'timers', action: 'start', service_id: '123' },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.startTimer).toHaveBeenCalled();
      });

      it('should return error for stop without id', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'timers', action: 'stop' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('id is required');
      });

      it('should handle stop action', async () => {
        const mockResponse = {
          data: { id: '123', type: 'timers', attributes: { stopped_at: '2024-01-15T11:00:00Z' } },
        };
        mockApi.stopTimer.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'timers', action: 'stop', id: '123' },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.stopTimer).toHaveBeenCalledWith('123');
      });

      it('should handle create action (alias for start)', async () => {
        const mockResponse = {
          data: { id: '789', type: 'timers', attributes: { started_at: '2024-01-15T10:00:00Z' } },
        };
        mockApi.startTimer.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'timers', action: 'create', service_id: '123' },
          credentials,
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.startTimer).toHaveBeenCalled();
      });

      it('should return error for create without service', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'timers', action: 'create' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('service_id is required');
      });

      it('should return error for invalid action', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'timers', action: 'delete', id: '123' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Invalid action');
      });
    });

    describe('people resource - error paths', () => {
      it('should return error for invalid action', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'people', action: 'create' },
          credentials,
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Invalid action');
      });
    });

    describe('budgets resource (removed — redirects to deals)', () => {
      it('should return helpful error pointing to deals resource', async () => {
        const result = await executeToolWithCredentials(
          'productive',
          { resource: 'budgets', action: 'list' },
          credentials,
        );

        expect(result.isError).toBe(true);
        const text = result.content[0].text as string;
        expect(text).toContain('removed');
        expect(text).toContain('deals');
        expect(text).toContain('type=2');
      });
    });
  });
});

describe('help handler', () => {
  const credentials: ProductiveCredentials = {
    apiToken: 'test-token',
    organizationId: 'test-org',
    userId: '500521',
  };

  it('should return overview when no resource specified', async () => {
    const result = await executeToolWithCredentials(
      'productive',
      { resource: '', action: 'help' },
      credentials,
    );

    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text as string);
    expect(content.resources).toBeDefined();
    expect(content.resources.length).toBeGreaterThan(0);
  });

  it('should return detailed help for tasks resource', async () => {
    const result = await executeToolWithCredentials(
      'productive',
      { resource: 'tasks', action: 'help' },
      credentials,
    );

    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text as string);
    expect(content.resource).toBe('tasks');
    expect(content.description).toBeDefined();
    expect(content.actions).toBeDefined();
    expect(content.filters).toBeDefined();
    expect(content.includes).toBeDefined();
    expect(content.fields).toBeDefined();
    expect(content.examples).toBeDefined();
  });

  it('should return detailed help for time resource', async () => {
    const result = await executeToolWithCredentials(
      'productive',
      { resource: 'time', action: 'help' },
      credentials,
    );

    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text as string);
    expect(content.resource).toBe('time');
    expect(content.actions.create).toBeDefined();
  });

  it('should return error for removed budgets resource help', async () => {
    const result = await executeToolWithCredentials(
      'productive',
      { resource: 'budgets', action: 'help' },
      credentials,
    );

    // Help handler returns unknown resource error since budgets was removed
    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text as string);
    expect(content.error).toContain('Unknown resource');
    expect(content.available_resources).toBeDefined();
    expect(content.available_resources).not.toContain('budgets');
  });

  it('should return error for unknown resource in help', async () => {
    const result = await executeToolWithCredentials(
      'productive',
      { resource: 'unknown', action: 'help' },
      credentials,
    );

    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text as string);
    expect(content.error).toContain('Unknown resource');
    expect(content.available_resources).toBeDefined();
  });
});

describe('query parameter', () => {
  const credentials: ProductiveCredentials = {
    apiToken: 'test-token',
    organizationId: 'test-org',
    userId: '500521',
  };

  let mockApi: ReturnType<typeof ProductiveApi>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi = new ProductiveApi({}) as ReturnType<typeof ProductiveApi>;
  });

  it('should pass query to filter for projects list', async () => {
    const mockResponse = {
      data: [{ id: '1', type: 'projects', attributes: { name: 'Website Project' } }],
      meta: { current_page: 1, total_pages: 1 },
    };
    mockApi.getProjects.mockResolvedValue(mockResponse);

    const result = await executeToolWithCredentials(
      'productive',
      { resource: 'projects', action: 'list', query: 'website' },
      credentials,
    );

    expect(result.isError).toBeUndefined();
    expect(mockApi.getProjects).toHaveBeenCalledWith(
      expect.objectContaining({ filter: { query: 'website' } }),
    );
  });

  it('should merge query with other filters', async () => {
    const mockResponse = {
      data: [],
      meta: { current_page: 1, total_pages: 1 },
    };
    mockApi.getProjects.mockResolvedValue(mockResponse);

    const result = await executeToolWithCredentials(
      'productive',
      { resource: 'projects', action: 'list', query: 'website', filter: { archived: 'false' } },
      credentials,
    );

    expect(result.isError).toBeUndefined();
    expect(mockApi.getProjects).toHaveBeenCalledWith(
      expect.objectContaining({ filter: { query: 'website', archived: 'false' } }),
    );
  });
});

describe('include parameter', () => {
  const credentials: ProductiveCredentials = {
    apiToken: 'test-token',
    organizationId: 'test-org',
    userId: '500521',
  };

  let mockApi: ReturnType<typeof ProductiveApi>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi = new ProductiveApi({}) as ReturnType<typeof ProductiveApi>;
  });

  describe('tasks', () => {
    it('should merge user includes with defaults for list', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'tasks', attributes: { title: 'Task 1' } }],
        meta: { current_page: 1, total_pages: 1 },
      };
      mockApi.getTasks.mockResolvedValue(mockResponse);

      await executeToolWithCredentials(
        'productive',
        { resource: 'tasks', action: 'list', include: ['comments', 'assignee'] },
        credentials,
      );

      expect(mockApi.getTasks).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining(['project', 'project.company', 'comments', 'assignee']),
        }),
      );
    });

    it('should merge user includes with defaults for get', async () => {
      const mockResponse = {
        data: { id: '1', type: 'tasks', attributes: { title: 'Task 1' } },
      };
      mockApi.getTask.mockResolvedValue(mockResponse);

      await executeToolWithCredentials(
        'productive',
        { resource: 'tasks', action: 'get', id: '123', include: ['subtasks'] },
        credentials,
      );

      expect(mockApi.getTask).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          include: expect.arrayContaining(['project', 'project.company', 'subtasks']),
        }),
      );
    });
  });

  describe('deals', () => {
    it('should use default includes for list when no user includes', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'deals', attributes: { name: 'Deal 1' } }],
        meta: { current_page: 1, total_pages: 1 },
      };
      mockApi.getDeals.mockResolvedValue(mockResponse);

      await executeToolWithCredentials(
        'productive',
        { resource: 'deals', action: 'list' },
        credentials,
      );

      expect(mockApi.getDeals).toHaveBeenCalledWith(
        expect.objectContaining({
          include: ['company', 'deal_status'],
        }),
      );
    });

    it('should merge user includes with defaults for list', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'deals', attributes: { name: 'Deal 1' } }],
        meta: { current_page: 1, total_pages: 1 },
      };
      mockApi.getDeals.mockResolvedValue(mockResponse);

      await executeToolWithCredentials(
        'productive',
        { resource: 'deals', action: 'list', include: ['project'] },
        credentials,
      );

      expect(mockApi.getDeals).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining(['company', 'deal_status', 'project']),
        }),
      );
    });

    it('should use default includes for get when no user includes', async () => {
      const mockResponse = {
        data: { id: '1', type: 'deals', attributes: { name: 'Deal 1' } },
      };
      mockApi.getDeal.mockResolvedValue(mockResponse);

      await executeToolWithCredentials(
        'productive',
        { resource: 'deals', action: 'get', id: '123' },
        credentials,
      );

      expect(mockApi.getDeal).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          include: ['company', 'deal_status', 'responsible'],
        }),
      );
    });

    it('should merge user includes with defaults for get', async () => {
      const mockResponse = {
        data: { id: '1', type: 'deals', attributes: { name: 'Deal 1' } },
      };
      mockApi.getDeal.mockResolvedValue(mockResponse);

      await executeToolWithCredentials(
        'productive',
        { resource: 'deals', action: 'get', id: '123', include: ['project'] },
        credentials,
      );

      expect(mockApi.getDeal).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          include: expect.arrayContaining(['company', 'deal_status', 'responsible', 'project']),
        }),
      );
    });
  });

  describe('bookings', () => {
    it('should use default includes when no user includes', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'bookings', attributes: { started_on: '2024-01-01' } }],
        meta: { current_page: 1, total_pages: 1 },
      };
      mockApi.getBookings.mockResolvedValue(mockResponse);

      await executeToolWithCredentials(
        'productive',
        { resource: 'bookings', action: 'list' },
        credentials,
      );

      expect(mockApi.getBookings).toHaveBeenCalledWith(
        expect.objectContaining({
          include: ['person', 'service'],
        }),
      );
    });

    it('should merge user includes with defaults for list', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'bookings', attributes: { started_on: '2024-01-01' } }],
        meta: { current_page: 1, total_pages: 1 },
      };
      mockApi.getBookings.mockResolvedValue(mockResponse);

      await executeToolWithCredentials(
        'productive',
        { resource: 'bookings', action: 'list', include: ['event'] },
        credentials,
      );

      expect(mockApi.getBookings).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining(['person', 'service', 'event']),
        }),
      );
    });

    it('should merge user includes with defaults for get', async () => {
      const mockResponse = {
        data: { id: '1', type: 'bookings', attributes: { started_on: '2024-01-01' } },
      };
      mockApi.getBooking.mockResolvedValue(mockResponse);

      await executeToolWithCredentials(
        'productive',
        { resource: 'bookings', action: 'get', id: '123', include: ['event'] },
        credentials,
      );

      expect(mockApi.getBooking).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          include: expect.arrayContaining(['person', 'service', 'event']),
        }),
      );
    });
  });

  describe('comments', () => {
    it('should use default includes when no user includes', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'comments', attributes: { body: 'Comment 1' } }],
        meta: { current_page: 1, total_pages: 1 },
      };
      mockApi.getComments.mockResolvedValue(mockResponse);

      await executeToolWithCredentials(
        'productive',
        { resource: 'comments', action: 'list' },
        credentials,
      );

      expect(mockApi.getComments).toHaveBeenCalledWith(
        expect.objectContaining({
          include: ['creator'],
        }),
      );
    });

    it('should merge user includes with defaults for list', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'comments', attributes: { body: 'Comment 1' } }],
        meta: { current_page: 1, total_pages: 1 },
      };
      mockApi.getComments.mockResolvedValue(mockResponse);

      await executeToolWithCredentials(
        'productive',
        { resource: 'comments', action: 'list', include: ['task'] },
        credentials,
      );

      expect(mockApi.getComments).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining(['creator', 'task']),
        }),
      );
    });

    it('should merge user includes with defaults for get', async () => {
      const mockResponse = {
        data: { id: '1', type: 'comments', attributes: { body: 'Comment 1' } },
      };
      mockApi.getComment.mockResolvedValue(mockResponse);

      await executeToolWithCredentials(
        'productive',
        { resource: 'comments', action: 'get', id: '123', include: ['deal'] },
        credentials,
      );

      expect(mockApi.getComment).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          include: expect.arrayContaining(['creator', 'deal']),
        }),
      );
    });

    it('should resolve task commentable hints for get', async () => {
      const mockResponse = {
        data: {
          id: '1',
          type: 'comments',
          attributes: { body: 'Comment 1', commentable_type: 'task' },
          relationships: { task: { data: { id: '55' } } },
        },
      };
      mockApi.getComment.mockResolvedValue(mockResponse);

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'comments', action: 'get', id: '1' },
        credentials,
      );

      expect(result.isError).toBeUndefined();
    });

    it('should resolve deal commentable hints for get', async () => {
      const mockResponse = {
        data: {
          id: '1',
          type: 'comments',
          attributes: { body: 'Comment 1', commentable_type: 'deal' },
          relationships: { deal: { data: { id: '99' } } },
        },
      };
      mockApi.getComment.mockResolvedValue(mockResponse);

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'comments', action: 'get', id: '1' },
        credentials,
      );

      expect(result.isError).toBeUndefined();
    });

    it('should resolve company commentable hints for get', async () => {
      const mockResponse = {
        data: {
          id: '1',
          type: 'comments',
          attributes: { body: 'Comment 1', commentable_type: 'company' },
          relationships: { company: { data: { id: '77' } } },
        },
      };
      mockApi.getComment.mockResolvedValue(mockResponse);

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'comments', action: 'get', id: '1' },
        credentials,
      );

      expect(result.isError).toBeUndefined();
    });
  });

  describe('attachments', () => {
    it('should handle list action', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            type: 'attachments',
            attributes: { name: 'file.png', content_type: 'image/png', size: 1024 },
          },
        ],
        meta: { current_page: 1, total_pages: 1 },
      };
      mockApi.getAttachments.mockResolvedValue(mockResponse);

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'attachments', action: 'list' },
        credentials,
      );

      expect(result.isError).toBeFalsy();
      expect(mockApi.getAttachments).toHaveBeenCalled();
    });

    it('should handle get action', async () => {
      const mockResponse = {
        data: {
          id: '1',
          type: 'attachments',
          attributes: { name: 'file.png', content_type: 'image/png', size: 1024 },
        },
      };
      mockApi.getAttachment.mockResolvedValue(mockResponse);

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'attachments', action: 'get', id: '1' },
        credentials,
      );

      expect(result.isError).toBeFalsy();
      expect(mockApi.getAttachment).toHaveBeenCalledWith('1');
    });

    it('should handle delete action', async () => {
      mockApi.deleteAttachment.mockResolvedValue(undefined);

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'attachments', action: 'delete', id: '42' },
        credentials,
      );

      expect(result.isError).toBeFalsy();
      expect(mockApi.deleteAttachment).toHaveBeenCalledWith('42');
      const content = JSON.parse(result.content[0].text as string);
      expect(content.success).toBe(true);
      expect(content.deleted).toBe('42');
    });

    it('should return error for get without id', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'attachments', action: 'get' },
        credentials,
      );

      expect(result.isError).toBe(true);
    });

    it('should return error for delete without id', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'attachments', action: 'delete' },
        credentials,
      );

      expect(result.isError).toBe(true);
    });

    it('should return error for invalid action', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'attachments', action: 'create' },
        credentials,
      );

      expect(result.isError).toBe(true);
    });

    it('should pass filter for list', async () => {
      const mockResponse = { data: [], meta: {} };
      mockApi.getAttachments.mockResolvedValue(mockResponse);

      await executeToolWithCredentials(
        'productive',
        { resource: 'attachments', action: 'list', filter: { task_id: '123' } },
        credentials,
      );

      expect(mockApi.getAttachments).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ task_id: '123' }),
        }),
      );
    });

    it('should handle get action with no_hints', async () => {
      const mockResponse = {
        data: {
          id: '1',
          type: 'attachments',
          attributes: { name: 'file.png', content_type: 'image/png', size: 1024 },
        },
      };
      mockApi.getAttachment.mockResolvedValue(mockResponse);

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'attachments', action: 'get', id: '1', no_hints: true },
        credentials,
      );

      expect(result.isError).toBeFalsy();
      const content = JSON.parse(result.content[0].text as string);
      // When no_hints is true, _hints should not be included
      expect(content._hints).toBeUndefined();
    });

    it('should pass task_id filter', async () => {
      const mockResponse = { data: [], meta: {} };
      mockApi.getAttachments.mockResolvedValue(mockResponse);

      await executeToolWithCredentials(
        'productive',
        { resource: 'attachments', action: 'list', task_id: '456' },
        credentials,
      );

      expect(mockApi.getAttachments).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ task_id: '456' }),
        }),
      );
    });

    it('should pass comment_id filter', async () => {
      const mockResponse = { data: [], meta: {} };
      mockApi.getAttachments.mockResolvedValue(mockResponse);

      await executeToolWithCredentials(
        'productive',
        { resource: 'attachments', action: 'list', comment_id: '789' },
        credentials,
      );

      expect(mockApi.getAttachments).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ comment_id: '789' }),
        }),
      );
    });

    it('should pass deal_id filter', async () => {
      const mockResponse = { data: [], meta: {} };
      mockApi.getAttachments.mockResolvedValue(mockResponse);

      await executeToolWithCredentials(
        'productive',
        { resource: 'attachments', action: 'list', deal_id: '101' },
        credentials,
      );

      expect(mockApi.getAttachments).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ deal_id: '101' }),
        }),
      );
    });
  });

  describe('timers', () => {
    it('should pass user includes for list', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'timers', attributes: { started_at: '2024-01-01T10:00:00Z' } }],
        meta: { current_page: 1, total_pages: 1 },
      };
      mockApi.getTimers.mockResolvedValue(mockResponse);

      await executeToolWithCredentials(
        'productive',
        { resource: 'timers', action: 'list', include: ['time_entry', 'service'] },
        credentials,
      );

      expect(mockApi.getTimers).toHaveBeenCalledWith(
        expect.objectContaining({
          include: ['time_entry', 'service'],
        }),
      );
    });

    it('should pass user includes for get', async () => {
      const mockResponse = {
        data: { id: '1', type: 'timers', attributes: { started_at: '2024-01-01T10:00:00Z' } },
      };
      mockApi.getTimer.mockResolvedValue(mockResponse);

      await executeToolWithCredentials(
        'productive',
        { resource: 'timers', action: 'get', id: '123', include: ['time_entry'] },
        credentials,
      );

      expect(mockApi.getTimer).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          include: ['time_entry'],
        }),
      );
    });
  });
});

describe('smart ID resolution', () => {
  const credentials: ProductiveCredentials = {
    apiToken: 'test-token',
    organizationId: 'test-org',
    userId: '500521',
  };

  let mockApi: ReturnType<typeof ProductiveApi>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi = new ProductiveApi({}) as ReturnType<typeof ProductiveApi>;
  });

  describe('time resource', () => {
    it('should resolve person email in create action', async () => {
      mockApi.getPeople.mockResolvedValue({
        data: [{ id: '500521', attributes: { first_name: 'John', last_name: 'Doe' } }],
      });
      mockApi.createTimeEntry.mockResolvedValue({
        data: { id: '789', type: 'time_entries', attributes: { date: '2024-01-15', time: 480 } },
      });

      const result = await executeToolWithCredentials(
        'productive',
        {
          resource: 'time',
          action: 'create',
          person_id: 'john@example.com',
          service_id: '456',
          time: 480,
          date: '2024-01-15',
        },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      expect(mockApi.getPeople).toHaveBeenCalled();
      expect(mockApi.createTimeEntry).toHaveBeenCalledWith(
        expect.objectContaining({ person_id: '500521' }),
      );
    });

    it('should resolve filter with email in list action', async () => {
      mockApi.getPeople.mockResolvedValue({
        data: [{ id: '500521', attributes: { first_name: 'John', last_name: 'Doe' } }],
      });
      mockApi.getTimeEntries.mockResolvedValue({
        data: [{ id: '1', type: 'time_entries', attributes: { date: '2024-01-15', time: 480 } }],
        meta: { current_page: 1, total_pages: 1 },
      });

      const result = await executeToolWithCredentials(
        'productive',
        {
          resource: 'time',
          action: 'list',
          filter: { person_id: 'john@example.com' },
        },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      expect(mockApi.getPeople).toHaveBeenCalled();
      expect(mockApi.getTimeEntries).toHaveBeenCalledWith(
        expect.objectContaining({ filter: { person_id: '500521' } }),
      );
      // Check resolution metadata is included
      const content = JSON.parse(result.content[0].text as string);
      expect(content._resolved).toBeDefined();
      expect(content._resolved.person_id).toBeDefined();
    });

    it('should handle resolve action for time resource', async () => {
      mockApi.getPeople.mockResolvedValue({
        data: [{ id: '500521', attributes: { first_name: 'John', last_name: 'Doe' } }],
      });

      const result = await executeToolWithCredentials(
        'productive',
        {
          resource: 'time',
          action: 'resolve',
          query: 'john@example.com',
        },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text as string);
      expect(content.matches).toBeDefined();
      expect(content.matches[0].id).toBe('500521');
    });
  });

  describe('deals resource', () => {
    it('should resolve deal number in get action', async () => {
      mockApi.getDeals.mockResolvedValue({
        data: [{ id: '888', attributes: { name: 'Test Deal' } }],
      });
      mockApi.getDeal.mockResolvedValue({
        data: { id: '888', type: 'deals', attributes: { name: 'Test Deal' } },
      });

      const result = await executeToolWithCredentials(
        'productive',
        {
          resource: 'deals',
          action: 'get',
          id: 'D-123',
        },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      expect(mockApi.getDeals).toHaveBeenCalled();
      expect(mockApi.getDeal).toHaveBeenCalledWith('888', expect.anything());
    });

    it('should resolve company name in create action', async () => {
      mockApi.getCompanies.mockResolvedValue({
        data: [{ id: '999', attributes: { name: 'Test Company' } }],
      });
      mockApi.createDeal.mockResolvedValue({
        data: { id: '888', type: 'deals', attributes: { name: 'New Deal' } },
      });

      const result = await executeToolWithCredentials(
        'productive',
        {
          resource: 'deals',
          action: 'create',
          name: 'New Deal',
          company_id: 'Test Company',
        },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      expect(mockApi.getCompanies).toHaveBeenCalled();
      expect(mockApi.createDeal).toHaveBeenCalledWith(
        expect.objectContaining({ company_id: '999' }),
      );
    });

    it('should handle resolve action for deals resource', async () => {
      mockApi.getDeals.mockResolvedValue({
        data: [{ id: '888', attributes: { name: 'Test Deal' } }],
      });

      const result = await executeToolWithCredentials(
        'productive',
        {
          resource: 'deals',
          action: 'resolve',
          query: 'D-123',
        },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text as string);
      expect(content.matches).toBeDefined();
    });
  });

  describe('people resource', () => {
    it('should resolve email in get action', async () => {
      mockApi.getPeople.mockResolvedValue({
        data: [{ id: '500521', attributes: { first_name: 'John', last_name: 'Doe' } }],
      });
      mockApi.getPerson.mockResolvedValue({
        data: {
          id: '500521',
          type: 'people',
          attributes: { first_name: 'John', last_name: 'Doe' },
        },
      });

      const result = await executeToolWithCredentials(
        'productive',
        {
          resource: 'people',
          action: 'get',
          id: 'john@example.com',
        },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      expect(mockApi.getPeople).toHaveBeenCalled();
      expect(mockApi.getPerson).toHaveBeenCalledWith('500521');
    });

    it('should handle resolve action for people resource', async () => {
      mockApi.getPeople.mockResolvedValue({
        data: [{ id: '500521', attributes: { first_name: 'John', last_name: 'Doe' } }],
      });

      const result = await executeToolWithCredentials(
        'productive',
        {
          resource: 'people',
          action: 'resolve',
          query: 'john@example.com',
        },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text as string);
      expect(content.matches).toBeDefined();
      expect(content.matches[0].type).toBe('person');
    });
  });

  describe('tasks resource', () => {
    it('should resolve project number in filter', async () => {
      mockApi.getProjects.mockResolvedValue({
        data: [{ id: '777', attributes: { name: 'Test Project' } }],
      });
      mockApi.getTasks.mockResolvedValue({
        data: [{ id: '1', type: 'tasks', attributes: { title: 'Task 1' } }],
        meta: { current_page: 1, total_pages: 1 },
      });

      const result = await executeToolWithCredentials(
        'productive',
        {
          resource: 'tasks',
          action: 'list',
          filter: { project_id: 'PRJ-123' },
        },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      expect(mockApi.getProjects).toHaveBeenCalled();
      expect(mockApi.getTasks).toHaveBeenCalledWith(
        expect.objectContaining({ filter: expect.objectContaining({ project_id: '777' }) }),
      );
    });
  });

  describe('projects resource', () => {
    it('should resolve project number in get action', async () => {
      mockApi.getProjects.mockResolvedValue({
        data: [{ id: '777', attributes: { name: 'Test Project' } }],
      });
      mockApi.getProject.mockResolvedValue({
        data: { id: '777', type: 'projects', attributes: { name: 'Test Project' } },
      });

      const result = await executeToolWithCredentials(
        'productive',
        {
          resource: 'projects',
          action: 'get',
          id: 'PRJ-123',
        },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      expect(mockApi.getProjects).toHaveBeenCalled();
      expect(mockApi.getProject).toHaveBeenCalledWith('777');
    });

    it('should resolve filter with company name in list action', async () => {
      mockApi.getCompanies.mockResolvedValue({
        data: [{ id: '999', attributes: { name: 'Test Company' } }],
      });
      mockApi.getProjects.mockResolvedValue({
        data: [{ id: '777', type: 'projects', attributes: { name: 'Test Project' } }],
        meta: { current_page: 1, total_pages: 1 },
      });

      const result = await executeToolWithCredentials(
        'productive',
        {
          resource: 'projects',
          action: 'list',
          filter: { company_id: 'Test Company' },
        },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text as string);
      expect(content._resolved).toBeDefined();
    });

    it('should handle resolve action for projects resource', async () => {
      mockApi.getProjects.mockResolvedValue({
        data: [{ id: '777', attributes: { name: 'Test Project' } }],
      });

      const result = await executeToolWithCredentials(
        'productive',
        {
          resource: 'projects',
          action: 'resolve',
          query: 'PRJ-123',
        },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text as string);
      expect(content.matches).toBeDefined();
    });
  });

  describe('deals resource - list resolution', () => {
    it('should resolve filter with company name in list action', async () => {
      mockApi.getCompanies.mockResolvedValue({
        data: [{ id: '999', attributes: { name: 'Test Company' } }],
      });
      mockApi.getDeals.mockResolvedValue({
        data: [{ id: '888', type: 'deals', attributes: { name: 'Test Deal' } }],
        meta: { current_page: 1, total_pages: 1 },
      });

      const result = await executeToolWithCredentials(
        'productive',
        {
          resource: 'deals',
          action: 'list',
          filter: { company_id: 'Test Company' },
        },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text as string);
      expect(content._resolved).toBeDefined();
    });
  });

  describe('people resource - list resolution', () => {
    it('should resolve filter with email in list action', async () => {
      mockApi.getPeople
        .mockResolvedValueOnce({
          data: [{ id: '500521', attributes: { first_name: 'John', last_name: 'Doe' } }],
        })
        .mockResolvedValueOnce({
          data: [
            { id: '500521', type: 'people', attributes: { first_name: 'John', last_name: 'Doe' } },
          ],
          meta: { current_page: 1, total_pages: 1 },
        });

      const result = await executeToolWithCredentials(
        'productive',
        {
          resource: 'people',
          action: 'list',
          filter: { creator_id: 'john@example.com' },
        },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text as string);
      expect(content._resolved).toBeDefined();
    });
  });

  describe('time resource - service resolution', () => {
    it('should resolve service_id in create action', async () => {
      mockApi.getServices.mockResolvedValue({
        data: [{ id: '111', attributes: { name: 'Development' } }],
      });
      mockApi.createTimeEntry.mockResolvedValue({
        data: { id: '789', type: 'time_entries', attributes: { date: '2024-01-15', time: 480 } },
      });

      const result = await executeToolWithCredentials(
        'productive',
        {
          resource: 'time',
          action: 'create',
          person_id: '123',
          service_id: 'Development',
          project_id: '777',
          time: 480,
          date: '2024-01-15',
        },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      expect(mockApi.getServices).toHaveBeenCalled();
      expect(mockApi.createTimeEntry).toHaveBeenCalledWith(
        expect.objectContaining({ service_id: '111' }),
      );
    });
  });

  describe('companies resource - resolve action', () => {
    it('should handle resolve action for companies resource', async () => {
      mockApi.getCompanies.mockResolvedValue({
        data: [{ id: '999', attributes: { name: 'Test Company' } }],
      });

      const result = await executeToolWithCredentials(
        'productive',
        {
          resource: 'companies',
          action: 'resolve',
          query: 'Test',
          type: 'company',
        },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text as string);
      expect(content.matches).toBeDefined();
    });
  });

  describe('no_hints option', () => {
    it('should not include hints for time get when no_hints is true', async () => {
      mockApi.getTimeEntry.mockResolvedValue({
        data: { id: '123', type: 'time_entries', attributes: { date: '2024-01-15', time: 480 } },
      });

      const result = await executeToolWithCredentials(
        'productive',
        {
          resource: 'time',
          action: 'get',
          id: '123',
          no_hints: true,
        },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text as string);
      expect(content._hints).toBeUndefined();
    });

    it('should not include hints for projects get when no_hints is true', async () => {
      mockApi.getProject.mockResolvedValue({
        data: { id: '777', type: 'projects', attributes: { name: 'Test Project' } },
      });

      const result = await executeToolWithCredentials(
        'productive',
        {
          resource: 'projects',
          action: 'get',
          id: '777',
          no_hints: true,
        },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text as string);
      expect(content._hints).toBeUndefined();
    });

    it('should not include hints for people get when no_hints is true', async () => {
      mockApi.getPerson.mockResolvedValue({
        data: {
          id: '500521',
          type: 'people',
          attributes: { first_name: 'John', last_name: 'Doe' },
        },
      });

      const result = await executeToolWithCredentials(
        'productive',
        {
          resource: 'people',
          action: 'get',
          id: '500521',
          no_hints: true,
        },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text as string);
      expect(content._hints).toBeUndefined();
    });

    it('should not include hints for people me when no_hints is true', async () => {
      mockApi.getPerson.mockResolvedValue({
        data: {
          id: '500521',
          type: 'people',
          attributes: { first_name: 'Test', last_name: 'User' },
        },
      });

      const result = await executeToolWithCredentials(
        'productive',
        {
          resource: 'people',
          action: 'me',
          no_hints: true,
        },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text as string);
      expect(content._hints).toBeUndefined();
    });

    it('should not include hints for deals get when no_hints is true', async () => {
      mockApi.getDeal.mockResolvedValue({
        data: { id: '888', type: 'deals', attributes: { name: 'Test Deal' } },
      });

      const result = await executeToolWithCredentials(
        'productive',
        {
          resource: 'deals',
          action: 'get',
          id: '888',
          no_hints: true,
        },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text as string);
      expect(content._hints).toBeUndefined();
    });

    it('should not include hints for tasks get when no_hints is true', async () => {
      mockApi.getTask.mockResolvedValue({
        data: { id: '456', type: 'tasks', attributes: { title: 'Test Task' } },
      });

      const result = await executeToolWithCredentials(
        'productive',
        {
          resource: 'tasks',
          action: 'get',
          id: '456',
          no_hints: true,
        },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text as string);
      expect(content._hints).toBeUndefined();
    });
  });

  describe('tasks resource - resolve action', () => {
    it('should handle resolve action for tasks resource', async () => {
      mockApi.getProjects.mockResolvedValue({
        data: [{ id: '777', attributes: { name: 'Test Project' } }],
      });

      const result = await executeToolWithCredentials(
        'productive',
        {
          resource: 'tasks',
          action: 'resolve',
          query: 'PRJ-123',
          type: 'project',
        },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text as string);
      expect(content.matches).toBeDefined();
    });
  });

  describe('pages resource', () => {
    it('should handle list action', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'pages', attributes: { title: 'Page 1' } }],
        meta: { current_page: 1, total_pages: 1 },
      };
      mockApi.getPages.mockResolvedValue(mockResponse);

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'pages', action: 'list' },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      expect(mockApi.getPages).toHaveBeenCalled();
    });

    it('should handle get action', async () => {
      const mockResponse = {
        data: { id: '1', type: 'pages', attributes: { title: 'Test Page' } },
      };
      mockApi.getPage.mockResolvedValue(mockResponse);

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'pages', action: 'get', id: '1' },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      expect(mockApi.getPage).toHaveBeenCalledWith('1');
    });

    it('should return error for get without id', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'pages', action: 'get' },
        credentials,
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('id is required');
    });

    it('should handle create action', async () => {
      const mockResponse = {
        data: { id: '1', type: 'pages', attributes: { title: 'New Page' } },
      };
      mockApi.createPage.mockResolvedValue(mockResponse);

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'pages', action: 'create', title: 'New Page', project_id: '10' },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      expect(mockApi.createPage).toHaveBeenCalled();
    });

    it('should return error for create without required fields', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'pages', action: 'create', title: 'No project' },
        credentials,
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('required');
    });

    it('should handle update action', async () => {
      const mockResponse = {
        data: { id: '1', type: 'pages', attributes: { title: 'Updated' } },
      };
      mockApi.updatePage.mockResolvedValue(mockResponse);

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'pages', action: 'update', id: '1', title: 'Updated' },
        credentials,
      );

      expect(result.isError).toBeUndefined();
    });

    it('should return error for update without id', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'pages', action: 'update', title: 'Updated' },
        credentials,
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('id is required');
    });

    it('should handle delete action', async () => {
      mockApi.deletePage.mockResolvedValue(undefined);

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'pages', action: 'delete', id: '1' },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      expect(mockApi.deletePage).toHaveBeenCalledWith('1');
    });

    it('should return error for delete without id', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'pages', action: 'delete' },
        credentials,
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('id is required');
    });

    it('should return error for invalid action', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'pages', action: 'start' },
        credentials,
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid action');
    });

    it('should handle get action without hints when no_hints is true', async () => {
      const mockResponse = {
        data: { id: '1', type: 'pages', attributes: { title: 'Test Page' } },
      };
      mockApi.getPage.mockResolvedValue(mockResponse);

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'pages', action: 'get', id: '1', no_hints: true },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text as string);
      expect(content._hints).toBeUndefined();
    });

    it('should include _resolved in list when filter is resolved', async () => {
      // Mock a filter that triggers resolution (e.g., filter by project name)
      mockApi.getProjects.mockResolvedValue({
        data: [{ id: '100', attributes: { name: 'Test Project' } }],
      });
      mockApi.getPages.mockResolvedValue({
        data: [{ id: '1', type: 'pages', attributes: { title: 'Page 1' } }],
        meta: { current_page: 1, total_pages: 1 },
      });

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'pages', action: 'list', filter: { project_id: 'Test Project' } },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text as string);
      expect(content._resolved).toBeDefined();
    });
  });

  describe('discussions resource', () => {
    it('should handle list action', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'discussions', attributes: { body: 'Test', status: 1 } }],
        meta: { current_page: 1, total_pages: 1 },
      };
      mockApi.getDiscussions.mockResolvedValue(mockResponse);

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'discussions', action: 'list' },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      expect(mockApi.getDiscussions).toHaveBeenCalled();
    });

    it('should handle get action', async () => {
      const mockResponse = {
        data: { id: '1', type: 'discussions', attributes: { body: 'Test', status: 1 } },
      };
      mockApi.getDiscussion.mockResolvedValue(mockResponse);

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'discussions', action: 'get', id: '1' },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      expect(mockApi.getDiscussion).toHaveBeenCalledWith('1');
    });

    it('should return error for get without id', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'discussions', action: 'get' },
        credentials,
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('id is required');
    });

    it('should handle create action', async () => {
      const mockResponse = {
        data: { id: '1', type: 'discussions', attributes: { body: 'Review', status: 1 } },
      };
      mockApi.createDiscussion.mockResolvedValue(mockResponse);

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'discussions', action: 'create', body: 'Review', page_id: '10' },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      expect(mockApi.createDiscussion).toHaveBeenCalled();
    });

    it('should return error for create without required fields', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'discussions', action: 'create', body: 'Missing page' },
        credentials,
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('required');
    });

    it('should handle update action', async () => {
      const mockResponse = {
        data: { id: '1', type: 'discussions', attributes: { body: 'Updated', status: 1 } },
      };
      mockApi.updateDiscussion.mockResolvedValue(mockResponse);

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'discussions', action: 'update', id: '1', body: 'Updated' },
        credentials,
      );

      expect(result.isError).toBeUndefined();
    });

    it('should return error for update without id', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'discussions', action: 'update', body: 'Updated' },
        credentials,
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('id is required');
    });

    it('should handle delete action', async () => {
      mockApi.deleteDiscussion.mockResolvedValue(undefined);

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'discussions', action: 'delete', id: '1' },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      expect(mockApi.deleteDiscussion).toHaveBeenCalledWith('1');
    });

    it('should return error for delete without id', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'discussions', action: 'delete' },
        credentials,
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('id is required');
    });

    it('should handle resolve action', async () => {
      const mockResponse = {
        data: {
          id: '1',
          type: 'discussions',
          attributes: { status: 2, resolved_at: '2024-01-05' },
        },
      };
      mockApi.resolveDiscussion.mockResolvedValue(mockResponse);

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'discussions', action: 'resolve', id: '1' },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      expect(mockApi.resolveDiscussion).toHaveBeenCalledWith('1');
    });

    it('should handle reopen action', async () => {
      const mockResponse = {
        data: { id: '1', type: 'discussions', attributes: { status: 1, resolved_at: null } },
      };
      mockApi.reopenDiscussion.mockResolvedValue(mockResponse);

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'discussions', action: 'reopen', id: '1' },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      expect(mockApi.reopenDiscussion).toHaveBeenCalledWith('1');
    });

    it('should return error for resolve without id', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'discussions', action: 'resolve' },
        credentials,
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('id is required');
    });

    it('should return error for reopen without id', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'discussions', action: 'reopen' },
        credentials,
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('id is required');
    });

    it('should handle list with status filter', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'discussions', attributes: { body: 'Test', status: 2 } }],
        meta: { current_page: 1, total_pages: 1 },
      };
      mockApi.getDiscussions.mockResolvedValue(mockResponse);

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'discussions', action: 'list', status: 'resolved' },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      expect(mockApi.getDiscussions).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ status: '2' }),
        }),
      );
    });

    it('should handle get action without hints when no_hints is true', async () => {
      const mockResponse = {
        data: { id: '1', type: 'discussions', attributes: { body: 'Test', status: 1 } },
      };
      mockApi.getDiscussion.mockResolvedValue(mockResponse);

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'discussions', action: 'get', id: '1', no_hints: true },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text as string);
      expect(content._hints).toBeUndefined();
    });

    it('should include _resolved in list when filter is resolved', async () => {
      // Mock a filter that triggers resolution (e.g., filter by person name)
      mockApi.getPeople.mockResolvedValue({
        data: [{ id: '500', attributes: { first_name: 'John', last_name: 'Doe' } }],
      });
      mockApi.getDiscussions.mockResolvedValue({
        data: [{ id: '1', type: 'discussions', attributes: { body: 'Test', status: 1 } }],
        meta: { current_page: 1, total_pages: 1 },
      });

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'discussions', action: 'list', filter: { creator_id: 'John Doe' } },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text as string);
      expect(content._resolved).toBeDefined();
    });

    it('should return error for invalid action', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'discussions', action: 'start' },
        credentials,
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid action');
    });
  });

  describe('summaries resource', () => {
    it('should handle my_day action', async () => {
      // Mock tasks (open and overdue calls)
      mockApi.getTasks.mockResolvedValue({
        data: [{ id: '1', type: 'tasks', attributes: { title: 'Task 1', due_date: '2024-01-20' } }],
        meta: { total_count: 1 },
        included: [],
      });
      // Mock time entries
      mockApi.getTimeEntries.mockResolvedValue({
        data: [{ id: '10', type: 'time_entries', attributes: { time: 120, date: '2024-01-15' } }],
        meta: { total_count: 1 },
        included: [],
      });
      // Mock timers
      mockApi.getTimers.mockResolvedValue({
        data: [
          {
            id: '20',
            type: 'timers',
            attributes: { started_at: '2024-01-15T10:00:00Z', total_time: 30, person_id: 1 },
          },
        ],
        included: [],
      });

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'summaries', action: 'my_day' },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text as string);
      expect(content.summary_type).toBe('my_day');
      expect(content.user_id).toBe('500521');
      expect(content.tasks).toBeDefined();
      expect(content.time).toBeDefined();
      expect(content.timers).toBeDefined();
    });

    it('should handle project_health action with project_id', async () => {
      // Mock project
      mockApi.getProject.mockResolvedValue({
        data: {
          id: '123',
          type: 'projects',
          attributes: { name: 'Test Project', project_number: 'PRJ-001' },
        },
      });
      // Mock tasks (open and overdue)
      mockApi.getTasks.mockResolvedValue({
        data: [{ id: '1', type: 'tasks', attributes: { title: 'Task 1' } }],
        meta: { total_count: 1 },
        included: [],
      });
      // Mock services
      mockApi.getServices.mockResolvedValue({
        data: [
          {
            id: '300',
            type: 'services',
            attributes: { name: 'Development', budgeted_time: 1000, worked_time: 500 },
          },
        ],
      });
      // Mock time entries
      mockApi.getTimeEntries.mockResolvedValue({
        data: [{ id: '10', type: 'time_entries', attributes: { time: 60 } }],
        meta: { total_count: 1 },
      });

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'summaries', action: 'project_health', project_id: '123' },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text as string);
      expect(content.summary_type).toBe('project_health');
      expect(content.project.id).toBe('123');
      expect(content.project.name).toBe('Test Project');
      expect(content.tasks).toBeDefined();
      expect(content.budget).toBeDefined();
      expect(content.recent_activity).toBeDefined();
    });

    it('should return error for project_health without project_id', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'summaries', action: 'project_health' },
        credentials,
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('project_id is required');
    });

    it('should handle team_pulse action', async () => {
      // Mock people
      mockApi.getPeople.mockResolvedValue({
        data: [
          {
            id: '500521',
            type: 'people',
            attributes: { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
          },
        ],
        meta: { total_count: 1 },
      });
      // Mock time entries
      mockApi.getTimeEntries.mockResolvedValue({
        data: [
          {
            id: '10',
            type: 'time_entries',
            attributes: { time: 120, date: '2024-01-15' },
            relationships: { person: { data: { id: '500521' } } },
          },
        ],
        meta: { total_count: 1 },
      });
      // Mock timers
      mockApi.getTimers.mockResolvedValue({
        data: [
          {
            id: '20',
            type: 'timers',
            attributes: { started_at: '2024-01-15T10:00:00Z', total_time: 30, person_id: 500521 },
          },
        ],
        included: [],
      });

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'summaries', action: 'team_pulse' },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text as string);
      expect(content.summary_type).toBe('team_pulse');
      expect(content.team).toBeDefined();
      expect(content.people).toBeDefined();
    });

    it('should handle help action', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'summaries', action: 'help' },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text as string);
      expect(content.resource).toBe('summaries');
      expect(content.description).toBeDefined();
      expect(content.actions).toBeDefined();
      expect(content.actions.my_day).toBeDefined();
      expect(content.actions.project_health).toBeDefined();
      expect(content.actions.team_pulse).toBeDefined();
    });

    it('should return error for invalid action', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'summaries', action: 'invalid_action' },
        credentials,
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid action');
    });
  });

  describe('batch resource', () => {
    it('should execute multiple operations in parallel', async () => {
      const mockProjectResponse = {
        data: { id: '123', type: 'projects', attributes: { name: 'Test Project' } },
      };
      const mockTaskResponse = {
        data: [{ id: '1', type: 'tasks', attributes: { title: 'Task 1' } }],
        meta: { current_page: 1, total_pages: 1 },
      };
      mockApi.getProject.mockResolvedValue(mockProjectResponse);
      mockApi.getTasks.mockResolvedValue(mockTaskResponse);

      const result = await executeToolWithCredentials(
        'productive',
        {
          resource: 'batch',
          action: 'run',
          operations: [
            { resource: 'projects', action: 'get', id: '123' },
            { resource: 'tasks', action: 'list', filter: { project_id: '123' } },
          ],
        },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text as string);
      expect(content._batch).toEqual({ total: 2, succeeded: 2, failed: 0 });
      expect(content.results).toHaveLength(2);
      expect(content.results[0].resource).toBe('projects');
      expect(content.results[0].action).toBe('get');
      expect(content.results[0].index).toBe(0);
      expect(content.results[0].data).toBeDefined();
      expect(content.results[1].resource).toBe('tasks');
      expect(content.results[1].action).toBe('list');
      expect(content.results[1].index).toBe(1);
    });

    it('should return error for empty operations array', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'batch', action: 'run', operations: [] },
        credentials,
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('cannot be empty');
    });

    it('should return error when operations is not provided', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'batch', action: 'run' },
        credentials,
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('must be an array');
    });

    it('should return error for operations exceeding max size', async () => {
      const operations = Array.from({ length: 11 }, (_, i) => ({
        resource: 'projects',
        action: 'list',
        page: i + 1,
      }));

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'batch', action: 'run', operations },
        credentials,
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('exceeds maximum size');
    });

    it('should handle mixed success and error operations', async () => {
      const mockProjectResponse = {
        data: { id: '123', type: 'projects', attributes: { name: 'Test Project' } },
      };
      mockApi.getProject.mockResolvedValue(mockProjectResponse);
      mockApi.getTask.mockRejectedValue(new Error('Not found'));

      const result = await executeToolWithCredentials(
        'productive',
        {
          resource: 'batch',
          action: 'run',
          operations: [
            { resource: 'projects', action: 'get', id: '123' },
            { resource: 'tasks', action: 'get', id: '999' },
          ],
        },
        credentials,
      );

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text as string);
      expect(content._batch).toEqual({ total: 2, succeeded: 1, failed: 1 });
      expect(content.results[0].data).toBeDefined();
      expect(content.results[1].error).toBeDefined();
    });

    it('should validate operation structure', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        {
          resource: 'batch',
          action: 'run',
          operations: [{ resource: 'projects' }], // missing action
        },
        credentials,
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('action');
    });

    it('should not initialize API client for batch resource', async () => {
      // This test verifies that batch handling happens before API initialization
      // by checking that even with invalid credentials, we still get proper batch validation errors
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'batch', action: 'run', operations: [] },
        { apiToken: '', organizationId: '', userId: '' },
      );

      // Should get batch validation error, not API error
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('cannot be empty');
    });
  });

  describe('include validation', () => {
    it('should return error for invalid include on tasks', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'tasks', action: 'list', include: ['notes'] },
        credentials,
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid include value');
      expect(result.content[0].text).toContain('notes');
    });

    it('should return error for invalid include on deals', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'deals', action: 'list', include: ['services'] },
        credentials,
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid include value');
      expect(result.content[0].text).toContain('services');
      // Should provide a helpful suggestion
      expect(result.content[0].text).toContain('resource=services');
    });

    it('should list valid includes in the error hints', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'tasks', action: 'list', include: ['foobar'] },
        credentials,
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('project');
      expect(result.content[0].text).toContain('assignee');
    });

    it('should pass through valid includes without error for tasks', async () => {
      mockApi.getTasks.mockResolvedValue({
        data: [{ id: '1', type: 'tasks', attributes: { title: 'Task 1' } }],
        meta: { current_page: 1, total_pages: 1 },
        included: [],
      });

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'tasks', action: 'list', include: ['project', 'assignee'] },
        credentials,
      );

      expect(result.isError).toBeUndefined();
    });

    it('should skip validation for resources with no include map (projects)', async () => {
      mockApi.getProjects.mockResolvedValue({
        data: [{ id: '1', type: 'projects', attributes: { name: 'Project 1' } }],
        meta: { current_page: 1, total_pages: 1 },
      });

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'projects', action: 'list', include: ['anything'] },
        credentials,
      );

      // Projects has no include map — should not error
      expect(result.isError).toBeUndefined();
    });

    it('should return error for multiple invalid includes', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'tasks', action: 'list', include: ['notes', 'services', 'time_entries'] },
        credentials,
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('notes');
      expect(result.content[0].text).toContain('services');
      expect(result.content[0].text).toContain('time_entries');
    });

    it('should mention valid includes when some are valid and some are not', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'tasks', action: 'list', include: ['project', 'notes'] },
        credentials,
      );

      expect(result.isError).toBe(true);
      // Should mention the valid includes that were found
      expect(result.content[0].text).toContain('project');
    });

    it('should not validate empty include array', async () => {
      mockApi.getTasks.mockResolvedValue({
        data: [{ id: '1', type: 'tasks', attributes: { title: 'Task 1' } }],
        meta: { current_page: 1, total_pages: 1 },
        included: [],
      });

      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'tasks', action: 'list', include: [] },
        credentials,
      );

      // Empty include array should not trigger validation error
      expect(result.isError).toBeUndefined();
    });

    it('should validate includes for comments resource', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'comments', action: 'list', include: ['author'] },
        credentials,
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('author');
      // Known suggestion: use "creator" instead
      expect(result.content[0].text).toContain('creator');
    });

    it('should validate includes for bookings resource', async () => {
      const result = await executeToolWithCredentials(
        'productive',
        { resource: 'bookings', action: 'list', include: ['project'] },
        credentials,
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('project');
      // Valid includes: person, service, event
      expect(result.content[0].text).toContain('person');
    });
  });
});
