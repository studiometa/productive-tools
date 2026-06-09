/**
 * Tests for the sandbox host bridge.
 */

import { describe, it, expect, vi } from 'vitest';

import type { ProductiveCredentials } from '../auth.js';
import type { ToolResult } from '../handlers/types.js';
import type { RunLimits } from './limits.js';

import { createBridge, type ToolExecutor } from './bridge.js';

const credentials: ProductiveCredentials = {
  apiToken: 'test-token',
  organizationId: 'test-org',
  userId: 'test-user',
};

const limits: RunLimits = {
  timeoutMs: 5_000,
  memoryBytes: 64 * 1024 * 1024,
  maxApiCalls: 3,
  maxOutputBytes: 256 * 1024,
  maxCodeBytes: 128 * 1024,
};

function jsonOk(data: unknown): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data) }] };
}

function errorTool(message: string): ToolResult {
  return { content: [{ type: 'text', text: message }], isError: true };
}

function makeBridge(overrides: Partial<Parameters<typeof createBridge>[0]> = {}) {
  const exec = overrides.exec ?? (vi.fn(async () => jsonOk({ ok: true })) as ToolExecutor);
  const controller = new AbortController();
  const bridge = createBridge({
    credentials,
    exec,
    limits,
    dryRun: false,
    signal: controller.signal,
    ...overrides,
  });
  return { bridge, exec, controller };
}

describe('createBridge', () => {
  it('routes productive calls and returns the tool JSON text', async () => {
    const exec = vi.fn(async () => jsonOk([{ id: '1' }])) as ToolExecutor;
    const { bridge } = makeBridge({ exec });

    const result = await bridge.call('productive', { resource: 'tasks', action: 'list' });

    expect(JSON.parse(result)).toEqual([{ id: '1' }]);
    expect(exec).toHaveBeenCalledWith(
      'productive',
      { resource: 'tasks', action: 'list' },
      credentials,
    );
  });

  it('routes api_read and api_write to their tool names', async () => {
    const exec = vi.fn(async () => jsonOk({ data: 1 })) as ToolExecutor;
    const { bridge } = makeBridge({ exec });

    await bridge.call('api_read', { path: '/invoices' });
    await bridge.call('api_write', { method: 'POST', path: '/x', confirm: true });

    expect(exec).toHaveBeenNthCalledWith(1, 'api_read', { path: '/invoices' }, credentials);
    expect(exec).toHaveBeenNthCalledWith(
      2,
      'api_write',
      { method: 'POST', path: '/x', confirm: true },
      credentials,
    );
  });

  it('throws when the tool returns an error result', async () => {
    const exec = vi.fn(async () => errorTool('**Error:** boom')) as ToolExecutor;
    const { bridge } = makeBridge({ exec });

    await expect(bridge.call('productive', { resource: 'tasks', action: 'get' })).rejects.toThrow(
      'boom',
    );
  });

  it('passes the tool text through verbatim', async () => {
    const exec = vi.fn(async () => ({
      content: [{ type: 'text', text: 'plain' }],
    })) as ToolExecutor;
    const { bridge } = makeBridge({ exec });

    expect(await bridge.call('productive', { resource: 'tasks', action: 'get' })).toBe('plain');
  });

  it('enforces the API call budget', async () => {
    const { bridge, exec } = makeBridge();

    await bridge.call('productive', { resource: 'tasks', action: 'list' });
    await bridge.call('productive', { resource: 'tasks', action: 'list' });
    await bridge.call('productive', { resource: 'tasks', action: 'list' });
    await expect(bridge.call('productive', { resource: 'tasks', action: 'list' })).rejects.toThrow(
      'API call budget exceeded (max 3)',
    );

    expect(exec).toHaveBeenCalledTimes(3);
    // Counter is not incremented for the rejected over-budget call.
    expect(bridge.getStats().apiCalls).toBe(3);
  });

  it('rejects an unknown channel', async () => {
    const { bridge, exec } = makeBridge();
    await expect(
      bridge.call('evil' as unknown as 'productive', { resource: 'x', action: 'y' }),
    ).rejects.toThrow('Unknown bridge channel: evil');
    expect(exec).not.toHaveBeenCalled();
  });

  it('rejects calls once the signal is aborted', async () => {
    const { bridge, controller, exec } = makeBridge();
    controller.abort();

    await expect(bridge.call('productive', { resource: 'tasks', action: 'list' })).rejects.toThrow(
      'timed out',
    );
    expect(exec).not.toHaveBeenCalled();
  });

  describe('dry run', () => {
    it('records mutating productive actions without executing them', async () => {
      const exec = vi.fn() as unknown as ToolExecutor;
      const { bridge } = makeBridge({ exec, dryRun: true });

      const result = await bridge.call('productive', {
        resource: 'tasks',
        action: 'create',
        title: 'T',
      });

      expect(JSON.parse(result)).toMatchObject({ _dryRun: true });
      expect(exec).not.toHaveBeenCalled();
      expect(bridge.getStats().recorded).toHaveLength(1);
    });

    it('records api_write but still executes read-only calls', async () => {
      const exec = vi.fn(async () => jsonOk([{ id: '1' }])) as ToolExecutor;
      const { bridge } = makeBridge({ exec, dryRun: true });

      await bridge.call('api_write', { method: 'DELETE', path: '/x', confirm: true });
      const reads = await bridge.call('productive', { resource: 'tasks', action: 'list' });

      expect(exec).toHaveBeenCalledTimes(1);
      expect(exec).toHaveBeenCalledWith('productive', expect.anything(), credentials);
      expect(JSON.parse(reads)).toEqual([{ id: '1' }]);
      expect(bridge.getStats().recorded).toHaveLength(1);
    });
  });
});
