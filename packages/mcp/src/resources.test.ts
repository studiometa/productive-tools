/**
 * Tests for MCP resources/ capability handlers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { HandlerContext, ToolResult } from './handlers/types.js';
import type { ResourceDeps } from './resources.js';

import {
  STATIC_RESOURCES,
  DYNAMIC_RESOURCES,
  RESOURCE_TEMPLATES,
  listResources,
  listResourceTemplates,
  readResource,
} from './resources.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const credentials = {
  organizationId: 'test-org',
  apiToken: 'test-token',
  userId: 'test-user',
};

/** Helper: create a successful ToolResult */
function toolSuccess(data: unknown): ToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

/** Helper: create an error ToolResult */
function toolError(message: string): ToolResult {
  return {
    isError: true as const,
    content: [{ type: 'text', text: message }],
  };
}

/** Mock handler context builder — returns a minimal HandlerContext */
function mockBuildHandlerContext(
  _credentials: unknown,
  overrides?: { filter?: Record<string, string> },
): HandlerContext {
  return {
    formatOptions: { compact: false },
    filter: overrides?.filter,
    perPage: 50,
    includeHints: false,
    includeSuggestions: false,
    executor: () => ({ api: {}, resolver: {}, config: { organizationId: 'test-org' } }) as any,
  };
}

/** Create mock deps with spy handlers */
function createMockDeps(): Required<ResourceDeps> & {
  handleSchemaOverview: ReturnType<typeof vi.fn>;
  handleSummaries: ReturnType<typeof vi.fn>;
  handleProjects: ReturnType<typeof vi.fn>;
  handleTasks: ReturnType<typeof vi.fn>;
  handlePeople: ReturnType<typeof vi.fn>;
  handleDeals: ReturnType<typeof vi.fn>;
  handleServices: ReturnType<typeof vi.fn>;
} {
  return {
    buildHandlerContext: mockBuildHandlerContext,
    handleSchemaOverview: vi.fn(),
    handleSummaries: vi.fn(),
    handleProjects: vi.fn(),
    handleTasks: vi.fn(),
    handlePeople: vi.fn(),
    handleDeals: vi.fn(),
    handleServices: vi.fn(),
    instructions: 'Test instructions content',
  };
}

let deps: ReturnType<typeof createMockDeps>;

beforeEach(() => {
  vi.clearAllMocks();
  deps = createMockDeps();
});

// ---------------------------------------------------------------------------
// Static resource definitions
// ---------------------------------------------------------------------------

describe('STATIC_RESOURCES', () => {
  it('should include productive://schema', () => {
    const schema = STATIC_RESOURCES.find((r) => r.uri === 'productive://schema');
    expect(schema).toBeDefined();
    expect(schema?.name).toBe('Schema');
    expect(schema?.mimeType).toBe('application/json');
  });

  it('should include productive://instructions', () => {
    const instr = STATIC_RESOURCES.find((r) => r.uri === 'productive://instructions');
    expect(instr).toBeDefined();
    expect(instr?.name).toBe('Instructions');
    expect(instr?.mimeType).toBe('application/json');
  });
});

describe('DYNAMIC_RESOURCES', () => {
  it('should include productive://summaries/my_day', () => {
    const res = DYNAMIC_RESOURCES.find((r) => r.uri === 'productive://summaries/my_day');
    expect(res).toBeDefined();
    expect(res?.name).toBe('My Day');
    expect(res?.mimeType).toBe('application/json');
  });

  it('should include productive://summaries/team_pulse', () => {
    const res = DYNAMIC_RESOURCES.find((r) => r.uri === 'productive://summaries/team_pulse');
    expect(res).toBeDefined();
    expect(res?.name).toBe('Team Pulse');
    expect(res?.mimeType).toBe('application/json');
  });
});

