import { ProductiveApi } from '@studiometa/productive-api';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Productive } from './productive.js';
import { ActivitiesCollection } from './resources/activities.js';
import { AttachmentsCollection } from './resources/attachments.js';
import { BookingsCollection } from './resources/bookings.js';
import { CommentsCollection } from './resources/comments.js';
import { CompaniesCollection } from './resources/companies.js';
import { CustomFieldsCollection } from './resources/custom-fields.js';
import { DealsCollection } from './resources/deals.js';
import { DiscussionsCollection } from './resources/discussions.js';
import { PagesCollection } from './resources/pages.js';
import { PeopleCollection } from './resources/people.js';
import { ProjectsCollection } from './resources/projects.js';
import { ServicesCollection } from './resources/services.js';
import { TasksCollection } from './resources/tasks.js';
import { TimeCollection } from './resources/time.js';
import { TimersCollection } from './resources/timers.js';

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
    expect(p.customFields).toBeInstanceOf(CustomFieldsCollection);
    expect(p.deals).toBeInstanceOf(DealsCollection);
    expect(p.services).toBeInstanceOf(ServicesCollection);
    expect(p.comments).toBeInstanceOf(CommentsCollection);
    expect(p.timers).toBeInstanceOf(TimersCollection);
    expect(p.discussions).toBeInstanceOf(DiscussionsCollection);
    expect(p.bookings).toBeInstanceOf(BookingsCollection);
    expect(p.pages).toBeInstanceOf(PagesCollection);
    expect(p.attachments).toBeInstanceOf(AttachmentsCollection);
    expect(p.activities).toBeInstanceOf(ActivitiesCollection);
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
    expect(typeof p.services.where).toBe('function');
    expect(typeof p.comments.where).toBe('function');
    expect(typeof p.timers.where).toBe('function');
    expect(typeof p.discussions.where).toBe('function');
    expect(typeof p.bookings.where).toBe('function');
    expect(typeof p.pages.where).toBe('function');
    expect(typeof p.attachments.where).toBe('function');
    expect(typeof p.activities.where).toBe('function');
    expect(typeof p.customFields.where).toBe('function');
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

    expect(typeof p.customFields.list).toBe('function');
    expect(typeof p.customFields.get).toBe('function');
    expect(typeof p.customFields.all).toBe('function');
  });
});

describe('Productive.fromEnv', () => {
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    savedEnv.PRODUCTIVE_API_TOKEN = process.env.PRODUCTIVE_API_TOKEN;
    savedEnv.PRODUCTIVE_ORG_ID = process.env.PRODUCTIVE_ORG_ID;
    savedEnv.PRODUCTIVE_USER_ID = process.env.PRODUCTIVE_USER_ID;
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('creates a Productive instance from environment variables', () => {
    process.env.PRODUCTIVE_API_TOKEN = 'from-env-token';
    process.env.PRODUCTIVE_ORG_ID = 'from-env-org';
    process.env.PRODUCTIVE_USER_ID = 'from-env-user';

    const p = Productive.fromEnv();

    expect(p).toBeInstanceOf(Productive);
    expect(p.api).toBeInstanceOf(ProductiveApi);
    expect(p.projects).toBeDefined();
    expect(p.tasks).toBeDefined();
  });

  it('is a static method', () => {
    expect(typeof Productive.fromEnv).toBe('function');
  });
});
