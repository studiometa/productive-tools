import { describe, it, expect } from 'vitest';

import type { JsonApiResource, JsonApiMeta } from './formatters.js';

import {
  formatTimeEntry,
  formatProject,
  formatTask,
  formatPerson,
  formatService,
  formatCompany,
  formatPage,
  formatDiscussion,
  formatAttachment,
  formatListResponse,
} from './formatters.js';

describe('formatters', () => {
  describe('formatTimeEntry', () => {
    it('should format a time entry', () => {
      const entry: JsonApiResource = {
        id: '123',
        type: 'time_entries',
        attributes: {
          date: '2024-01-15',
          time: 480,
          note: 'Development work',
        },
        relationships: {
          person: { data: { id: '456', type: 'people' } },
          service: { data: { id: '789', type: 'services' } },
        },
      };

      const result = formatTimeEntry(entry);

      expect(result).toHaveProperty('id', '123');
      expect(result).toHaveProperty('date', '2024-01-15');
      expect(result).toHaveProperty('time_minutes', 480);
      expect(result).toHaveProperty('time_hours', '8.00');
      expect(result).toHaveProperty('note', 'Development work');
    });

    it('should handle entry without relationships', () => {
      const entry: JsonApiResource = {
        id: '123',
        type: 'time_entries',
        attributes: {
          date: '2024-01-15',
          time: 120,
        },
      };

      const result = formatTimeEntry(entry);

      expect(result).toHaveProperty('id', '123');
      expect(result).toHaveProperty('time_minutes', 120);
      expect(result).toHaveProperty('time_hours', '2.00');
    });
  });

  describe('formatProject', () => {
    it('should format a project', () => {
      const project: JsonApiResource = {
        id: '456',
        type: 'projects',
        attributes: {
          name: 'Test Project',
          project_number: 'PRJ-001',
          budget_total: 50000,
        },
      };

      const result = formatProject(project);

      expect(result).toHaveProperty('id', '456');
      expect(result).toHaveProperty('name', 'Test Project');
      expect(result).toHaveProperty('number', 'PRJ-001');
    });

    it('should handle project with minimal attributes', () => {
      const project: JsonApiResource = {
        id: '456',
        type: 'projects',
        attributes: {
          name: 'Minimal Project',
        },
      };

      const result = formatProject(project);

      expect(result).toHaveProperty('id', '456');
      expect(result).toHaveProperty('name', 'Minimal Project');
    });
  });

  describe('formatTask', () => {
    it('should format a task', () => {
      const task: JsonApiResource = {
        id: '789',
        type: 'tasks',
        attributes: {
          title: 'Test Task',
          number: 42,
          status: 1,
        },
        relationships: {
          project: { data: { id: '456', type: 'projects' } },
        },
      };

      const result = formatTask(task);

      expect(result).toHaveProperty('id', '789');
      expect(result).toHaveProperty('title', 'Test Task');
      expect(result).toHaveProperty('number', 42);
    });

    it('should format a task with included resources', () => {
      const task: JsonApiResource = {
        id: '789',
        type: 'tasks',
        attributes: {
          title: 'Test Task',
        },
        relationships: {
          project: { data: { id: '456', type: 'projects' } },
        },
      };

      const included: JsonApiResource[] = [
        {
          id: '456',
          type: 'projects',
          attributes: { name: 'Test Project' },
        },
      ];

      const result = formatTask(task, included);

      expect(result).toHaveProperty('id', '789');
      expect(result).toHaveProperty('title', 'Test Task');
    });
  });

  describe('formatPerson', () => {
    it('should format a person', () => {
      const person: JsonApiResource = {
        id: '111',
        type: 'people',
        attributes: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
      };

      const result = formatPerson(person);

      expect(result).toHaveProperty('id', '111');
      expect(result).toHaveProperty('first_name', 'John');
      expect(result).toHaveProperty('last_name', 'Doe');
      expect(result).toHaveProperty('email', 'john@example.com');
    });
  });

  describe('formatService', () => {
    it('should format a service', () => {
      const service: JsonApiResource = {
        id: '222',
        type: 'services',
        attributes: {
          name: 'Development',
          pricing_type: 'hourly',
          price: 100,
        },
      };

      const result = formatService(service);

      expect(result).toHaveProperty('id', '222');
      expect(result).toHaveProperty('name', 'Development');
    });
  });

  describe('formatListResponse', () => {
    it('should format a list of resources', () => {
      const data: JsonApiResource[] = [
        {
          id: '1',
          type: 'projects',
          attributes: { name: 'Project 1' },
        },
        {
          id: '2',
          type: 'projects',
          attributes: { name: 'Project 2' },
        },
      ];

      const result = formatListResponse(data, formatProject);

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty('name', 'Project 1');
      expect(result.data[1]).toHaveProperty('name', 'Project 2');
    });

    it('should include pagination meta', () => {
      const data: JsonApiResource[] = [
        {
          id: '1',
          type: 'projects',
          attributes: { name: 'Project 1' },
        },
      ];

      const meta: JsonApiMeta = {
        current_page: 1,
        total_pages: 5,
        total_count: 50,
        page_size: 10,
      };

      const result = formatListResponse(data, formatProject, meta);

      expect(result.meta).toBeDefined();
      expect(result.meta).toHaveProperty('page', 1);
      expect(result.meta).toHaveProperty('total_pages', 5);
      expect(result.meta).toHaveProperty('total_count', 50);
    });

    it('should handle empty list', () => {
      const result = formatListResponse([], formatProject);

      expect(result.data).toHaveLength(0);
    });

    it('should pass included resources to formatter', () => {
      const data: JsonApiResource[] = [
        {
          id: '789',
          type: 'tasks',
          attributes: { title: 'Task 1' },
          relationships: {
            project: { data: { id: '456', type: 'projects' } },
          },
        },
      ];

      const included: JsonApiResource[] = [
        {
          id: '456',
          type: 'projects',
          attributes: { name: 'Test Project' },
        },
      ];

      const result = formatListResponse(data, formatTask, undefined, included);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toHaveProperty('title', 'Task 1');
    });
  });
});

