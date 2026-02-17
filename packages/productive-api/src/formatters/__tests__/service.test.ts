import { describe, it, expect } from 'vitest';

import { formatService } from '../service.js';

describe('formatService', () => {
  it('formats with all fields', () => {
    const r = formatService({
      id: '1',
      type: 'services',
      attributes: {
        name: 'Dev',
        budgeted_time: 4800,
        worked_time: 2400,
        created_at: '2024-01-01',
        updated_at: '2024-06-01',
      },
    });
    expect(r).toEqual({
      id: '1',
      name: 'Dev',
      budgeted_time: 4800,
      worked_time: 2400,
      created_at: '2024-01-01',
      updated_at: '2024-06-01',
    });
  });

  it('omits optional time fields when absent', () => {
    const r = formatService({ id: '2', type: 'services', attributes: { name: 'Design' } });
    expect(r.id).toBe('2');
    expect(r.name).toBe('Design');
    expect(r.budgeted_time).toBeUndefined();
    expect(r.worked_time).toBeUndefined();
  });

  it('excludes timestamps when disabled', () => {
    const r = formatService(
      { id: '3', type: 'services', attributes: { name: 'QA', created_at: 'x' } },
      { includeTimestamps: false },
    );
    expect(r.created_at).toBeUndefined();
  });

  it('handles empty name', () => {
    const r = formatService({ id: '4', type: 'services', attributes: {} });
    expect(r.name).toBe('');
  });
});
