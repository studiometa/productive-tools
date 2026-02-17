/**
 * Tests for the resource handler factory.
 */

import type { JsonApiResource } from '@studiometa/productive-api';
import type { ExecutorContext } from '@studiometa/productive-core';

import { describe, it, expect, vi } from 'vitest';

import type { HandlerContext } from './types.js';

import { createResourceHandler } from './factory.js';

// Mock data
const mockProject: JsonApiResource = {
  id: '123',
  type: 'projects',
  attributes: {
    name: 'Test Project',
    number: 42,
  },
  relationships: {},
};

const mockProjects: JsonApiResource[] = [
  mockProject,
  {
    id: '456',
    type: 'projects',
    attributes: { name: 'Another Project', number: 43 },
    relationships: {},
  },
];

// Mock formatter
const mockFormatter = (item: JsonApiResource) => ({
  id: item.id,
  name: item.attributes?.name,
});

// Mock hints generator
const mockHints = (_data: JsonApiResource, id: string) => ({
  related_resources: [
    { resource: 'tasks', description: 'Get tasks', example: { filter: { project_id: id } } },
  ],
});

// Mock executor context factory
const createMockExecutorContext = (): ExecutorContext => ({
  api: {} as ExecutorContext['api'],
  resolver: {} as ExecutorContext['resolver'],
});

// Mock handler context factory
const createMockHandlerContext = (overrides?: Partial<HandlerContext>): HandlerContext => ({
  formatOptions: {},
  perPage: 20,
  executor: createMockExecutorContext,
  ...overrides,
});

