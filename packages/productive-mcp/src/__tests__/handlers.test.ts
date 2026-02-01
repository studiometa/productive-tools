import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeToolWithCredentials } from '../handlers.js';
import type { ProductiveCredentials } from '../auth.js';

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
  };

  return {
    ProductiveApi: vi.fn(() => mockApi),
    // Re-export formatter functions as pass-through
    formatTimeEntry: vi.fn((entry) => ({ id: entry.id, ...entry.attributes })),
    formatProject: vi.fn((project) => ({ id: project.id, ...project.attributes })),
    formatTask: vi.fn((task) => ({ id: task.id, ...task.attributes })),
    formatPerson: vi.fn((person) => ({ id: person.id, ...person.attributes })),
    formatService: vi.fn((service) => ({ id: service.id, ...service.attributes })),
    formatListResponse: vi.fn((data, formatter, meta) => ({
      data: data.map((item: Record<string, unknown>) => formatter(item)),
      meta,
    })),
  };
});

// Import mocked module to access mock functions
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
    describe('project tools', () => {
      it('should handle productive_list_projects', async () => {
        const mockResponse = {
          data: [
            { id: '1', type: 'projects', attributes: { name: 'Project 1' } },
            { id: '2', type: 'projects', attributes: { name: 'Project 2' } },
          ],
          meta: { current_page: 1, total_pages: 1 },
        };
        mockApi.getProjects.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive_list_projects',
          { page: 1, per_page: 50 },
          credentials
        );

        expect(result.isError).toBeUndefined();
        expect(result.content[0].type).toBe('text');
        expect(mockApi.getProjects).toHaveBeenCalledWith({ page: 1, per_page: 50 });
      });

      it('should handle productive_get_project', async () => {
        const mockResponse = {
          data: { id: '123', type: 'projects', attributes: { name: 'Test Project' } },
        };
        mockApi.getProject.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive_get_project',
          { id: '123' },
          credentials
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getProject).toHaveBeenCalledWith('123');
      });
    });

    describe('time entry tools', () => {
      it('should handle productive_list_time_entries', async () => {
        const mockResponse = {
          data: [
            { id: '1', type: 'time_entries', attributes: { date: '2024-01-15', time: 480 } },
          ],
          meta: { current_page: 1, total_pages: 1 },
        };
        mockApi.getTimeEntries.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive_list_time_entries',
          { filter: { person_id: '123' } },
          credentials
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getTimeEntries).toHaveBeenCalledWith({ filter: { person_id: '123' } });
      });

      it('should handle productive_get_time_entry', async () => {
        const mockResponse = {
          data: { id: '456', type: 'time_entries', attributes: { date: '2024-01-15', time: 480 } },
        };
        mockApi.getTimeEntry.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive_get_time_entry',
          { id: '456' },
          credentials
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getTimeEntry).toHaveBeenCalledWith('456');
      });

      it('should handle productive_create_time_entry', async () => {
        const mockResponse = {
          data: { id: '789', type: 'time_entries', attributes: { date: '2024-01-15', time: 480 } },
        };
        mockApi.createTimeEntry.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive_create_time_entry',
          {
            person_id: '123',
            service_id: '456',
            time: 480,
            date: '2024-01-15',
            note: 'Test entry',
          },
          credentials
        );

        expect(result.isError).toBeUndefined();
        const content = JSON.parse(result.content[0].text as string);
        expect(content.success).toBe(true);
        expect(mockApi.createTimeEntry).toHaveBeenCalled();
      });

      it('should handle productive_update_time_entry', async () => {
        const mockResponse = {
          data: { id: '789', type: 'time_entries', attributes: { date: '2024-01-15', time: 240 } },
        };
        mockApi.updateTimeEntry.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive_update_time_entry',
          { id: '789', time: 240 },
          credentials
        );

        expect(result.isError).toBeUndefined();
        const content = JSON.parse(result.content[0].text as string);
        expect(content.success).toBe(true);
        expect(mockApi.updateTimeEntry).toHaveBeenCalledWith('789', { time: 240 });
      });

      it('should handle productive_delete_time_entry', async () => {
        mockApi.deleteTimeEntry.mockResolvedValue(undefined);

        const result = await executeToolWithCredentials(
          'productive_delete_time_entry',
          { id: '789' },
          credentials
        );

        expect(result.isError).toBeUndefined();
        const content = JSON.parse(result.content[0].text as string);
        expect(content.success).toBe(true);
        expect(content.message).toBe('Time entry deleted');
        expect(mockApi.deleteTimeEntry).toHaveBeenCalledWith('789');
      });
    });

    describe('task tools', () => {
      it('should handle productive_list_tasks', async () => {
        const mockResponse = {
          data: [
            { id: '1', type: 'tasks', attributes: { title: 'Task 1' } },
          ],
          meta: { current_page: 1, total_pages: 1 },
          included: [],
        };
        mockApi.getTasks.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive_list_tasks',
          { filter: { project_id: '123' } },
          credentials
        );

        expect(result.isError).toBeUndefined();
        // Verify include is added for context
        expect(mockApi.getTasks).toHaveBeenCalledWith(
          expect.objectContaining({
            include: ['project', 'project.company'],
          })
        );
      });

      it('should handle productive_get_task', async () => {
        const mockResponse = {
          data: { id: '456', type: 'tasks', attributes: { title: 'Test Task' } },
          included: [],
        };
        mockApi.getTask.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive_get_task',
          { id: '456' },
          credentials
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getTask).toHaveBeenCalledWith('456', {
          include: ['project', 'project.company'],
        });
      });
    });

    describe('people tools', () => {
      it('should handle productive_list_people', async () => {
        const mockResponse = {
          data: [
            { id: '1', type: 'people', attributes: { first_name: 'John', last_name: 'Doe' } },
          ],
          meta: { current_page: 1, total_pages: 1 },
        };
        mockApi.getPeople.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive_list_people',
          {},
          credentials
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getPeople).toHaveBeenCalled();
      });

      it('should handle productive_get_person', async () => {
        const mockResponse = {
          data: { id: '123', type: 'people', attributes: { first_name: 'John', last_name: 'Doe' } },
        };
        mockApi.getPerson.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive_get_person',
          { id: '123' },
          credentials
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getPerson).toHaveBeenCalledWith('123');
      });

      it('should handle productive_get_current_user with userId', async () => {
        const mockResponse = {
          data: { id: 'test-user', type: 'people', attributes: { first_name: 'Test', last_name: 'User' } },
        };
        mockApi.getPerson.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive_get_current_user',
          {},
          credentials
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getPerson).toHaveBeenCalledWith('test-user');
      });

      it('should handle productive_get_current_user without userId', async () => {
        const credentialsWithoutUser: ProductiveCredentials = {
          apiToken: 'test-token',
          organizationId: 'test-org',
        };

        const result = await executeToolWithCredentials(
          'productive_get_current_user',
          {},
          credentialsWithoutUser
        );

        expect(result.isError).toBeUndefined();
        const content = JSON.parse(result.content[0].text as string);
        expect(content.message).toContain('User ID not configured');
      });
    });

    describe('service tools', () => {
      it('should handle productive_list_services', async () => {
        const mockResponse = {
          data: [
            { id: '1', type: 'services', attributes: { name: 'Development' } },
          ],
          meta: { current_page: 1, total_pages: 1 },
        };
        mockApi.getServices.mockResolvedValue(mockResponse);

        const result = await executeToolWithCredentials(
          'productive_list_services',
          { filter: { project_id: '123' } },
          credentials
        );

        expect(result.isError).toBeUndefined();
        expect(mockApi.getServices).toHaveBeenCalledWith({ filter: { project_id: '123' } });
      });
    });

    describe('error handling', () => {
      it('should return error for unknown tool', async () => {
        const result = await executeToolWithCredentials(
          'unknown_tool',
          {},
          credentials
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Unknown tool');
      });

      it('should handle API errors gracefully', async () => {
        mockApi.getProjects.mockRejectedValue(new Error('API request failed: 401 Unauthorized'));

        const result = await executeToolWithCredentials(
          'productive_list_projects',
          {},
          credentials
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('401 Unauthorized');
      });

      it('should handle non-Error exceptions', async () => {
        mockApi.getProjects.mockRejectedValue('String error');

        const result = await executeToolWithCredentials(
          'productive_list_projects',
          {},
          credentials
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('String error');
      });
    });
  });
});