describe('RESOURCE_TEMPLATES', () => {
  it('should define six templates', () => {
    expect(RESOURCE_TEMPLATES).toHaveLength(6);
  });

  it('should include project template', () => {
    const t = RESOURCE_TEMPLATES.find((r) => r.uriTemplate === 'productive://projects/{id}');
    expect(t).toBeDefined();
    expect(t?.name).toBe('Project');
    expect(t?.mimeType).toBe('application/json');
  });

  it('should include task template', () => {
    const t = RESOURCE_TEMPLATES.find((r) => r.uriTemplate === 'productive://tasks/{id}');
    expect(t).toBeDefined();
    expect(t?.name).toBe('Task');
  });

  it('should include person template', () => {
    const t = RESOURCE_TEMPLATES.find((r) => r.uriTemplate === 'productive://people/{id}');
    expect(t).toBeDefined();
    expect(t?.name).toBe('Person');
  });

  it('should include deal template', () => {
    const t = RESOURCE_TEMPLATES.find((r) => r.uriTemplate === 'productive://deals/{id}');
    expect(t).toBeDefined();
    expect(t?.name).toBe('Deal');
  });

  it('should include project tasks template', () => {
    const t = RESOURCE_TEMPLATES.find((r) => r.uriTemplate === 'productive://projects/{id}/tasks');
    expect(t).toBeDefined();
    expect(t?.name).toBe('Project Tasks');
  });

  it('should include project services template', () => {
    const t = RESOURCE_TEMPLATES.find(
      (r) => r.uriTemplate === 'productive://projects/{id}/services',
    );
    expect(t).toBeDefined();
    expect(t?.name).toBe('Project Services');
  });
});

// ---------------------------------------------------------------------------
// listResources
// ---------------------------------------------------------------------------

describe('listResources', () => {
  it('should return all static + dynamic resources', () => {
    const resources = listResources();
    expect(resources.length).toBe(STATIC_RESOURCES.length + DYNAMIC_RESOURCES.length);
  });

  it('should include schema and instructions URIs', () => {
    const resources = listResources();
    const uris = resources.map((r) => r.uri);
    expect(uris).toContain('productive://schema');
    expect(uris).toContain('productive://instructions');
  });

  it('should include dynamic summary URIs', () => {
    const resources = listResources();
    const uris = resources.map((r) => r.uri);
    expect(uris).toContain('productive://summaries/my_day');
    expect(uris).toContain('productive://summaries/team_pulse');
  });
});

// ---------------------------------------------------------------------------
// listResourceTemplates
// ---------------------------------------------------------------------------

describe('listResourceTemplates', () => {
  it('should return all resource templates', () => {
    const templates = listResourceTemplates();
    expect(templates).toEqual(RESOURCE_TEMPLATES);
  });
});

// ---------------------------------------------------------------------------
// readResource – static resources
// ---------------------------------------------------------------------------