describe('createResourceHandler', () => {
  describe('list action', () => {
    it('should call list executor and format results', async () => {
      const listExecutor = vi.fn().mockResolvedValue({
        data: mockProjects,
        meta: { total_count: 2, current_page: 1, total_pages: 1 },
      });

      const handler = createResourceHandler({
        resource: 'projects',
        actions: ['list', 'get'],
        formatter: mockFormatter,
        executors: { list: listExecutor },
      });

      const result = await handler('list', {}, createMockHandlerContext());

      expect(listExecutor).toHaveBeenCalled();
      expect(result.isError).toBeUndefined();
      const content = JSON.parse((result.content[0] as { text: string }).text);
      expect(content.data).toHaveLength(2);
      expect(content.data[0].id).toBe('123');
      // meta is only present when total_pages > 1
    });

    it('should include meta when there are multiple pages', async () => {
      const listExecutor = vi.fn().mockResolvedValue({
        data: mockProjects,
        meta: { total_count: 50, current_page: 1, total_pages: 3 },
      });

      const handler = createResourceHandler({
        resource: 'projects',
        actions: ['list'],
        formatter: mockFormatter,
        executors: { list: listExecutor },
      });

      const result = await handler('list', {}, createMockHandlerContext());

      const content = JSON.parse((result.content[0] as { text: string }).text);
      expect(content.meta).toBeDefined();
      expect(content.meta.total_pages).toBe(3);
    });

    it('should include _resolved when present', async () => {
      const listExecutor = vi.fn().mockResolvedValue({
        data: mockProjects,
        resolved: { project: 'Test Project → 123' },
      });

      const handler = createResourceHandler({
        resource: 'projects',
        actions: ['list'],
        formatter: mockFormatter,
        executors: { list: listExecutor },
      });

      const result = await handler('list', {}, createMockHandlerContext());

      const content = JSON.parse((result.content[0] as { text: string }).text);
      expect(content._resolved).toEqual({ project: 'Test Project → 123' });
    });

    it('should merge user includes with defaults', async () => {
      const listExecutor = vi.fn().mockResolvedValue({ data: [] });

      const handler = createResourceHandler({
        resource: 'projects',
        actions: ['list'],
        formatter: mockFormatter,
        defaultInclude: { list: ['company'] },
        executors: { list: listExecutor },
      });

      await handler('list', {}, createMockHandlerContext({ include: ['custom'] }));

      expect(listExecutor).toHaveBeenCalledWith(
        expect.objectContaining({ include: ['company', 'custom'] }),
        expect.anything(),
      );
    });
  });

  describe('get action', () => {
    it('should return error when id is missing', async () => {
      const handler = createResourceHandler({
        resource: 'projects',
        actions: ['list', 'get'],
        formatter: mockFormatter,
        executors: {
          list: vi.fn(),
          get: vi.fn(),
        },
      });

      const result = await handler('get', {}, createMockHandlerContext());

      expect(result.isError).toBe(true);
      expect((result.content[0] as { text: string }).text).toContain('id is required');
    });

    it('should call get executor and format result', async () => {
      const getExecutor = vi.fn().mockResolvedValue({ data: mockProject });

      const handler = createResourceHandler({
        resource: 'projects',
        actions: ['list', 'get'],
        formatter: mockFormatter,
        executors: {
          list: vi.fn(),
          get: getExecutor,
        },
      });

      const result = await handler(
        'get',
        { id: '123' },
        createMockHandlerContext({ includeHints: false }),
      );

      expect(getExecutor).toHaveBeenCalledWith(
        { id: '123', include: undefined },
        expect.anything(),
      );
      expect(result.isError).toBeUndefined();
      const content = JSON.parse((result.content[0] as { text: string }).text);
      expect(content.id).toBe('123');
      expect(content.name).toBe('Test Project');
    });

    it('should include hints when configured and enabled', async () => {
      const getExecutor = vi.fn().mockResolvedValue({ data: mockProject });

      const handler = createResourceHandler({
        resource: 'projects',
        actions: ['list', 'get'],
        formatter: mockFormatter,
        hints: mockHints,
        executors: {
          list: vi.fn(),
          get: getExecutor,
        },
      });

      const result = await handler(
        'get',
        { id: '123' },
        createMockHandlerContext({ includeHints: true }),
      );

      const content = JSON.parse((result.content[0] as { text: string }).text);
      expect(content._hints).toBeDefined();
      expect(content._hints.related_resources).toHaveLength(1);
    });

    it('should not include hints when disabled', async () => {
      const getExecutor = vi.fn().mockResolvedValue({ data: mockProject });

      const handler = createResourceHandler({
        resource: 'projects',
        actions: ['list', 'get'],
        formatter: mockFormatter,
        hints: mockHints,
        executors: {
          list: vi.fn(),
          get: getExecutor,
        },
      });

      const result = await handler(
        'get',
        { id: '123' },
        createMockHandlerContext({ includeHints: false }),
      );

      const content = JSON.parse((result.content[0] as { text: string }).text);
      expect(content._hints).toBeUndefined();
    });
  });

  describe('create action', () => {
    it('should return error when required fields are missing', async () => {
      const handler = createResourceHandler({
        resource: 'tasks',
        actions: ['list', 'create'],
        formatter: mockFormatter,
        create: {
          required: ['title', 'project_id'] as (keyof { title?: string; project_id?: string })[],
          mapOptions: (args) => ({ title: (args as { title?: string }).title }),
        },
        executors: {
          list: vi.fn(),
          create: vi.fn(),
        },
      });

      const result = await handler('create', {}, createMockHandlerContext());

      expect(result.isError).toBe(true);
      expect((result.content[0] as { text: string }).text).toContain('title');
      expect((result.content[0] as { text: string }).text).toContain('project_id');
    });

    it('should call create executor with mapped options', async () => {
      interface TaskArgs {
        id?: string;
        title?: string;
        project_id?: string;
      }
      const createExecutor = vi.fn().mockResolvedValue({ data: mockProject });

      const handler = createResourceHandler<TaskArgs>({
        resource: 'tasks',
        actions: ['list', 'create'],
        formatter: mockFormatter,
        create: {
          required: ['title', 'project_id'],
          mapOptions: (args) => ({ title: args.title, projectId: args.project_id }),
        },
        executors: {
          list: vi.fn(),
          create: createExecutor,
        },
      });

      const result = await handler(
        'create',
        { title: 'New Task', project_id: '456' },
        createMockHandlerContext(),
      );

      expect(createExecutor).toHaveBeenCalledWith(
        { title: 'New Task', projectId: '456' },
        expect.anything(),
      );
      expect(result.isError).toBeUndefined();
      const content = JSON.parse((result.content[0] as { text: string }).text);
      expect(content.success).toBe(true);
    });
  });

  describe('update action', () => {
    it('should return error when id is missing', async () => {
      const handler = createResourceHandler({
        resource: 'tasks',
        actions: ['list', 'update'],
        formatter: mockFormatter,
        update: {
          mapOptions: () => ({}),
        },
        executors: {
          list: vi.fn(),
          update: vi.fn(),
        },
      });

      const result = await handler('update', {}, createMockHandlerContext());

      expect(result.isError).toBe(true);
      expect((result.content[0] as { text: string }).text).toContain('id is required');
    });

    it('should call update executor with id and mapped options', async () => {
      interface TaskArgs {
        id?: string;
        title?: string;
      }
      const updateExecutor = vi.fn().mockResolvedValue({ data: mockProject });

      const handler = createResourceHandler<TaskArgs>({
        resource: 'tasks',
        actions: ['list', 'update'],
        formatter: mockFormatter,
        update: {
          mapOptions: (args) => ({ title: args.title }),
        },
        executors: {
          list: vi.fn(),
          update: updateExecutor,
        },
      });

      const result = await handler(
        'update',
        { id: '123', title: 'Updated' },
        createMockHandlerContext(),
      );

      expect(updateExecutor).toHaveBeenCalledWith(
        { id: '123', title: 'Updated' },
        expect.anything(),
      );
      expect(result.isError).toBeUndefined();
      const content = JSON.parse((result.content[0] as { text: string }).text);
      expect(content.success).toBe(true);
    });
  });

  describe('delete action', () => {
    it('should return error when id is missing', async () => {
      const handler = createResourceHandler({
        resource: 'attachments',
        actions: ['list', 'delete'],
        formatter: mockFormatter,
        executors: {
          list: vi.fn(),
          delete: vi.fn(),
        },
      });

      const result = await handler('delete', {}, createMockHandlerContext());

      expect(result.isError).toBe(true);
      expect((result.content[0] as { text: string }).text).toContain('id is required');
    });

    it('should call delete executor and return success', async () => {
      const deleteExecutor = vi.fn().mockResolvedValue(undefined);

      const handler = createResourceHandler({
        resource: 'attachments',
        actions: ['list', 'delete'],
        formatter: mockFormatter,
        executors: {
          list: vi.fn(),
          delete: deleteExecutor,
        },
      });

      const result = await handler('delete', { id: '123' }, createMockHandlerContext());

      expect(deleteExecutor).toHaveBeenCalledWith({ id: '123' }, expect.anything());
      expect(result.isError).toBeUndefined();
      const content = JSON.parse((result.content[0] as { text: string }).text);
      expect(content.success).toBe(true);
      expect(content.deleted).toBe('123');
    });
  });

  describe('resolve action', () => {
    it('should return error when resolve is not supported', async () => {
      const handler = createResourceHandler({
        resource: 'attachments',
        actions: ['list', 'get'],
        formatter: mockFormatter,
        supportsResolve: false,
        executors: { list: vi.fn(), get: vi.fn() },
      });

      const result = await handler('resolve', { query: 'test' }, createMockHandlerContext());

      expect(result.isError).toBe(true);
      expect((result.content[0] as { text: string }).text).toContain('Invalid action');
    });
  });

  describe('invalid action', () => {
    it('should return error for unknown actions', async () => {
      const handler = createResourceHandler({
        resource: 'projects',
        actions: ['list', 'get'],
        formatter: mockFormatter,
        executors: { list: vi.fn(), get: vi.fn() },
      });

      const result = await handler('unknown', {}, createMockHandlerContext());

      expect(result.isError).toBe(true);
      expect((result.content[0] as { text: string }).text).toContain('Invalid action');
      expect((result.content[0] as { text: string }).text).toContain('list, get');
    });

    it('should return error when action executor is not configured', async () => {
      const handler = createResourceHandler({
        resource: 'projects',
        actions: ['list', 'get', 'create'], // create in actions but no executor
        formatter: mockFormatter,
        executors: { list: vi.fn(), get: vi.fn() },
      });

      const result = await handler('create', {}, createMockHandlerContext());

      expect(result.isError).toBe(true);
      expect((result.content[0] as { text: string }).text).toContain('Invalid action');
    });
  });

  describe('customActions', () => {
    it('should call custom action handler when action matches', async () => {
      interface TimerArgs {
        id?: string;
        service_id?: string;
      }
      const customStartHandler = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify({ success: true, action: 'start' }) }],
      });

      const handler = createResourceHandler<TimerArgs>({
        resource: 'timers',
        actions: ['list', 'get', 'start', 'stop'],
        formatter: mockFormatter,
        customActions: {
          start: customStartHandler,
        },
        executors: {
          list: vi.fn(),
          get: vi.fn(),
        },
      });

      const ctx = createMockHandlerContext();
      const result = await handler('start', { service_id: '456' }, ctx);

      expect(customStartHandler).toHaveBeenCalledWith(
        { service_id: '456' },
        ctx,
        expect.anything(), // ExecutorContext
      );
      expect(result.isError).toBeUndefined();
      const content = JSON.parse((result.content[0] as { text: string }).text);
      expect(content.success).toBe(true);
      expect(content.action).toBe('start');
    });

    it('should still error on unknown actions even with customActions defined', async () => {
      const handler = createResourceHandler({
        resource: 'timers',
        actions: ['list', 'start'],
        formatter: mockFormatter,
        customActions: {
          start: vi.fn(),
        },
        executors: { list: vi.fn() },
      });

      const result = await handler('unknown', {}, createMockHandlerContext());

      expect(result.isError).toBe(true);
      expect((result.content[0] as { text: string }).text).toContain('Invalid action');
    });
  });

  describe('listFilterFromArgs', () => {
    it('should merge filters from args into list call', async () => {
      interface AttachmentArgs {
        id?: string;
        task_id?: string;
        comment_id?: string;
      }
      const listExecutor = vi.fn().mockResolvedValue({ data: [] });

      const handler = createResourceHandler<AttachmentArgs>({
        resource: 'attachments',
        actions: ['list'],
        formatter: mockFormatter,
        listFilterFromArgs: (args) => {
          const filters: Record<string, string> = {};
          if (args.task_id) filters.task_id = args.task_id;
          if (args.comment_id) filters.comment_id = args.comment_id;
          return filters;
        },
        executors: { list: listExecutor },
      });

      await handler(
        'list',
        { task_id: '123', comment_id: '456' },
        createMockHandlerContext({ filter: { existing: 'filter' } }),
      );

      expect(listExecutor).toHaveBeenCalledWith(
        expect.objectContaining({
          additionalFilters: {
            existing: 'filter',
            task_id: '123',
            comment_id: '456',
          },
        }),
        expect.anything(),
      );
    });

    it('should work with empty args', async () => {
      const listExecutor = vi.fn().mockResolvedValue({ data: [] });

      const handler = createResourceHandler({
        resource: 'attachments',
        actions: ['list'],
        formatter: mockFormatter,
        listFilterFromArgs: () => ({}),
        executors: { list: listExecutor },
      });

      await handler('list', {}, createMockHandlerContext({ filter: { foo: 'bar' } }));

      expect(listExecutor).toHaveBeenCalledWith(
        expect.objectContaining({
          additionalFilters: { foo: 'bar' },
        }),
        expect.anything(),
      );
    });
  });

  describe('resolveArgsFromArgs', () => {
    it('should forward extra args to resolve handler', async () => {
      interface TaskArgs {
        id?: string;
        project_id?: string;
      }

      // We can't easily test handleResolve directly, but we can verify the handler
      // is called with supportsResolve and the args extraction works
      const handler = createResourceHandler<TaskArgs>({
        resource: 'tasks',
        actions: ['list', 'resolve'],
        formatter: mockFormatter,
        supportsResolve: true,
        resolveArgsFromArgs: (args) => ({ project_id: args.project_id }),
        executors: { list: vi.fn() },
      });

      // The resolve action will fail because handleResolve needs real context,
      // but we can verify the action doesn't error as "invalid action"
      const result = await handler(
        'resolve',
        { query: 'test', project_id: 'proj-123' },
        createMockHandlerContext(),
      );

      // The error should be from handleResolve (query required or similar), not "invalid action"
      // Since we're testing the factory, we just verify resolve is attempted
      expect(result.isError).toBe(true);
      expect((result.content[0] as { text: string }).text).not.toContain('Invalid action');
    });
  });

  describe('create.validateArgs', () => {
    it('should return error result from validateArgs', async () => {
      interface BookingArgs {
        id?: string;
        person_id?: string;
        service_id?: string;
        event_id?: string;
      }
      const customErrorResult = {
        isError: true as const,
        content: [{ type: 'text' as const, text: 'Custom validation error' }],
      };

      const handler = createResourceHandler<BookingArgs>({
        resource: 'bookings',
        actions: ['list', 'create'],
        formatter: mockFormatter,
        create: {
          required: ['person_id'],
          validateArgs: (args) => {
            if (!args.service_id && !args.event_id) {
              return customErrorResult;
            }
            return undefined;
          },
          mapOptions: (args) => ({ personId: args.person_id }),
        },
        executors: {
          list: vi.fn(),
          create: vi.fn().mockResolvedValue({ data: mockProject }),
        },
      });

      const result = await handler(
        'create',
        { person_id: '123' }, // Missing service_id and event_id
        createMockHandlerContext(),
      );

      expect(result.isError).toBe(true);
      expect((result.content[0] as { text: string }).text).toBe('Custom validation error');
    });

    it('should proceed to create when validateArgs returns undefined', async () => {
      interface BookingArgs {
        id?: string;
        person_id?: string;
        service_id?: string;
      }
      const createExecutor = vi.fn().mockResolvedValue({ data: mockProject });

      const handler = createResourceHandler<BookingArgs>({
        resource: 'bookings',
        actions: ['list', 'create'],
        formatter: mockFormatter,
        create: {
          required: ['person_id'],
          validateArgs: (args) => {
            if (!args.service_id) {
              return undefined; // Valid - don't require service_id
            }
            return undefined;
          },
          mapOptions: (args) => ({ personId: args.person_id, serviceId: args.service_id }),
        },
        executors: {
          list: vi.fn(),
          create: createExecutor,
        },
      });

      const result = await handler(
        'create',
        { person_id: '123', service_id: '456' },
        createMockHandlerContext(),
      );

      expect(createExecutor).toHaveBeenCalled();
      expect(result.isError).toBeUndefined();
    });

    it('should run validateArgs after required fields check', async () => {
      interface TestArgs {
        id?: string;
        required_field?: string;
      }
      const validateArgsCalled = vi.fn();
      const customErrorResult = {
        isError: true as const,
        content: [{ type: 'text' as const, text: 'validateArgs error' }],
      };

      const handler = createResourceHandler<TestArgs>({
        resource: 'test',
        actions: ['list', 'create'],
        formatter: mockFormatter,
        create: {
          required: ['required_field'],
          validateArgs: () => {
            validateArgsCalled();
            return customErrorResult;
          },
          mapOptions: () => ({}),
        },
        executors: {
          list: vi.fn(),
          create: vi.fn(),
        },
      });

      // Without required field, validateArgs should NOT be called
      const result = await handler('create', {}, createMockHandlerContext());

      expect(validateArgsCalled).not.toHaveBeenCalled();
      expect((result.content[0] as { text: string }).text).toContain('required_field');
    });
  });
});
