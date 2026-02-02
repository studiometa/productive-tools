import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { ProductiveCredentials } from '../auth.js';

import { executeToolWithCredentials } from '../handlers.js';

// Mock the ProductiveApi
vi.mock('@studiometa/productive-cli', () => {
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
    getServices: vi.fn(),
    getPeople: vi.fn(),
    getPerson: vi.fn(),
    getReports: vi.fn(),
    // Additional handlers for include tests
    getDeals: vi.fn(),
    getDeal: vi.fn(),
    getBookings: vi.fn(),
    getBooking: vi.fn(),
    getComments: vi.fn(),
    getComment: vi.fn(),
    getTimers: vi.fn(),
    getTimer: vi.fn(),
  };

  return {
    ProductiveApi: vi.fn(() => mockApi),
    formatTimeEntry: vi.fn((entry) => ({ id: entry.id, ...entry.attributes })),
    formatProject: vi.fn((project) => ({ id: project.id, ...project.attributes })),
    formatTask: vi.fn((task) => ({ id: task.id, ...task.attributes })),
    formatPerson: vi.fn((person) => ({ id: person.id, ...person.attributes })),
    formatService: vi.fn((service) => ({ id: service.id, ...service.attributes })),
    formatDeal: vi.fn((deal) => ({ id: deal.id, ...deal.attributes })),
    formatBooking: vi.fn((booking) => ({ id: booking.id, ...booking.attributes })),
    formatComment: vi.fn((comment) => ({ id: comment.id, ...comment.attributes })),
    formatTimer: vi.fn((timer) => ({ id: timer.id, ...timer.attributes })),
    formatListResponse: vi.fn((data, formatter, meta) => ({
      data: data.map((item: Record<string, unknown>) => formatter(item)),
      meta,
    })),
  };
});

import { ProductiveApi } from '@studiometa/productive-cli';

describe('handlers', () => {
  const credentials: ProductiveCredentials = {
    apiToken: 'test-token',
    organizationId: 'test-org',
    userId: 'test-user',
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
        expect(result.content[0].text).toContain('required for create');
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
            id: 'test-user',
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
        expect(mockApi.getPerson).toHaveBeenCalledWith('test-user');
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
    });
  });
});

describe('help handler', () => {
  const credentials: ProductiveCredentials = {
    apiToken: 'test-token',
    organizationId: 'test-org',
    userId: 'test-user',
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
    userId: 'test-user',
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
    userId: 'test-user',
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
        { resource: 'deals', action: 'get', id: '123', include: ['services'] },
        credentials,
      );

      expect(mockApi.getDeal).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          include: expect.arrayContaining(['company', 'deal_status', 'responsible', 'services']),
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
        { resource: 'bookings', action: 'get', id: '123', include: ['approver'] },
        credentials,
      );

      expect(mockApi.getBooking).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          include: expect.arrayContaining(['person', 'service', 'approver']),
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
