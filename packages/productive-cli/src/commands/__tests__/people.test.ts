import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ProductiveApi, ProductiveApiError } from '../../api.js';
import { handlePeopleCommand } from '../people/index.js';

// Mock dependencies
vi.mock('../../api.js');
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

describe('people command', () => {
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
    it('should list active people by default', async () => {
      const mockPeople = {
        data: [
          {
            id: '1',
            attributes: {
              first_name: 'John',
              last_name: 'Doe',
              email: 'john@example.com',
              active: true,
              created_at: '2024-01-01',
              updated_at: '2024-01-02',
            },
          },
        ],
        meta: { total: 1, page: 1, per_page: 100 },
      };

      const mockApi = {
        getPeople: vi.fn().mockResolvedValue(mockPeople),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handlePeopleCommand('list', [], {});

      expect(mockApi.getPeople).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {},
        sort: '',
      });
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should list all people when --all flag is used', async () => {
      const mockPeople = {
        data: [
          {
            id: '1',
            attributes: {
              first_name: 'John',
              last_name: 'Doe',
              email: 'john@example.com',
              active: true,
              created_at: '2024-01-01',
              updated_at: '2024-01-02',
            },
          },
          {
            id: '2',
            attributes: {
              first_name: 'Jane',
              last_name: 'Smith',
              email: 'jane@example.com',
              active: false,
              created_at: '2024-01-01',
              updated_at: '2024-01-02',
            },
          },
        ],
        meta: { total: 2 },
      };

      const mockApi = {
        getPeople: vi.fn().mockResolvedValue(mockPeople),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handlePeopleCommand('list', [], { all: true });

      expect(mockApi.getPeople).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {},
        sort: '',
      });
    });

    it('should list people in json format', async () => {
      const mockPeople = {
        data: [
          {
            id: '1',
            attributes: {
              first_name: 'John',
              last_name: 'Doe',
              email: 'john@example.com',
              active: true,
              created_at: '2024-01-01',
              updated_at: '2024-01-02',
            },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getPeople: vi.fn().mockResolvedValue(mockPeople),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handlePeopleCommand('list', [], { format: 'json' });

      expect(mockApi.getPeople).toHaveBeenCalled();
    });

    it('should handle pagination and sorting', async () => {
      const mockPeople = {
        data: [],
        meta: { total: 0 },
      };

      const mockApi = {
        getPeople: vi.fn().mockResolvedValue(mockPeople),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handlePeopleCommand('list', [], {
        page: '2',
        size: '50',
        sort: 'last_name',
      });

      expect(mockApi.getPeople).toHaveBeenCalledWith({
        page: 2,
        perPage: 50,
        filter: {},
        sort: 'last_name',
      });
    });

    it('should filter people with extended filters', async () => {
      const mockPeople = {
        data: [],
        meta: { total: 0 },
      };

      const mockApi = {
        getPeople: vi.fn().mockResolvedValue(mockPeople),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handlePeopleCommand('list', [], {
        company: 'company-1',
        project: 'project-1',
        role: 'role-1',
        team: 'Engineering',
        type: 'user',
        status: 'active',
      });

      expect(mockApi.getPeople).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {
          company_id: 'company-1',
          project_id: 'project-1',
          role_id: 'role-1',
          team: 'Engineering',
          person_type: '1',
          status: '1',
        },
        sort: '',
      });
    });

    it('should filter people by type contact', async () => {
      const mockPeople = {
        data: [],
        meta: { total: 0 },
      };

      const mockApi = {
        getPeople: vi.fn().mockResolvedValue(mockPeople),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handlePeopleCommand('list', [], { type: 'contact' });

      expect(mockApi.getPeople).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { person_type: '2' },
        sort: '',
      });
    });

    it('should filter people by type placeholder', async () => {
      const mockPeople = {
        data: [],
        meta: { total: 0 },
      };

      const mockApi = {
        getPeople: vi.fn().mockResolvedValue(mockPeople),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handlePeopleCommand('list', [], { type: 'placeholder' });

      expect(mockApi.getPeople).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { person_type: '3' },
        sort: '',
      });
    });

    it('should filter people by status deactivated', async () => {
      const mockPeople = {
        data: [],
        meta: { total: 0 },
      };

      const mockApi = {
        getPeople: vi.fn().mockResolvedValue(mockPeople),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handlePeopleCommand('list', [], { status: 'deactivated' });

      expect(mockApi.getPeople).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { status: '2' },
        sort: '',
      });
    });

    it('should handle API errors', async () => {
      const mockError = new ProductiveApiError('API Error', 500);
      const mockApi = {
        getPeople: vi.fn().mockRejectedValue(mockError),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handlePeopleCommand('list', [], {});

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('get command', () => {
    it('should get a person by id', async () => {
      const mockPerson = {
        data: {
          id: '1',
          attributes: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
          relationships: {},
        },
      };

      const mockApi = {
        getPerson: vi.fn().mockResolvedValue(mockPerson),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handlePeopleCommand('get', ['1'], {});

      expect(mockApi.getPerson).toHaveBeenCalledWith('1');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should get a person in json format', async () => {
      const mockPerson = {
        data: {
          id: '1',
          attributes: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            active: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-02',
          },
          relationships: {},
        },
      };

      const mockApi = {
        getPerson: vi.fn().mockResolvedValue(mockPerson),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handlePeopleCommand('get', ['1'], { format: 'json' });

      expect(mockApi.getPerson).toHaveBeenCalledWith('1');
    });

    it('should exit with error when id is missing', async () => {
      try {
        await handlePeopleCommand('get', [], {});
      } catch {
        // exitWithValidationError throws after process.exit (which is mocked)
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should handle API errors', async () => {
      const mockError = new ProductiveApiError('Person not found', 404);
      const mockApi = {
        getPerson: vi.fn().mockRejectedValue(mockError),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handlePeopleCommand('get', ['999'], {});

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle unexpected errors', async () => {
      const mockApi = {
        getPerson: vi.fn().mockRejectedValue(new Error('Unexpected error')),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handlePeopleCommand('get', ['1'], {});

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('ls alias', () => {
    it('should work as an alias for list', async () => {
      const mockPeople = {
        data: [],
        meta: { total: 0 },
      };

      const mockApi = {
        getPeople: vi.fn().mockResolvedValue(mockPeople),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handlePeopleCommand('ls', [], {});

      expect(mockApi.getPeople).toHaveBeenCalled();
    });
  });

  describe('unknown subcommand', () => {
    it('should exit with error for unknown subcommand', async () => {
      await handlePeopleCommand('unknown', [], {});

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
