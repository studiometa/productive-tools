/**
 * Tests for the QuickJS execution engine.
 *
 * These run the real (WASM) QuickJS engine with a fake `hostCall` — no network
 * is involved, satisfying the "no real API calls" rule.
 */

import { describe, it, expect, vi } from 'vitest';

import type { HostCall, RunScriptInput } from './engine.js';
import type { RunLimits } from './limits.js';

import { runScript, ScriptError, getQuickJSModule } from './engine.js';

const baseLimits: RunLimits = {
  timeoutMs: 2_000,
  memoryBytes: 64 * 1024 * 1024,
  maxApiCalls: 50,
  maxOutputBytes: 4 * 1024,
  maxCodeBytes: 128 * 1024,
};

function run(code: string, overrides: Partial<RunScriptInput> = {}) {
  const controller = new AbortController();
  const input: RunScriptInput = {
    code,
    args: [],
    flags: {},
    limits: baseLimits,
    signal: controller.signal,
    hostCall: vi.fn(async () => ({ ok: true })) as HostCall,
    ...overrides,
  };
  return { promise: runScript(input), controller, input };
}

describe('runScript', () => {
  it('returns the value the script returns', async () => {
    const { promise } = run('return 21 + 21;');
    await expect(promise).resolves.toMatchObject({ result: 42 });
  });

  it('returns null when the script returns nothing', async () => {
    const { promise } = run('const x = 1;');
    await expect(promise).resolves.toMatchObject({ result: null });
  });

  it('injects args and flags', async () => {
    const { promise } = run('return { args, flags };', {
      args: ['x'],
      flags: { mine: true },
    });
    await expect(promise).resolves.toMatchObject({
      result: { args: ['x'], flags: { mine: true } },
    });
  });

  it('buffers output entries', async () => {
    const { promise } = run(`
      output.json({ a: 1 });
      output.log('hello', 2);
      output.warn('careful');
    `);
    const { output } = await promise;
    expect(output).toEqual([
      { type: 'json', data: { a: 1 } },
      { type: 'log', data: 'hello 2' },
      { type: 'warn', data: 'careful' },
    ]);
  });

  it('round-trips a productive call through the host bridge', async () => {
    const hostCall = vi.fn(async () => [{ id: '1', name: 'Task' }]) as HostCall;
    const { promise } = run(
      `const t = await productive.tasks.list({ status: 'open' }); return t;`,
      {
        hostCall,
      },
    );
    const { result } = await promise;
    expect(result).toEqual([{ id: '1', name: 'Task' }]);
    expect(hostCall).toHaveBeenCalledWith('productive', {
      resource: 'tasks',
      action: 'list',
      filter: { status: 'open' },
    });
  });

  it('supports multiple awaited calls and loops', async () => {
    let n = 0;
    const hostCall = vi.fn(async () => ({ n: ++n })) as HostCall;
    const { promise } = run(
      `
      const out = [];
      for (let i = 0; i < 3; i++) {
        out.push(await productive('tasks', 'get', { id: String(i) }));
      }
      return out;
    `,
      { hostCall },
    );
    const { result } = await promise;
    expect(result).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
    expect(hostCall).toHaveBeenCalledTimes(3);
  });

  it('routes api.read and api.write through the bridge', async () => {
    const hostCall = vi.fn(async () => ({ ok: true })) as HostCall;
    const { promise } = run(
      `
      await api.read('/invoices', { page: 2 });
      await api.write('POST', '/x', { foo: 1 });
      return 'done';
    `,
      { hostCall },
    );
    await promise;
    expect(hostCall).toHaveBeenNthCalledWith(1, 'api_read', { path: '/invoices', page: 2 });
    expect(hostCall).toHaveBeenNthCalledWith(2, 'api_write', {
      method: 'POST',
      path: '/x',
      body: { foo: 1 },
      confirm: true,
    });
  });

  it('propagates a host-call rejection to the guest', async () => {
    const hostCall = vi.fn(async () => {
      throw new Error('budget exceeded');
    }) as HostCall;
    const { promise } = run(
      `
      try {
        await productive.tasks.list();
        return 'no-throw';
      } catch (e) {
        return 'caught: ' + e.message;
      }
    `,
      { hostCall },
    );
    await expect(promise).resolves.toMatchObject({ result: 'caught: budget exceeded' });
  });

  it('rejects with the guest error message on uncaught throw', async () => {
    const { promise } = run(`throw new Error('boom');`);
    await expect(promise).rejects.toThrow(ScriptError);
    await expect(promise).rejects.toThrow('boom');
  });

  it('rejects on a syntax error', async () => {
    const { promise } = run(`const = = =;`);
    await expect(promise).rejects.toThrow(ScriptError);
  });

  it('times out on an infinite loop', async () => {
    const { promise } = run(`while (true) {}`, { limits: { ...baseLimits, timeoutMs: 100 } });
    await expect(promise).rejects.toThrow('timed out');
  });

  it('flags truncation when output exceeds the cap', async () => {
    const { promise } = run(
      `for (let i = 0; i < 100; i++) { output.text('x'.repeat(100)); } return 'done';`,
      { limits: { ...baseLimits, maxOutputBytes: 512 } },
    );
    const { truncated } = await promise;
    expect(truncated).toBe(true);
  });

  it('counts output by UTF-8 bytes, not code units', async () => {
    // 10 CJK chars = 30 UTF-8 bytes; the JSON wrapper adds ~25 ASCII bytes.
    // Code-unit length (~35) is under the cap but the byte length (~55) is over,
    // so only byte-accurate counting trips truncation here.
    const { promise } = run(`output.text('中'.repeat(10)); return 'done';`, {
      limits: { ...baseLimits, maxOutputBytes: 45 },
    });
    const { truncated } = await promise;
    expect(truncated).toBe(true);
  });

  it('does not let a colliding param override routing keys', async () => {
    const hostCall = vi.fn(async () => ({})) as HostCall;
    await run(`await productive.tasks.update('5', { id: '9', title: 'x' }); return 1;`, {
      hostCall,
    }).promise;
    expect(hostCall).toHaveBeenCalledWith('productive', {
      resource: 'tasks',
      action: 'update',
      id: '5',
      title: 'x',
    });
  });

  it('rejects when the result is not serializable', async () => {
    const { promise } = run(`const a = {}; a.self = a; return a;`);
    await expect(promise).rejects.toThrow('not serializable');
  });

  it('aborts when the external signal fires mid-run', async () => {
    const controller = new AbortController();
    const hostCall = vi.fn(async () => {
      controller.abort();
      return {};
    }) as HostCall;
    const promise = runScript({
      code: `await productive.tasks.list(); return 'unreached';`,
      args: [],
      flags: {},
      limits: baseLimits,
      signal: controller.signal,
      hostCall,
    });
    await expect(promise).rejects.toThrow('timed out');
  });

  it('reports a thrown non-Error value', async () => {
    const { promise } = run(`throw 'just a string';`);
    await expect(promise).rejects.toThrow('just a string');
  });

  it('caches the WASM module across runs', async () => {
    const a = await getQuickJSModule();
    const b = await getQuickJSModule();
    expect(a).toBe(b);
  });
});
