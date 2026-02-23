import { ProductiveApi } from '@studiometa/productive-api';

import { CompaniesCollection } from './resources/companies.js';
import { DealsCollection } from './resources/deals.js';
import { PeopleCollection } from './resources/people.js';
import { ProjectsCollection } from './resources/projects.js';
import { TasksCollection } from './resources/tasks.js';
import { TimeCollection } from './resources/time.js';

export interface ProductiveOptions {
  token: string;
  organizationId: string;
  /** Optional user ID for people.me() support */
  userId?: string;
}

export class Productive {
  /** @internal */
  readonly api: ProductiveApi;

  readonly projects: ProjectsCollection;
  readonly tasks: TasksCollection;
  readonly time: TimeCollection;
  readonly people: PeopleCollection;
  readonly companies: CompaniesCollection;
  readonly deals: DealsCollection;

  constructor(options: ProductiveOptions) {
    this.api = new ProductiveApi({
      config: {
        apiToken: options.token,
        organizationId: options.organizationId,
        userId: options.userId,
      },
      useCache: false, // SDK users manage their own caching
    });

    this.projects = new ProjectsCollection(this.api);
    this.tasks = new TasksCollection(this.api);
    this.time = new TimeCollection(this.api);
    this.people = new PeopleCollection(this.api, options.userId);
    this.companies = new CompaniesCollection(this.api);
    this.deals = new DealsCollection(this.api);
  }
}
