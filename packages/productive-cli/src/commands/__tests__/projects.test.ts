import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ProductiveApi, ProductiveApiError } from '../../api.js';
import { handleProjectsCommand } from '../projects/index.js';

// Mock dependencies with proper ProductiveApiError implementation
vi.mock('../../api.js', () => ({
  ProductiveApi: vi.fn(),
  ProductiveApiError: class ProductiveApiError extends Error {
    constructor(
      message: string,
      public statusCode?: number,
      public response?: unknown,
    ) {
      super(message);
      this.name = 'ProductiveApiError';
    }
    toJSON() {
      return {
        error: this.name,
        message: this.message,
        statusCode: this.statusCode,
      };
    }
  },
}));
vi.mock('../../output.js', () => ({
  OutputFormatter: vi.fn().mockImplementation((format, noColor) => ({
    format,
    noColor,
    output: vi.fn(),
    error: vi.fn(),
  })),
  createSpinner: vi.fn(() => ({
    start: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn(),
  })),
}));

describe('projects command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('list command', () => {
    it('should list active projects by default', async () => {
      const mockProjects = {
        data: [
          {
            id: '1',
            attributes: {
              name: 'Project 1',
              project_number: 'PRJ-001',
              archived: false,
              budget: 10000,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-02T00:00:00Z',
            },
          },
        ],
        meta: { total: 1, page: 1, per_page: 100 },
      };

      const mockApi = {
        getProjects: vi.fn().mockResolvedValue(mockProjects),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleProjectsCommand('list', [], {});

      expect(mockApi.getProjects).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {},
        sort: '',
      });
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should list all projects including archived when --archived flag is used', async () => {
      const mockProjects = {
        data: [
          {
            id: '1',
            attributes: {
              name: 'Project 1',
              project_number: 'PRJ-001',
              archived: false,
              budget: 10000,
              created_at: '2024-01-01',
              updated_at: '2024-01-02',
            },
          },
          {
            id: '2',
            attributes: {
              name: 'Project 2',
              project_number: 'PRJ-002',
              archived: true,
              budget: 5000,
              created_at: '2024-01-01',
              updated_at: '2024-01-02',
            },
          },
        ],
        meta: { total: 2 },
      };

      const mockApi = {
        getProjects: vi.fn().mockResolvedValue(mockProjects),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleProjectsCommand('list', [], { archived: true });

      expect(mockApi.getProjects).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {},
        sort: '',
      });
    });

    it('should list projects in json format', async () => {
      const mockProjects = {
        data: [
          {
            id: '1',
            attributes: {
              name: 'Project 1',
              project_number: 'PRJ-001',
              archived: false,
              budget: 10000,
              created_at: '2024-01-01',
              updated_at: '2024-01-02',
            },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getProjects: vi.fn().mockResolvedValue(mockProjects),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleProjectsCommand('list', [], { format: 'json' });

      expect(mockApi.getProjects).toHaveBeenCalled();
    });

    it('should handle pagination and sorting', async () => {
      const mockProjects = {
        data: [],
        meta: { total: 0 },
      };

      const mockApi = {
        getProjects: vi.fn().mockResolvedValue(mockProjects),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleProjectsCommand('list', [], {
        page: '2',
        size: '50',
        sort: 'name',
      });

      expect(mockApi.getProjects).toHaveBeenCalledWith({
        page: 2,
        perPage: 50,
        filter: {},
        sort: 'name',
      });
    });

    it('should handle projects without optional fields', async () => {
      const mockProjects = {
        data: [
          {
            id: '1',
            attributes: {
              name: 'Project 1',
              project_number: null,
              archived: false,
              budget: null,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-02T00:00:00Z',
            },
          },
        ],
        meta: { total: 1 },
      };

      vi.mocked(ProductiveApi).mockImplementation(
        () =>
          ({
            getProjects: vi.fn().mockResolvedValue(mockProjects),
          }) as any,
      );

      await handleProjectsCommand('list', [], {});

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const mockError = new ProductiveApiError('API Error', 500);
      const mockApi = {
        getProjects: vi.fn().mockRejectedValue(mockError),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleProjectsCommand('list', [], {});

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('get command', () => {
    it('should get a project by id', async () => {
      const mockProject = {
        data: {
          id: '1',
          attributes: {
            name: 'Project 1',
            project_number: 'PRJ-001',
            archived: false,
            budget: 10000,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
          relationships: {},
        },
      };

      const mockApi = {
        getProject: vi.fn().mockResolvedValue(mockProject),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleProjectsCommand('get', ['1'], {});

      expect(mockApi.getProject).toHaveBeenCalledWith('1');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should get a project in json format', async () => {
      const mockProject = {
        data: {
          id: '1',
          attributes: {
            name: 'Project 1',
            project_number: 'PRJ-001',
            archived: false,
            budget: 10000,
            created_at: '2024-01-01',
            updated_at: '2024-01-02',
          },
          relationships: {},
        },
      };

      const mockApi = {
        getProject: vi.fn().mockResolvedValue(mockProject),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleProjectsCommand('get', ['1'], { format: 'json' });

      expect(mockApi.getProject).toHaveBeenCalledWith('1');
    });

    it('should handle projects without optional fields', async () => {
      const mockProject = {
        data: {
          id: '1',
          attributes: {
            name: 'Project 1',
            project_number: null,
            archived: false,
            budget: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
          relationships: {},
        },
      };

      const mockApi = {
        getProject: vi.fn().mockResolvedValue(mockProject),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleProjectsCommand('get', ['1'], {});

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      await handleProjectsCommand('get', [], {});

      expect(processExitSpy).toHaveBeenCalledWith(3); // Exit code 3 for validation errors
    });

    it('should handle API errors', async () => {
      const mockError = new ProductiveApiError('Project not found', 404);
      const mockApi = {
        getProject: vi.fn().mockRejectedValue(mockError),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleProjectsCommand('get', ['999'], {});

      expect(processExitSpy).toHaveBeenCalledWith(5); // Exit code 5 for not found errors
    });

    it('should handle unexpected errors', async () => {
      const mockApi = {
        getProject: vi.fn().mockRejectedValue(new Error('Unexpected error')),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleProjectsCommand('get', ['1'], {});

      expect(processExitSpy).toHaveBeenCalledWith(1); // Exit code 1 for general errors
    });
  });

  describe('ls alias', () => {
    it('should work as an alias for list', async () => {
      const mockProjects = {
        data: [],
        meta: { total: 0 },
      };

      const mockApi = {
        getProjects: vi.fn().mockResolvedValue(mockProjects),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleProjectsCommand('ls', [], {});

      expect(mockApi.getProjects).toHaveBeenCalled();
    });
  });

  describe('unknown subcommand', () => {
    it('should exit with error for unknown subcommand', async () => {
      await handleProjectsCommand('unknown', [], {});

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
