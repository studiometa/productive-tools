import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { buildPeopleFilters, listPeople } from './list.js';

describe('buildPeopleFilters', () => {
  it('maps typed options to API filter names', () => {
    const filters = buildPeopleFilters({
      companyId: '100',
      projectId: '200',
      role: '300',
      team: 'dev',
    });
    expect(filters).toEqual({
      company_id: '100',
      project_id: '200',
      role_id: '300',
      team: 'dev',
    });
  });

  it('maps person type to numeric value', () => {
    expect(buildPeopleFilters({ personType: 'user' }).person_type).toBe('1');
    expect(buildPeopleFilters({ personType: 'contact' }).person_type).toBe('2');
    expect(buildPeopleFilters({ personType: 'placeholder' }).person_type).toBe('3');
  });

  it('maps status to numeric value', () => {
    expect(buildPeopleFilters({ status: 'active' }).status).toBe('1');
    expect(buildPeopleFilters({ status: 'deactivated' }).status).toBe('2');
    expect(buildPeopleFilters({ status: 'inactive' }).status).toBe('2');
  });

  it('ignores unknown person types', () => {
    const filters = buildPeopleFilters({ personType: 'unknown' });
    expect(filters.person_type).toBeUndefined();
  });

  it('ignores unknown statuses', () => {
    const filters = buildPeopleFilters({ status: 'unknown' });
    expect(filters.status).toBeUndefined();
  });

  it('is case-insensitive for type and status', () => {
    expect(buildPeopleFilters({ personType: 'User' }).person_type).toBe('1');
    expect(buildPeopleFilters({ status: 'Active' }).status).toBe('1');
  });

  it('returns empty filter for empty options', () => {
    expect(buildPeopleFilters({})).toEqual({});
  });

  it('merges additionalFilters', () => {
    const filters = buildPeopleFilters({
      companyId: '100',
      additionalFilters: { custom: 'value' },
    });
    expect(filters.company_id).toBe('100');
    expect(filters.custom).toBe('value');
  });
});

describe('listPeople', () => {
  const mockResponse = {
    data: [{ id: '1', type: 'people', attributes: { first_name: 'John', last_name: 'Doe' } }],
    meta: { current_page: 1, total_pages: 1 },
  };

  it('passes filters, pagination, and sort to API', async () => {
    const getPeople = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getPeople } });

    await listPeople({ companyId: '100', page: 2, perPage: 50, sort: 'name' }, ctx);

    expect(getPeople).toHaveBeenCalledWith({
      page: 2,
      perPage: 50,
      filter: { company_id: '100' },
      sort: 'name',
    });
  });

  it('resolves filter values and returns metadata', async () => {
    const getPeople = vi.fn().mockResolvedValue(mockResponse);
    const resolveFilters = vi.fn().mockResolvedValue({
      resolved: { company_id: '100' },
      metadata: { company_id: { original: 'Acme', resolved: '100', type: 'company' } },
    });
    const ctx = createTestExecutorContext({
      api: { getPeople },
      resolver: { resolveFilters },
    });

    const result = await listPeople({ companyId: 'Acme' }, ctx);

    expect(result.resolved).toBeDefined();
  });

  it('uses default pagination', async () => {
    const getPeople = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getPeople } });

    await listPeople({}, ctx);

    expect(getPeople).toHaveBeenCalledWith(expect.objectContaining({ page: 1, perPage: 100 }));
  });
});
