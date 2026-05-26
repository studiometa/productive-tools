import { describe, expect, it, vi } from 'vitest';

import type { DryRunCall } from './dry-run.js';

import { createDryRunFetch, printDryRunSummary } from './dry-run.js';

// ── createDryRunFetch ─────────────────────────────────────────────────────────

describe('createDryRunFetch', () => {
  function makeRealFetch(body = '{"data":{}}', status = 200): typeof globalThis.fetch {
    return vi.fn().mockResolvedValue(
      new Response(body, {
        status,
        headers: { 'Content-Type': 'application/vnd.api+json' },
      }),
    );
  }

  it('passes GET requests through to the real fetch', async () => {
    const calls: DryRunCall[] = [];
    const real = makeRealFetch();
    const fetch = createDryRunFetch(calls, real);

    await fetch('https://api.example.com/projects');

    expect(real).toHaveBeenCalledOnce();
    expect(calls).toHaveLength(0);
  });

  it('passes HEAD requests through to the real fetch', async () => {
    const calls: DryRunCall[] = [];
    const real = makeRealFetch();
    const fetch = createDryRunFetch(calls, real);

    await fetch('https://api.example.com/projects', { method: 'HEAD' });

    expect(real).toHaveBeenCalledOnce();
    expect(calls).toHaveLength(0);
  });

  it('intercepts POST requests and records them', async () => {
    const calls: DryRunCall[] = [];
    const real = makeRealFetch();
    const fetch = createDryRunFetch(calls, real);

    await fetch('https://api.example.com/time_entries', {
      method: 'POST',
      body: JSON.stringify({ data: { type: 'time_entries', attributes: { note: 'Work' } } }),
    });

    expect(real).not.toHaveBeenCalled();
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('https://api.example.com/time_entries');
  });

  it('intercepts PATCH requests', async () => {
    const calls: DryRunCall[] = [];
    const real = makeRealFetch();
    const fetch = createDryRunFetch(calls, real);

    await fetch('https://api.example.com/tasks/123', { method: 'PATCH' });

    expect(calls[0].method).toBe('PATCH');
    expect(calls[0].url).toBe('https://api.example.com/tasks/123');
  });

  it('intercepts DELETE requests', async () => {
    const calls: DryRunCall[] = [];
    const real = makeRealFetch();
    const fetch = createDryRunFetch(calls, real);

    await fetch('https://api.example.com/time_entries/99', { method: 'DELETE' });

    expect(calls[0].method).toBe('DELETE');
  });

  it('intercepts PUT requests', async () => {
    const calls: DryRunCall[] = [];
    const real = makeRealFetch();
    const fetch = createDryRunFetch(calls, real);

    await fetch('https://api.example.com/resource', { method: 'PUT' });

    expect(calls[0].method).toBe('PUT');
  });

  it('parses the JSON body when intercepting', async () => {
    const calls: DryRunCall[] = [];
    const fetch = createDryRunFetch(calls, makeRealFetch());
    const payload = { data: { type: 'time_entries', attributes: { note: 'Test' } } };

    await fetch('https://api.example.com/time_entries', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    expect(calls[0].body).toEqual(payload);
  });

  it('stores raw body when it is not JSON', async () => {
    const calls: DryRunCall[] = [];
    const fetch = createDryRunFetch(calls, makeRealFetch());

    await fetch('https://api.example.com/resource', {
      method: 'POST',
      body: 'plain text',
    });

    expect(calls[0].body).toBe('plain text');
  });

  it('returns a fake 201 response for POST', async () => {
    const calls: DryRunCall[] = [];
    const fetch = createDryRunFetch(calls, makeRealFetch());

    const response = await fetch('https://api.example.com/time_entries', {
      method: 'POST',
    });

    expect(response.status).toBe(201);
  });

  it('returns a fake 200 response for PATCH/DELETE', async () => {
    const calls: DryRunCall[] = [];
    const fetch = createDryRunFetch(calls, makeRealFetch());

    const patchResponse = await fetch('https://api.example.com/tasks/1', { method: 'PATCH' });
    const deleteResponse = await fetch('https://api.example.com/tasks/2', { method: 'DELETE' });

    expect(patchResponse.status).toBe(200);
    expect(deleteResponse.status).toBe(200);
  });

  it('accepts a URL object as input', async () => {
    const calls: DryRunCall[] = [];
    const fetch = createDryRunFetch(calls, makeRealFetch());

    await fetch(new URL('https://api.example.com/tasks/5'), { method: 'DELETE' });

    expect(calls[0].url).toBe('https://api.example.com/tasks/5');
  });

  it('accumulates multiple calls', async () => {
    const calls: DryRunCall[] = [];
    const fetch = createDryRunFetch(calls, makeRealFetch());

    await fetch('https://api.example.com/a', { method: 'POST' });
    await fetch('https://api.example.com/b', { method: 'DELETE' });

    expect(calls).toHaveLength(2);
  });
});

// ── printDryRunSummary ────────────────────────────────────────────────────────

describe('printDryRunSummary', () => {
  function makeOutput() {
    return { warn: vi.fn(), table: vi.fn(), info: vi.fn() };
  }

  it('prints an info message when no calls were recorded', () => {
    const output = makeOutput();
    printDryRunSummary([], output);
    expect(output.info).toHaveBeenCalledWith(expect.stringContaining('no mutating API calls'));
    expect(output.warn).not.toHaveBeenCalled();
    expect(output.table).not.toHaveBeenCalled();
  });

  it('prints a warning and a table when calls were recorded', () => {
    const output = makeOutput();
    const calls: DryRunCall[] = [
      { method: 'POST', url: 'https://api.example.com/time_entries' },
      { method: 'DELETE', url: 'https://api.example.com/tasks/5' },
    ];
    printDryRunSummary(calls, output);
    expect(output.warn).toHaveBeenCalledWith(expect.stringContaining('2 mutating calls'));
    expect(output.table).toHaveBeenCalledWith([
      { method: 'POST', url: 'https://api.example.com/time_entries' },
      { method: 'DELETE', url: 'https://api.example.com/tasks/5' },
    ]);
  });

  it('uses singular "call" for a single recorded call', () => {
    const output = makeOutput();
    printDryRunSummary([{ method: 'POST', url: 'https://x.com/a' }], output);
    expect(output.warn).toHaveBeenCalledWith(expect.stringContaining('1 mutating call '));
  });
});