describe('formatters thread included relationships through to the API resolver', () => {
  it('formatProject inlines the company relationship (issue #174)', () => {
    const project: JsonApiResource = {
      id: '1',
      type: 'projects',
      attributes: { name: 'Alpha' },
      relationships: { company: { data: { id: '99', type: 'companies' } } },
    };
    const result = formatProject(project, {
      included: [{ id: '99', type: 'companies', attributes: { name: 'Acme Inc.' } }],
    });
    expect(result.company).toMatchObject({ id: '99', type: 'companies', name: 'Acme Inc.' });
  });

  it('formatPerson inlines the company relationship', () => {
    const person: JsonApiResource = {
      id: '1',
      type: 'people',
      attributes: { first_name: 'Jane', last_name: 'Doe' },
      relationships: { company: { data: { id: '99', type: 'companies' } } },
    };
    const result = formatPerson(person, {
      included: [{ id: '99', type: 'companies', attributes: { name: 'Acme Inc.' } }],
    });
    expect(result.company).toMatchObject({ id: '99', name: 'Acme Inc.' });
  });

  it('formatService inlines the deal relationship', () => {
    const service: JsonApiResource = {
      id: '1',
      type: 'services',
      attributes: { name: 'Dev' },
      relationships: { deal: { data: { id: '4', type: 'deals' } } },
    };
    const result = formatService(service, {
      included: [{ id: '4', type: 'deals', attributes: { name: 'Big Deal' } }],
    });
    expect(result.deal).toMatchObject({ id: '4', name: 'Big Deal' });
  });

  it('formatTimeEntry inlines the service relationship', () => {
    const entry: JsonApiResource = {
      id: '1',
      type: 'time_entries',
      attributes: { date: '2026-01-01', time: 60 },
      relationships: { service: { data: { id: '5', type: 'services' } } },
    };
    const result = formatTimeEntry(entry, {
      included: [{ id: '5', type: 'services', attributes: { name: 'Dev' } }],
    });
    expect(result.service).toMatchObject({ id: '5', name: 'Dev' });
  });

  it('formatCompany inlines the contacts relationship', () => {
    const company: JsonApiResource = {
      id: '1',
      type: 'companies',
      attributes: { name: 'Acme' },
      relationships: { contacts: { data: [{ id: '7', type: 'contact_entries' }] } } as never,
    };
    const result = formatCompany(company, {
      included: [{ id: '7', type: 'contact_entries', attributes: { email: 'a@b.com' } }],
    });
    expect(result.contacts).toEqual([{ id: '7', type: 'contact_entries', email: 'a@b.com' }]);
  });

  it('formatPage inlines the creator relationship', () => {
    const page: JsonApiResource = {
      id: '1',
      type: 'pages',
      attributes: { title: 'Doc' },
      relationships: { creator: { data: { id: '20', type: 'people' } } },
    };
    const result = formatPage(page, {
      included: [
        { id: '20', type: 'people', attributes: { first_name: 'Jane', last_name: 'Doe' } },
      ],
    });
    expect(result.creator).toMatchObject({ id: '20', first_name: 'Jane' });
  });

  it('formatDiscussion inlines the page relationship', () => {
    const discussion: JsonApiResource = {
      id: '1',
      type: 'discussions',
      attributes: { title: 'D', status: 1 },
      relationships: { page: { data: { id: '10', type: 'pages' } } },
    };
    const result = formatDiscussion(discussion, {
      included: [{ id: '10', type: 'pages', attributes: { title: 'Parent Page' } }],
    });
    expect(result.page).toMatchObject({ id: '10', title: 'Parent Page' });
  });

  it('formatAttachment inlines the attachable relationship', () => {
    const attachment: JsonApiResource = {
      id: '1',
      type: 'attachments',
      attributes: { name: 'f.pdf', size: 1, content_type: 'application/pdf', url: 'http://x' },
      relationships: { attachable: { data: { id: '77', type: 'tasks' } } },
    };
    const result = formatAttachment(attachment, {
      included: [{ id: '77', type: 'tasks', attributes: { title: 'My Task' } }],
    });
    expect(result.attachable).toMatchObject({ id: '77', title: 'My Task' });
  });
});
