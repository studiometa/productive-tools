import { ProductiveApi } from '@studiometa/productive-api';
import { describe, expect, it } from 'vitest';

import { Productive } from './productive.js';
import { CompaniesCollection } from './resources/companies.js';
import { DealsCollection } from './resources/deals.js';
import { PeopleCollection } from './resources/people.js';
import { ProjectsCollection } from './resources/projects.js';
import { TasksCollection } from './resources/tasks.js';
import { TimeCollection } from './resources/time.js';

const validOptions = {
  token: 'test-token',
  organizationId: 'test-org',
};

describe('Productive constructor', () => {
  it('creates an API instance', () => {
    const p = new Productive(validOptions);
    expect(p.api).toBeInstanceOf(ProductiveApi);
  });

  it('initializes all collections', () => {
    const p = new Productive(validOptions);
    expect(p.projects).toBeInstanceOf(ProjectsCollection);
    expect(p.tasks).toBeInstanceOf(TasksCollection);
    expect(p.time).toBeInstanceOf(TimeCollection);
    expect(p.people).toBeInstanceOf(PeopleCollection);
    expect(p.companies).toBeInstanceOf(CompaniesCollection);
    expect(p.deals).toBeInstanceOf(DealsCollection);
  });

  it('accepts optional userId', () => {
    const p = new Productive({ ...validOptions, userId: 'user-123' });
    expect(p.api).toBeInstanceOf(ProductiveApi);
  });

  it('collections have where method', () => {
    const p = new Productive(validOptions);
    expect(typeof p.projects.where).toBe('function');
    expect(typeof p.tasks.where).toBe('function');
    expect(typeof p.time.where).toBe('function');
    expect(typeof p.people.where).toBe('function');
    expect(typeof p.companies.where).toBe('function');
    expect(typeof p.deals.where).toBe('function');
  });

  it('collections have expected methods', () => {
    const p = new Productive(validOptions);

    expect(typeof p.projects.list).toBe('function');
    expect(typeof p.projects.get).toBe('function');
    expect(typeof p.projects.all).toBe('function');

    expect(typeof p.tasks.list).toBe('function');
    expect(typeof p.tasks.get).toBe('function');
    expect(typeof p.tasks.create).toBe('function');
    expect(typeof p.tasks.update).toBe('function');
    expect(typeof p.tasks.all).toBe('function');

    expect(typeof p.time.list).toBe('function');
    expect(typeof p.time.get).toBe('function');
    expect(typeof p.time.create).toBe('function');
    expect(typeof p.time.update).toBe('function');
    expect(typeof p.time.delete).toBe('function');
    expect(typeof p.time.all).toBe('function');

    expect(typeof p.people.list).toBe('function');
    expect(typeof p.people.get).toBe('function');
    expect(typeof p.people.me).toBe('function');
    expect(typeof p.people.all).toBe('function');

    expect(typeof p.companies.list).toBe('function');
    expect(typeof p.companies.get).toBe('function');
    expect(typeof p.companies.create).toBe('function');
    expect(typeof p.companies.update).toBe('function');
    expect(typeof p.companies.all).toBe('function');

    expect(typeof p.deals.list).toBe('function');
    expect(typeof p.deals.get).toBe('function');
    expect(typeof p.deals.create).toBe('function');
    expect(typeof p.deals.update).toBe('function');
    expect(typeof p.deals.all).toBe('function');
  });
});
