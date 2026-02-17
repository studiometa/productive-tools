import { describe, it, expect } from 'vitest';

import { formatDeal } from '../deal.js';

const fullDeal = {
  id: '1',
  type: 'deals',
  attributes: {
    name: 'Big Deal',
    number: 'D-001',
    budget: false,
    date: '2024-01-01',
    end_date: '2024-12-31',
    won_at: '2024-03-01',
    lost_at: null,
    created_at: '2024-01-01',
    updated_at: '2024-06-01',
  },
  relationships: {
    company: { data: { type: 'companies', id: '10' } },
    responsible: { data: { type: 'people', id: '20' } },
    deal_status: { data: { type: 'deal_statuses', id: '30' } },
  },
};

const included = [
  { id: '10', type: 'companies', attributes: { name: 'Acme' } },
  { id: '20', type: 'people', attributes: { first_name: 'Jane', last_name: 'Doe' } },
  { id: '30', type: 'deal_statuses', attributes: { name: 'Won' } },
];

describe('formatDeal', () => {
  it('formats with all fields and includes', () => {
    const r = formatDeal(fullDeal, { included });
    expect(r.id).toBe('1');
    expect(r.name).toBe('Big Deal');
    expect(r.number).toBe('D-001');
    expect(r.type).toBe('deal');
    expect(r.date).toBe('2024-01-01');
    expect(r.end_date).toBe('2024-12-31');
    expect(r.won_at).toBe('2024-03-01');
    expect(r.lost_at).toBeNull();
    expect(r.company_id).toBe('10');
    expect(r.company_name).toBe('Acme');
    expect(r.responsible_id).toBe('20');
    expect(r.responsible_name).toBe('Jane Doe');
    expect(r.status_id).toBe('30');
    expect(r.status_name).toBe('Won');
  });

  it('formats budget type', () => {
    const r = formatDeal({ ...fullDeal, attributes: { ...fullDeal.attributes, budget: true } });
    expect(r.type).toBe('budget');
  });

  it('handles missing attributes', () => {
    const r = formatDeal({ id: '2', type: 'deals', attributes: {} });
    expect(r.name).toBe('');
    expect(r.number).toBeNull();
    expect(r.date).toBeNull();
    expect(r.end_date).toBeNull();
    expect(r.won_at).toBeNull();
    expect(r.lost_at).toBeNull();
  });

  it('excludes relationship IDs when disabled', () => {
    const r = formatDeal(fullDeal, { includeRelationshipIds: false });
    expect(r.company_id).toBeUndefined();
    expect(r.responsible_id).toBeUndefined();
    expect(r.status_id).toBeUndefined();
  });

  it('excludes timestamps when disabled', () => {
    const r = formatDeal(fullDeal, { includeTimestamps: false });
    expect(r.created_at).toBeUndefined();
    expect(r.updated_at).toBeUndefined();
  });

  it('handles missing included resources', () => {
    const r = formatDeal(fullDeal, { included: [] });
    expect(r.company_name).toBeUndefined();
    expect(r.responsible_name).toBeUndefined();
    expect(r.status_name).toBeUndefined();
  });
});
