# @studiometa/productive-api

[![npm version](https://img.shields.io/npm/v/@studiometa/productive-api?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/productive-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat&colorB=3e63dd&colorA=414853)](https://opensource.org/licenses/MIT)

Productive.io API client, TypeScript types, and response formatters. Zero internal dependencies — this is the foundation package for all `@studiometa/productive-*` packages.

## Installation

```bash
npm install @studiometa/productive-api
```

## Usage

### API Client

```typescript
import { ProductiveApi } from '@studiometa/productive-api';

const api = new ProductiveApi({
  config: {
    apiToken: 'your-api-token',
    organizationId: 'your-org-id',
  },
});

const projects = await api.getProjects({ page: 1, perPage: 50 });
console.log(projects.data);
```

### Response Formatters

Transform raw JSON:API responses into clean, flat objects:

```typescript
import { formatListResponse, formatSingleResponse } from '@studiometa/productive-api';

const formatted = formatListResponse(projects.data, projects.meta, {
  compact: true,
  included: projects.included,
});
```

### Configuration

Read credentials from environment variables or a JSON config file:

```typescript
import { getConfig, setConfig } from '@studiometa/productive-api';

// Read from env (PRODUCTIVE_API_TOKEN, PRODUCTIVE_ORG_ID, PRODUCTIVE_USER_ID)
const config = getConfig();

// Or set programmatically
setConfig('apiToken', 'your-token');
```

## Exports

| Export                    | Description                                                        |
| ------------------------- | ------------------------------------------------------------------ |
| `ProductiveApi`           | API client class with methods for all resources                    |
| `ProductiveApiError`      | Typed error class for API failures                                 |
| `getConfig` / `setConfig` | Configuration helpers (env vars + JSON file)                       |
| `format*`                 | Response formatters for each resource type                         |
| Type definitions          | `ProductiveProject`, `ProductiveTimeEntry`, `ProductiveTask`, etc. |

## API Methods

The `ProductiveApi` class provides methods for:

- **Projects** — `getProjects`, `getProject`
- **Time entries** — `getTimeEntries`, `getTimeEntry`, `createTimeEntry`, `updateTimeEntry`, `deleteTimeEntry`
- **Tasks** — `getTasks`, `getTask`, `createTask`, `updateTask`
- **People** — `getPeople`, `getPerson`
- **Services** — `getServices`
- **Companies** — `getCompanies`, `getCompany`, `createCompany`, `updateCompany`
- **Comments** — `getComments`, `getComment`, `createComment`, `updateComment`
- **Timers** — `getTimers`, `getTimer`, `startTimer`, `stopTimer`
- **Deals** — `getDeals`, `getDeal`, `createDeal`, `updateDeal`
- **Bookings** — `getBookings`, `getBooking`, `createBooking`, `updateBooking`
- **Reports** — `getReport` (time, project, budget, person, invoice, payment, service, task, company, deal, timesheet)

## License

MIT © [Studio Meta](https://www.studiometa.fr)
