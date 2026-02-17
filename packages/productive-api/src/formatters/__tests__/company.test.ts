import { describe, it, expect } from 'vitest';

import { formatCompany } from '../company.js';

const full = {
  id: '1',
  type: 'companies',
  attributes: {
    name: 'Acme',
    billing_name: 'Acme Inc',
    company_code: 'ACM',
    vat: 'FR123',
    default_currency: 'EUR',
    domain: 'acme.com',
    due_days: 30,
    archived_at: '2024-01-01',
    created_at: '2023-01-01',
    updated_at: '2024-06-01',
  },
};

describe('formatCompany', () => {
  it('formats with all fields', () => {
    const r = formatCompany(full);
    expect(r.id).toBe('1');
    expect(r.name).toBe('Acme');
    expect(r.billing_name).toBe('Acme Inc');
    expect(r.company_code).toBe('ACM');
    expect(r.vat).toBe('FR123');
    expect(r.default_currency).toBe('EUR');
    expect(r.domain).toBe('acme.com');
    expect(r.due_days).toBe(30);
    expect(r.archived).toBe(true);
    expect(r.created_at).toBe('2023-01-01');
    expect(r.updated_at).toBe('2024-06-01');
  });

  it('formats with null optional fields', () => {
    const r = formatCompany({ id: '2', type: 'companies', attributes: { name: 'X' } });
    expect(r.name).toBe('X');
    expect(r.billing_name).toBeNull();
    expect(r.vat).toBeNull();
    expect(r.due_days).toBeNull();
    expect(r.archived).toBe(false);
  });

  it('excludes timestamps when disabled', () => {
    const r = formatCompany(full, { includeTimestamps: false });
    expect(r.created_at).toBeUndefined();
    expect(r.updated_at).toBeUndefined();
  });

  it('handles empty name', () => {
    const r = formatCompany({ id: '3', type: 'companies', attributes: {} });
    expect(r.name).toBe('');
  });
});