describe('readResource – static resources', () => {
  it('should return schema from productive://schema', async () => {
    const schemaData = { resources: [{ resource: 'projects', actions: ['list', 'get'] }] };
    deps.handleSchemaOverview.mockReturnValue(toolSuccess(schemaData));

    const result = await readResource('productive://schema', credentials, deps);

    expect(result.contents).toHaveLength(1);
    expect(result.contents[0].uri).toBe('productive://schema');
    expect(result.contents[0].mimeType).toBe('application/json');

    const parsed = JSON.parse(result.contents[0].text as string);
    expect(parsed).toEqual(schemaData);
    expect(deps.handleSchemaOverview).toHaveBeenCalledOnce();
  });

  it('should return instructions from productive://instructions', async () => {
    deps.handleSchemaOverview.mockReturnValue(toolSuccess({})); // not used
    const result = await readResource('productive://instructions', credentials, deps);

    expect(result.contents).toHaveLength(1);
    expect(result.contents[0].uri).toBe('productive://instructions');
    expect(result.contents[0].mimeType).toBe('application/json');

    const parsed = JSON.parse(result.contents[0].text as string);
    expect(parsed.instructions).toBe('Test instructions content');
  });

  it('should not call any API handler for schema', async () => {
    deps.handleSchemaOverview.mockReturnValue(toolSuccess({ resources: [] }));
    await readResource('productive://schema', credentials, deps);
    expect(deps.handleProjects).not.toHaveBeenCalled();
    expect(deps.handleTasks).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// readResource – dynamic resources
// ---------------------------------------------------------------------------

describe('readResource – dynamic resources', () => {
  it('should return my_day data from productive://summaries/my_day', async () => {
    const myDayData = { tasks: [], time: [], timers: [] };
    deps.handleSummaries.mockResolvedValue(toolSuccess(myDayData));

    const result = await readResource('productive://summaries/my_day', credentials, deps);

    expect(result.contents[0].uri).toBe('productive://summaries/my_day');
    const parsed = JSON.parse(result.contents[0].text as string);
    expect(parsed).toEqual(myDayData);
    expect(deps.handleSummaries).toHaveBeenCalledWith('my_day', {}, expect.any(Object));
  });

  it('should return team_pulse data from productive://summaries/team_pulse', async () => {
    const teamData = { team: { active_users: 5 }, people: [] };
    deps.handleSummaries.mockResolvedValue(toolSuccess(teamData));

    const result = await readResource('productive://summaries/team_pulse', credentials, deps);

    expect(result.contents[0].uri).toBe('productive://summaries/team_pulse');
    const parsed = JSON.parse(result.contents[0].text as string);
    expect(parsed).toEqual(teamData);
    expect(deps.handleSummaries).toHaveBeenCalledWith('team_pulse', {}, expect.any(Object));
  });

  it('should propagate errors from summary handlers', async () => {
    deps.handleSummaries.mockResolvedValue(toolError('Summaries failed'));

    await expect(readResource('productive://summaries/my_day', credentials, deps)).rejects.toThrow(
      'Summaries failed',
    );
  });
});

// ---------------------------------------------------------------------------
// readResource – resource templates (single entity)
// ---------------------------------------------------------------------------

describe('readResource – project by ID', () => {
  it('should call handleProjects with get action', async () => {
    const projectData = { id: '42', name: 'Test Project' };
    deps.handleProjects.mockResolvedValue(toolSuccess(projectData));

    const result = await readResource('productive://projects/42', credentials, deps);

    expect(result.contents[0].uri).toBe('productive://projects/42');
    const parsed = JSON.parse(result.contents[0].text as string);
    expect(parsed).toEqual(projectData);
    expect(deps.handleProjects).toHaveBeenCalledWith('get', { id: '42' }, expect.any(Object));
  });

  it('should propagate errors from project handler', async () => {
    deps.handleProjects.mockResolvedValue(toolError('Project not found'));
    await expect(readResource('productive://projects/999', credentials, deps)).rejects.toThrow(
      'Project not found',
    );
  });
});

describe('readResource – task by ID', () => {
  it('should call handleTasks with get action', async () => {
    const taskData = { id: '10', title: 'Fix bug' };
    deps.handleTasks.mockResolvedValue(toolSuccess(taskData));

    const result = await readResource('productive://tasks/10', credentials, deps);

    expect(result.contents[0].uri).toBe('productive://tasks/10');
    const parsed = JSON.parse(result.contents[0].text as string);
    expect(parsed).toEqual(taskData);
    expect(deps.handleTasks).toHaveBeenCalledWith('get', { id: '10' }, expect.any(Object));
  });
});

describe('readResource – person by ID', () => {
  it('should call handlePeople with get action and credentials', async () => {
    const personData = { id: '5', name: 'Alice' };
    deps.handlePeople.mockResolvedValue(toolSuccess(personData));

    const result = await readResource('productive://people/5', credentials, deps);

    expect(result.contents[0].uri).toBe('productive://people/5');
    const parsed = JSON.parse(result.contents[0].text as string);
    expect(parsed).toEqual(personData);
    expect(deps.handlePeople).toHaveBeenCalledWith(
      'get',
      { id: '5' },
      expect.any(Object),
      credentials,
    );
  });
});

describe('readResource – deal by ID', () => {
  it('should call handleDeals with get action', async () => {
    const dealData = { id: '7', name: 'Big Deal' };
    deps.handleDeals.mockResolvedValue(toolSuccess(dealData));

    const result = await readResource('productive://deals/7', credentials, deps);

    expect(result.contents[0].uri).toBe('productive://deals/7');
    const parsed = JSON.parse(result.contents[0].text as string);
    expect(parsed).toEqual(dealData);
    expect(deps.handleDeals).toHaveBeenCalledWith('get', { id: '7' }, expect.any(Object));
  });
});

// ---------------------------------------------------------------------------
// readResource – nested resource templates
// ---------------------------------------------------------------------------

describe('readResource – project tasks', () => {
  it('should call handleTasks with list action and project_id filter', async () => {
    const tasksData = { data: [{ id: '1', title: 'Task A' }] };
    deps.handleTasks.mockResolvedValue(toolSuccess(tasksData));

    const result = await readResource('productive://projects/42/tasks', credentials, deps);

    expect(result.contents[0].uri).toBe('productive://projects/42/tasks');
    const parsed = JSON.parse(result.contents[0].text as string);
    expect(parsed).toEqual(tasksData);

    expect(deps.handleTasks).toHaveBeenCalledWith(
      'list',
      { project_id: '42' },
      expect.objectContaining({ filter: { project_id: '42' } }),
    );
  });

  it('should propagate errors from tasks handler', async () => {
    deps.handleTasks.mockResolvedValue(toolError('Tasks error'));
    await expect(readResource('productive://projects/1/tasks', credentials, deps)).rejects.toThrow(
      'Tasks error',
    );
  });
});

describe('readResource – project services', () => {
  it('should call handleServices with list action and project_id filter', async () => {
    const servicesData = { data: [{ id: '3', name: 'Development' }] };
    deps.handleServices.mockResolvedValue(toolSuccess(servicesData));

    const result = await readResource('productive://projects/42/services', credentials, deps);

    expect(result.contents[0].uri).toBe('productive://projects/42/services');
    const parsed = JSON.parse(result.contents[0].text as string);
    expect(parsed).toEqual(servicesData);

    expect(deps.handleServices).toHaveBeenCalledWith(
      'list',
      {},
      expect.objectContaining({ filter: { project_id: '42' } }),
    );
  });
});

// ---------------------------------------------------------------------------
// readResource – unknown URI
// ---------------------------------------------------------------------------

describe('readResource – unknown URI', () => {
  it('should throw for completely unknown URI', async () => {
    await expect(readResource('productive://unknown/resource', credentials, deps)).rejects.toThrow(
      'Unknown resource URI: productive://unknown/resource',
    );
  });

  it('should throw for malformed productive URI', async () => {
    await expect(readResource('productive://', credentials, deps)).rejects.toThrow(
      'Unknown resource URI',
    );
  });

  it('should throw for non-productive URI', async () => {
    await expect(readResource('https://example.com', credentials, deps)).rejects.toThrow(
      'Unknown resource URI',
    );
  });

  it('should include available resource URIs in error message', async () => {
    try {
      await readResource('productive://bogus', credentials, deps);
      expect.fail('should have thrown');
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain('productive://schema');
      expect(message).toContain('productive://summaries/my_day');
      expect(message).toContain('productive://projects/{id}');
    }
  });
});

// ---------------------------------------------------------------------------
// readResource – result content format
// ---------------------------------------------------------------------------

describe('readResource – result format', () => {
  it('should always return exactly one content item', async () => {
    deps.handleSchemaOverview.mockReturnValue(toolSuccess({ resources: [] }));
    const result = await readResource('productive://schema', credentials, deps);
    expect(result.contents).toHaveLength(1);
  });

  it('should always set mimeType to application/json', async () => {
    deps.handleSchemaOverview.mockReturnValue(toolSuccess({}));
    const result = await readResource('productive://schema', credentials, deps);
    expect(result.contents[0].mimeType).toBe('application/json');
  });

  it('should pretty-print the JSON text', async () => {
    deps.handleProjects.mockResolvedValue(toolSuccess({ id: '1', name: 'Proj' }));
    const result = await readResource('productive://projects/1', credentials, deps);
    expect(result.contents[0].text).toContain('\n');
  });
});
