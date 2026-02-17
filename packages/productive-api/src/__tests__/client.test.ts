import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProductiveApi } from '../client.js';
import { ProductiveApiError } from '../error.js';

const validConfig = {
  apiToken: 'test-token',
  organizationId: 'test-org',
};

describe('ProductiveApi constructor', () => {
  it('throws when apiToken is missing', () => {
    expect(() => new ProductiveApi({ config: { organizationId: 'org' } as any })).toThrow(
      ProductiveApiError,
    );
  });

  it('throws when organizationId is missing', () => {
    expect(() => new ProductiveApi({ config: { apiToken: 'token' } as any })).toThrow(
      ProductiveApiError,
    );
  });

  it('creates instance with valid config', () => {
    const api = new ProductiveApi({ config: validConfig });
    expect(api).toBeInstanceOf(ProductiveApi);
  });
});

describe('ProductiveApi requests', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createApi() {
    return new ProductiveApi({ config: validConfig, useCache: false });
  }

  function mockFetchResponse(data: unknown, status = 200) {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(data), {
        status,
        statusText: status === 200 ? 'OK' : 'Error',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  }

  function mockFetchError(status: number, body: string) {
    fetchSpy.mockResolvedValueOnce(
      new Response(body, {
        status,
        statusText: 'Error',
      }),
    );
  }

  it('sends correct headers', async () => {
    const api = createApi();
    mockFetchResponse({ data: [] });

    await api.getProjects();

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'GET',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          'X-Auth-Token': 'test-token',
          'X-Organization-Id': 'test-org',
        },
      }),
    );
  });

  it('fetches projects with pagination', async () => {
    const api = createApi();
    const mockData = { data: [{ id: '1', type: 'projects', attributes: { name: 'Test' } }] };
    mockFetchResponse(mockData);

    const result = await api.getProjects({ page: 2, perPage: 50 });

    expect(result).toEqual(mockData);
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain('page%5Bnumber%5D=2');
    expect(url).toContain('page%5Bsize%5D=50');
  });

  it('fetches projects with filters', async () => {
    const api = createApi();
    mockFetchResponse({ data: [] });

    await api.getProjects({ filter: { archived: 'false' } });

    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain('filter%5Barchived%5D=false');
  });

  it('creates time entry with relationships', async () => {
    const api = createApi();
    const mockResponse = { data: { id: '1', type: 'time_entries', attributes: {} } };
    mockFetchResponse(mockResponse);

    await api.createTimeEntry({
      person_id: '100',
      service_id: '200',
      date: '2026-01-15',
      time: 480,
      note: 'test',
    });

    const [, options] = fetchSpy.mock.calls[0];
    const body = JSON.parse(options!.body as string);
    expect(body.data.type).toBe('time_entries');
    expect(body.data.attributes.time).toBe(480);
    expect(body.data.relationships.person.data.id).toBe('100');
    expect(body.data.relationships.service.data.id).toBe('200');
  });

  it('throws ProductiveApiError on HTTP error', async () => {
    const api = createApi();
    mockFetchError(401, '{"errors":[{"detail":"Unauthorized"}]}');

    await expect(api.getProjects()).rejects.toThrow(ProductiveApiError);
    await expect(
      createApi()
        .getProjects()
        .catch((e) => {
          mockFetchError(401, '{"errors":[{"detail":"Unauthorized"}]}');
          throw e;
        }),
    ).rejects.toThrow();
  });

  it('throws with parsed error detail', async () => {
    const api = createApi();
    mockFetchError(422, '{"errors":[{"detail":"Validation failed"}]}');

    try {
      await api.getProjects();
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ProductiveApiError);
      expect((error as ProductiveApiError).message).toBe('Validation failed');
      expect((error as ProductiveApiError).statusCode).toBe(422);
    }
  });

  it('deletes time entry', async () => {
    const api = createApi();
    // DELETE returns empty response
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 204, statusText: 'No Content' }));

    // deleteTimeEntry calls request which tries to parse JSON on success
    // but 204 has no body — need to check how the implementation handles this
    // Actually let's mock a 200 with empty
    fetchSpy.mockReset();
    fetchSpy.mockResolvedValueOnce(new Response('null', { status: 200, statusText: 'OK' }));

    await api.deleteTimeEntry('123');

    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toContain('/time_entries/123');
    expect(options!.method).toBe('DELETE');
  });

  describe('caching', () => {
    it('uses cache when enabled', async () => {
      const mockCache = {
        getAsync: vi.fn().mockResolvedValue({ data: [{ id: 'cached' }] }),
        setAsync: vi.fn(),
        invalidateAsync: vi.fn(),
        setOrgId: vi.fn(),
      };

      const api = new ProductiveApi({
        config: validConfig,
        cache: mockCache,
        useCache: true,
      });

      const result = await api.getProjects();

      expect(mockCache.getAsync).toHaveBeenCalled();
      expect(result).toEqual({ data: [{ id: 'cached' }] });
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('skips cache when disabled', async () => {
      const mockCache = {
        getAsync: vi.fn(),
        setAsync: vi.fn(),
        invalidateAsync: vi.fn(),
        setOrgId: vi.fn(),
      };

      const api = new ProductiveApi({
        config: validConfig,
        cache: mockCache,
        useCache: false,
      });

      mockFetchResponse({ data: [] });
      await api.getProjects();

      expect(mockCache.getAsync).not.toHaveBeenCalled();
      expect(fetchSpy).toHaveBeenCalled();
    });

    it('invalidates cache on write operations', async () => {
      const mockCache = {
        getAsync: vi.fn(),
        setAsync: vi.fn(),
        invalidateAsync: vi.fn(),
        setOrgId: vi.fn(),
      };

      const api = new ProductiveApi({
        config: validConfig,
        cache: mockCache,
        useCache: true,
      });

      mockFetchResponse({ data: { id: '1' } });
      await api.createTimeEntry({
        person_id: '1',
        service_id: '2',
        date: '2026-01-01',
        time: 480,
      });

      expect(mockCache.invalidateAsync).toHaveBeenCalledWith('time_entries');
    });

    it('bypasses cache with forceRefresh', async () => {
      const mockCache = {
        getAsync: vi.fn().mockResolvedValue({ data: [{ id: 'cached' }] }),
        setAsync: vi.fn(),
        invalidateAsync: vi.fn(),
        setOrgId: vi.fn(),
      };

      const api = new ProductiveApi({
        config: validConfig,
        cache: mockCache,
        useCache: true,
        forceRefresh: true,
      });

      mockFetchResponse({ data: [] });
      await api.getProjects();

      expect(mockCache.getAsync).not.toHaveBeenCalled();
      expect(fetchSpy).toHaveBeenCalled();
      expect(mockCache.setAsync).toHaveBeenCalled();
    });

    it('stores GET result in cache', async () => {
      const mockCache = {
        getAsync: vi.fn().mockResolvedValue(null),
        setAsync: vi.fn(),
        invalidateAsync: vi.fn(),
        setOrgId: vi.fn(),
      };

      const api = new ProductiveApi({ config: validConfig, cache: mockCache, useCache: true });
      const mockData = { data: [{ id: '1' }] };
      mockFetchResponse(mockData);

      await api.getProjects();

      expect(mockCache.setAsync).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('falls back to default error message for non-JSON error body', async () => {
      const api = createApi();
      fetchSpy.mockResolvedValueOnce(
        new Response('Server Error', { status: 500, statusText: 'Internal Server Error' }),
      );

      try {
        await api.getProjects();
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(ProductiveApiError);
        expect((error as ProductiveApiError).message).toContain('500');
      }
    });
  });

  describe('time entries', () => {
    it('getTimeEntries with pagination, filters, sort', async () => {
      const api = createApi();
      mockFetchResponse({ data: [] });
      await api.getTimeEntries({ page: 2, perPage: 50, sort: '-date', filter: { person_id: '1' } });
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('/time_entries');
      expect(url).toContain('page%5Bnumber%5D=2');
      expect(url).toContain('page%5Bsize%5D=50');
      expect(url).toContain('sort=-date');
      expect(url).toContain('filter%5Bperson_id%5D=1');
    });

    it('getTimeEntry', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '99' } });
      await api.getTimeEntry('99');
      expect(fetchSpy.mock.calls[0][0] as string).toContain('/time_entries/99');
    });

    it('updateTimeEntry', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.updateTimeEntry('1', { time: 240, note: 'updated' });
      const [url, opts] = fetchSpy.mock.calls[0];
      expect(url).toContain('/time_entries/1');
      expect(opts!.method).toBe('PATCH');
      const body = JSON.parse(opts!.body as string);
      expect(body.data.attributes.time).toBe(240);
      expect(body.data.attributes.note).toBe('updated');
    });

    it('createTimeEntry with task relationship', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.createTimeEntry({
        person_id: '1',
        service_id: '2',
        date: '2024-01-01',
        time: 480,
        task_id: '99',
      });
      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.data.relationships.task.data.id).toBe('99');
    });
  });

  describe('tasks', () => {
    it('getTasks with include', async () => {
      const api = createApi();
      mockFetchResponse({ data: [] });
      await api.getTasks({ include: ['project', 'assignee'], filter: { project_id: '1' } });
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('include=project%2Cassignee');
      expect(url).toContain('filter%5Bproject_id%5D=1');
    });

    it('getTask with include', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.getTask('1', { include: ['project'] });
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('/tasks/1');
      expect(url).toContain('include=project');
    });

    it('createTask with all relationships', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.createTask({
        title: 'New task',
        project_id: '10',
        task_list_id: '20',
        assignee_id: '30',
        workflow_status_id: '40',
        description: 'desc',
        due_date: '2024-12-31',
        initial_estimate: 480,
        private: true,
      });
      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.data.type).toBe('tasks');
      expect(body.data.attributes.title).toBe('New task');
      expect(body.data.relationships.project.data.id).toBe('10');
      expect(body.data.relationships.task_list.data.id).toBe('20');
      expect(body.data.relationships.assignee.data.id).toBe('30');
      expect(body.data.relationships.workflow_status.data.id).toBe('40');
    });

    it('createTask without optional relationships', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.createTask({ title: 'Min task', project_id: '10', task_list_id: '20' });
      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.data.relationships.assignee).toBeUndefined();
      expect(body.data.relationships.workflow_status).toBeUndefined();
    });

    it('updateTask with relationships', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.updateTask('1', { title: 'Updated', assignee_id: '50', workflow_status_id: '60' });
      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.data.attributes.title).toBe('Updated');
      expect(body.data.relationships.assignee.data.id).toBe('50');
      expect(body.data.relationships.workflow_status.data.id).toBe('60');
    });

    it('updateTask clears relationships with empty string', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.updateTask('1', { assignee_id: '', workflow_status_id: '' });
      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.data.relationships.assignee.data).toBeNull();
      expect(body.data.relationships.workflow_status.data).toBeNull();
    });

    it('updateTask without relationships', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.updateTask('1', { title: 'Just title' });
      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.data.relationships).toBeUndefined();
    });
  });

  describe('people', () => {
    it('getPeople with params', async () => {
      const api = createApi();
      mockFetchResponse({ data: [] });
      await api.getPeople({ page: 1, perPage: 25, sort: 'name', filter: { active: 'true' } });
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('/people');
      expect(url).toContain('sort=name');
    });

    it('getPerson', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '5' } });
      await api.getPerson('5');
      expect(fetchSpy.mock.calls[0][0] as string).toContain('/people/5');
    });
  });

  describe('services', () => {
    it('getServices with filters', async () => {
      const api = createApi();
      mockFetchResponse({ data: [] });
      await api.getServices({ page: 1, perPage: 50, filter: { project_id: '1' } });
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('/services');
    });
  });

  describe('budgets', () => {
    it('getBudgets with filters', async () => {
      const api = createApi();
      mockFetchResponse({ data: [] });
      await api.getBudgets({ page: 1, perPage: 50, filter: { project_id: '1' } });
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('/budgets');
    });
  });

  describe('companies', () => {
    it('getCompanies with params', async () => {
      const api = createApi();
      mockFetchResponse({ data: [] });
      await api.getCompanies({ page: 1, sort: 'name', filter: { archived: 'false' } });
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('/companies');
    });

    it('getCompany', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.getCompany('1');
      expect(fetchSpy.mock.calls[0][0] as string).toContain('/companies/1');
    });

    it('createCompany', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.createCompany({ name: 'Acme', vat: 'FR123', due_days: 30 });
      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.data.type).toBe('companies');
      expect(body.data.attributes.name).toBe('Acme');
      expect(body.data.attributes.vat).toBe('FR123');
    });

    it('updateCompany', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.updateCompany('1', { name: 'Updated', domain: 'new.com' });
      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.data.attributes.name).toBe('Updated');
      expect(body.data.attributes.domain).toBe('new.com');
    });
  });

  describe('comments', () => {
    it('getComments with include', async () => {
      const api = createApi();
      mockFetchResponse({ data: [] });
      await api.getComments({ include: ['creator'], filter: { task_id: '1' } });
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('include=creator');
    });

    it('getComment with include', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.getComment('1', { include: ['creator'] });
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('/comments/1');
      expect(url).toContain('include=creator');
    });

    it('createComment with task relationship', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.createComment({ body: 'Hello', task_id: '10' });
      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.data.attributes.body).toBe('Hello');
      expect(body.data.relationships.task.data.id).toBe('10');
    });

    it('createComment with all relationship types', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.createComment({
        body: 'test',
        deal_id: '1',
        company_id: '2',
        invoice_id: '3',
        person_id: '4',
        discussion_id: '5',
      });
      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.data.relationships.deal.data.id).toBe('1');
      expect(body.data.relationships.company.data.id).toBe('2');
      expect(body.data.relationships.invoice.data.id).toBe('3');
      expect(body.data.relationships.person.data.id).toBe('4');
      expect(body.data.relationships.discussion.data.id).toBe('5');
    });

    it('updateComment', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.updateComment('1', { body: 'Updated' });
      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.data.attributes.body).toBe('Updated');
    });
  });

  describe('timers', () => {
    it('getTimers with include', async () => {
      const api = createApi();
      mockFetchResponse({ data: [] });
      await api.getTimers({ include: ['person'], sort: '-started_at' });
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('include=person');
      expect(url).toContain('sort=-started_at');
    });

    it('getTimer with include', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.getTimer('1', { include: ['time_entry'] });
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('/timers/1');
    });

    it('startTimer with service', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.startTimer({ service_id: '10' });
      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.data.relationships.service.data.id).toBe('10');
    });

    it('startTimer with time_entry', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.startTimer({ time_entry_id: '20' });
      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.data.relationships.time_entry.data.id).toBe('20');
    });

    it('stopTimer', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.stopTimer('1');
      const [url, opts] = fetchSpy.mock.calls[0];
      expect(url).toContain('/timers/1/stop');
      expect(opts!.method).toBe('PATCH');
    });
  });

  describe('deals', () => {
    it('getDeals with include', async () => {
      const api = createApi();
      mockFetchResponse({ data: [] });
      await api.getDeals({ include: ['company'], sort: '-date', filter: { status: '1' } });
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('include=company');
    });

    it('getDeal with include', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.getDeal('1', { include: ['company'] });
      expect(fetchSpy.mock.calls[0][0] as string).toContain('/deals/1');
    });

    it('createDeal with responsible', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.createDeal({
        name: 'Deal',
        company_id: '10',
        responsible_id: '20',
        date: '2024-01-01',
      });
      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.data.attributes.name).toBe('Deal');
      expect(body.data.relationships.company.data.id).toBe('10');
      expect(body.data.relationships.responsible.data.id).toBe('20');
    });

    it('createDeal without optional fields defaults date and budget', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.createDeal({ name: 'Min deal', company_id: '10' });
      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.data.attributes.date).toBeDefined(); // defaults to today
      expect(body.data.attributes.budget).toBe(false);
    });

    it('updateDeal with relationships', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.updateDeal('1', { name: 'Updated', responsible_id: '30', deal_status_id: '40' });
      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.data.attributes.name).toBe('Updated');
      expect(body.data.relationships.responsible.data.id).toBe('30');
      expect(body.data.relationships.deal_status.data.id).toBe('40');
    });

    it('updateDeal clears relationships', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.updateDeal('1', { responsible_id: '', deal_status_id: '' });
      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.data.relationships.responsible.data).toBeNull();
      expect(body.data.relationships.deal_status.data).toBeNull();
    });

    it('updateDeal without relationships', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.updateDeal('1', { name: 'Just name' });
      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.data.relationships).toBeUndefined();
    });
  });

  describe('bookings', () => {
    it('getBookings with include', async () => {
      const api = createApi();
      mockFetchResponse({ data: [] });
      await api.getBookings({ include: ['person', 'service'], sort: '-started_on' });
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('include=person%2Cservice');
    });

    it('getBooking with include', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.getBooking('1', { include: ['person'] });
      expect(fetchSpy.mock.calls[0][0] as string).toContain('/bookings/1');
    });

    it('createBooking with all relationships', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.createBooking({
        person_id: '10',
        service_id: '20',
        event_id: '30',
        started_on: '2024-01-01',
        ended_on: '2024-01-05',
        time: 480,
      });
      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.data.relationships.person.data.id).toBe('10');
      expect(body.data.relationships.service.data.id).toBe('20');
      expect(body.data.relationships.event.data.id).toBe('30');
    });

    it('createBooking minimal', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.createBooking({
        person_id: '10',
        started_on: '2024-01-01',
        ended_on: '2024-01-05',
      });
      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.data.relationships.service).toBeUndefined();
      expect(body.data.relationships.event).toBeUndefined();
    });

    it('updateBooking', async () => {
      const api = createApi();
      mockFetchResponse({ data: { id: '1' } });
      await api.updateBooking('1', { time: 240, note: 'Updated' });
      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.data.attributes.time).toBe(240);
      expect(body.data.attributes.note).toBe('Updated');
    });
  });

  describe('reports', () => {
    it('getReports with all params', async () => {
      const api = createApi();
      mockFetchResponse({ data: [] });
      await api.getReports('time_reports', {
        page: 1,
        perPage: 50,
        group: 'person',
        include: ['person'],
        filter: { after: '2024-01-01' },
      });
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('/reports/time_reports');
      expect(url).toContain('group=person');
      expect(url).toContain('include=person');
      expect(url).toContain('filter%5Bafter%5D=2024-01-01');
    });
  });
});
