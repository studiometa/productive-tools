import { DEFAULT_PAGE_SIZE } from '@studiometa/productive-api';
import { describe, expect, it } from 'vitest';

import { buildListParams } from './types.js';

describe('buildListParams', () => {
  it('applies the page/perPage defaults when they are omitted', () => {
    expect(buildListParams({})).toEqual({
      page: 1,
      perPage: DEFAULT_PAGE_SIZE,
      sort: undefined,
      include: undefined,
    });
  });

  it('forwards positive pagination, sort and include values unchanged', () => {
    expect(buildListParams({ page: 3, perPage: 50, sort: 'name', include: ['company'] })).toEqual({
      page: 3,
      perPage: 50,
      sort: 'name',
      include: ['company'],
    });
  });

  it('coerces a non-positive page/perPage to the defaults', () => {
    expect(buildListParams({ page: 0, perPage: 0 })).toMatchObject({
      page: 1,
      perPage: DEFAULT_PAGE_SIZE,
    });
    expect(buildListParams({ page: -1, perPage: -5 })).toMatchObject({
      page: 1,
      perPage: DEFAULT_PAGE_SIZE,
    });
  });
});
