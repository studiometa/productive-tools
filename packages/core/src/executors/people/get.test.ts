import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { getPerson } from './get.js';

describe('getPerson', () => {
  const mockPerson = {
    id: '1',
    type: 'people' as const,
    attributes: { first_name: 'John', last_name: 'Doe' },
  };

  it('fetches a person by ID', async () => {
    const getPersonApi = vi.fn().mockResolvedValue({ data: mockPerson });
    const ctx = createTestExecutorContext({
      api: { getPerson: getPersonApi },
    });

    const result = await getPerson({ id: '1' }, ctx);

    expect(getPersonApi).toHaveBeenCalledWith('1', { include: undefined });
    expect(result.data).toEqual(mockPerson);
  });

  it('forwards include and returns included (Finding 1)', async () => {
    const included = [{ id: '9', type: 'companies', attributes: { name: 'Acme' } }];
    const getPersonApi = vi.fn().mockResolvedValue({ data: mockPerson, included });
    const ctx = createTestExecutorContext({ api: { getPerson: getPersonApi } });

    const result = await getPerson({ id: '1', include: ['company'] }, ctx);

    expect(getPersonApi).toHaveBeenCalledWith('1', { include: ['company'] });
    expect(result.included).toEqual(included);
  });

  it('resolves non-numeric ID before fetching', async () => {
    const getPersonApi = vi.fn().mockResolvedValue({ data: mockPerson });
    const resolveValue = vi.fn().mockResolvedValue('1');
    const ctx = createTestExecutorContext({
      api: { getPerson: getPersonApi },
      resolver: { resolveValue },
    });

    await getPerson({ id: 'john@test.com' }, ctx);

    expect(resolveValue).toHaveBeenCalledWith('john@test.com', 'person');
    expect(getPersonApi).toHaveBeenCalledWith('1', { include: undefined });
  });
});
