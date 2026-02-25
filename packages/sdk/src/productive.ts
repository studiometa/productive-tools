import { ProductiveApi } from '@studiometa/productive-api';

import { loadConfig } from './config.js';
import { ActivitiesCollection } from './resources/activities.js';
import { AttachmentsCollection } from './resources/attachments.js';
import { BookingsCollection } from './resources/bookings.js';
import { CommentsCollection } from './resources/comments.js';
import { CompaniesCollection } from './resources/companies.js';
import { DealsCollection } from './resources/deals.js';
import { DiscussionsCollection } from './resources/discussions.js';
import { PagesCollection } from './resources/pages.js';
import { PeopleCollection } from './resources/people.js';
import { ProjectsCollection } from './resources/projects.js';
import { ServicesCollection } from './resources/services.js';
import { TasksCollection } from './resources/tasks.js';
import { TimeCollection } from './resources/time.js';
import { TimersCollection } from './resources/timers.js';

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
  readonly services: ServicesCollection;
  readonly comments: CommentsCollection;
  readonly timers: TimersCollection;
  readonly discussions: DiscussionsCollection;
  readonly bookings: BookingsCollection;
  readonly pages: PagesCollection;
  readonly attachments: AttachmentsCollection;
  readonly activities: ActivitiesCollection;

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
    this.services = new ServicesCollection(this.api);
    this.comments = new CommentsCollection(this.api);
    this.timers = new TimersCollection(this.api);
    this.discussions = new DiscussionsCollection(this.api);
    this.bookings = new BookingsCollection(this.api);
    this.pages = new PagesCollection(this.api);
    this.attachments = new AttachmentsCollection(this.api);
    this.activities = new ActivitiesCollection(this.api);
  }

  /**
   * Create a Productive instance using credentials from environment,
   * keychain, and config file — zero configuration needed.
   *
   * @throws {ConfigurationError} When required credentials are missing
   *
   * @example
   * ```ts
   * import { Productive } from '@studiometa/productive-sdk';
   *
   * const p = Productive.fromEnv();
   * const { data: projects } = await p.projects.list();
   * ```
   */
  static fromEnv(): Productive {
    return new Productive(loadConfig());
  }
}
