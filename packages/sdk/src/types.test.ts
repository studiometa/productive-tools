import type { IncludedResource } from '@studiometa/productive-api';

import { describe, expect, it } from 'vitest';

import type { Task, Project, TimeEntry, Person, Company, Deal, ResourceRef } from './types.js';

import { resolveListResponse, resolveSingleResponse } from './json-api.js';

describe('Typed resource resolution', () => {
  describe('Task', () => {
    it('resolves a task with typed fields', () => {
      const response = {
        data: {
          id: '10',
          type: 'tasks' as const,
          attributes: {
            title: 'Implement feature',
            description: 'Add typed resources',
            due_date: '2026-03-01',
            closed: false,
            created_at: '2026-01-01',
            updated_at: '2026-01-15',
            tag_list: ['sdk', 'types'],
            initial_estimate: 120,
          },
          relationships: {
            project: { data: { type: 'projects', id: '1' } },
            assignee: { data: { type: 'people', id: '5' } },
            workflow_status: { data: null },
          },
        },
        included: [
          { id: '1', type: 'projects', attributes: { name: 'SDK v2' } },
          { id: '5', type: 'people', attributes: { first_name: 'Jane', last_name: 'Doe' } },
        ] as IncludedResource[],
      };

      const result = resolveSingleResponse<typeof response.data, Task>(response);
      const task = result.data;

      expect(task.id).toBe('10');
      expect(task.type).toBe('tasks');
      expect(task.title).toBe('Implement feature');
      expect(task.description).toBe('Add typed resources');
      expect(task.due_date).toBe('2026-03-01');
      expect(task.closed).toBe(false);
      expect(task.tag_list).toEqual(['sdk', 'types']);
      expect(task.initial_estimate).toBe(120);
      expect(task.project).toEqual({ id: '1', type: 'projects', name: 'SDK v2' });
      expect(task.assignee).toEqual({
        id: '5',
        type: 'people',
        first_name: 'Jane',
        last_name: 'Doe',
      });
      expect(task.workflow_status).toBeNull();
    });

    it('resolves a list of tasks', () => {
      const response = {
        data: [
          {
            id: '1',
            type: 'tasks' as const,
            attributes: { title: 'Task A', created_at: '2026-01-01', updated_at: '2026-01-01' },
            relationships: {},
          },
          {
            id: '2',
            type: 'tasks' as const,
            attributes: { title: 'Task B', created_at: '2026-01-02', updated_at: '2026-01-02' },
            relationships: {},
          },
        ],
        meta: { total: 2, total_pages: 1 },
      };

      const result = resolveListResponse<(typeof response.data)[0], Task>(response);

      expect(result.data).toHaveLength(2);
      expect(result.data[0].title).toBe('Task A');
      expect(result.data[1].title).toBe('Task B');
      expect(result.meta?.total).toBe(2);
    });
  });

  describe('Project', () => {
    it('resolves a project with typed fields', () => {
      const response = {
        data: {
          id: '1',
          type: 'projects' as const,
          attributes: {
            name: 'My Project',
            project_number: 'P-001',
            archived: false,
            budget: 50000,
            created_at: '2026-01-01',
            updated_at: '2026-01-15',
          },
        },
      };

      const result = resolveSingleResponse<typeof response.data, Project>(response);
      const project = result.data;

      expect(project.id).toBe('1');
      expect(project.type).toBe('projects');
      expect(project.name).toBe('My Project');
      expect(project.project_number).toBe('P-001');
      expect(project.archived).toBe(false);
      expect(project.budget).toBe(50000);
    });
  });

  describe('TimeEntry', () => {
    it('resolves a time entry with relationships', () => {
      const response = {
        data: {
          id: '100',
          type: 'time_entries' as const,
          attributes: {
            date: '2026-02-20',
            time: 480,
            note: 'Worked on SDK',
            approved: true,
            created_at: '2026-02-20',
            updated_at: '2026-02-20',
          },
          relationships: {
            person: { data: { type: 'people', id: '5' } },
            service: { data: { type: 'services', id: '20' } },
            project: { data: { type: 'projects', id: '1' } },
          },
        },
        included: [
          { id: '5', type: 'people', attributes: { first_name: 'Jane' } },
          { id: '20', type: 'services', attributes: { name: 'Development' } },
          { id: '1', type: 'projects', attributes: { name: 'SDK v2' } },
        ] as IncludedResource[],
      };

      const result = resolveSingleResponse<typeof response.data, TimeEntry>(response);
      const entry = result.data;

      expect(entry.id).toBe('100');
      expect(entry.type).toBe('time_entries');
      expect(entry.date).toBe('2026-02-20');
      expect(entry.time).toBe(480);
      expect(entry.note).toBe('Worked on SDK');
      expect(entry.approved).toBe(true);
      expect(entry.person).toEqual({ id: '5', type: 'people', first_name: 'Jane' });
      expect(entry.service).toEqual({ id: '20', type: 'services', name: 'Development' });
      expect(entry.project).toEqual({ id: '1', type: 'projects', name: 'SDK v2' });
    });
  });

  describe('Person', () => {
    it('resolves a person with typed fields', () => {
      const response = {
        data: {
          id: '5',
          type: 'people' as const,
          attributes: {
            first_name: 'Jane',
            last_name: 'Doe',
            email: 'jane@example.com',
            active: true,
            title: 'Developer',
            created_at: '2025-01-01',
            updated_at: '2026-01-01',
          },
        },
      };

      const result = resolveSingleResponse<typeof response.data, Person>(response);
      const person = result.data;

      expect(person.id).toBe('5');
      expect(person.type).toBe('people');
      expect(person.first_name).toBe('Jane');
      expect(person.last_name).toBe('Doe');
      expect(person.email).toBe('jane@example.com');
      expect(person.active).toBe(true);
      expect(person.title).toBe('Developer');
    });
  });

  describe('Company', () => {
    it('resolves a company with typed fields', () => {
      const response = {
        data: {
          id: '3',
          type: 'companies' as const,
          attributes: {
            name: 'Acme Corp',
            billing_name: 'Acme Corporation Inc.',
            vat: 'FR12345678',
            default_currency: 'EUR',
            domain: 'acme.com',
            due_days: 30,
            tag_list: ['client', 'premium'],
            created_at: '2024-01-01',
            updated_at: '2026-01-01',
          },
        },
      };

      const result = resolveSingleResponse<typeof response.data, Company>(response);
      const company = result.data;

      expect(company.id).toBe('3');
      expect(company.type).toBe('companies');
      expect(company.name).toBe('Acme Corp');
      expect(company.billing_name).toBe('Acme Corporation Inc.');
      expect(company.vat).toBe('FR12345678');
      expect(company.default_currency).toBe('EUR');
      expect(company.domain).toBe('acme.com');
      expect(company.due_days).toBe(30);
      expect(company.tag_list).toEqual(['client', 'premium']);
    });
  });

  describe('Deal', () => {
    it('resolves a deal with relationships', () => {
      const response = {
        data: {
          id: '50',
          type: 'deals' as const,
          attributes: {
            name: 'Big Contract',
            date: '2026-01-01',
            end_date: '2026-12-31',
            budget: true,
            profit_margin: 25.5,
            created_at: '2026-01-01',
            updated_at: '2026-02-01',
          },
          relationships: {
            company: { data: { type: 'companies', id: '3' } },
            responsible: { data: { type: 'people', id: '5' } },
            deal_status: { data: null },
            project: { data: { type: 'projects', id: '1' } },
          },
        },
        included: [
          { id: '3', type: 'companies', attributes: { name: 'Acme Corp' } },
          { id: '5', type: 'people', attributes: { first_name: 'Jane' } },
          { id: '1', type: 'projects', attributes: { name: 'SDK v2' } },
        ] as IncludedResource[],
      };

      const result = resolveSingleResponse<typeof response.data, Deal>(response);
      const deal = result.data;

      expect(deal.id).toBe('50');
      expect(deal.type).toBe('deals');
      expect(deal.name).toBe('Big Contract');
      expect(deal.date).toBe('2026-01-01');
      expect(deal.end_date).toBe('2026-12-31');
      expect(deal.budget).toBe(true);
      expect(deal.profit_margin).toBe(25.5);
      expect(deal.company).toEqual({ id: '3', type: 'companies', name: 'Acme Corp' });
      expect(deal.responsible).toEqual({ id: '5', type: 'people', first_name: 'Jane' });
      expect(deal.deal_status).toBeNull();
      expect(deal.project).toEqual({ id: '1', type: 'projects', name: 'SDK v2' });
    });
  });

  describe('ResourceRef', () => {
    it('relationships are ResourceRef objects', () => {
      const response = {
        data: {
          id: '10',
          type: 'tasks' as const,
          attributes: { title: 'Test', created_at: '2026-01-01', updated_at: '2026-01-01' },
          relationships: {
            project: { data: { type: 'projects', id: '1' } },
          },
        },
        included: [
          { id: '1', type: 'projects', attributes: { name: 'Project X' } },
        ] as IncludedResource[],
      };

      const result = resolveSingleResponse<typeof response.data, Task>(response);
      const ref: ResourceRef | null | undefined = result.data.project;

      expect(ref).not.toBeNull();
      expect(ref!.id).toBe('1');
      expect(ref!.type).toBe('projects');
    });
  });

  describe('Backwards compatibility', () => {
    it('resolveListResponse without R parameter returns ResolvedResource', () => {
      const response = {
        data: [
          {
            id: '1',
            type: 'tasks',
            attributes: { title: 'Legacy' },
          },
        ],
        meta: { total: 1 },
      };

      // No second type param — defaults to ResolvedResource
      const result = resolveListResponse(response);
      expect(result.data[0].title).toBe('Legacy');
      expect(result.data[0].id).toBe('1');
    });

    it('resolveSingleResponse without R parameter returns ResolvedResource', () => {
      const response = {
        data: {
          id: '1',
          type: 'tasks',
          attributes: { title: 'Legacy' },
        },
      };

      const result = resolveSingleResponse(response);
      expect(result.data.title).toBe('Legacy');
    });
  });
});
