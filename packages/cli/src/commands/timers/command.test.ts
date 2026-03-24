import { describe, it, expect, vi, afterEach } from 'vitest';

import { createTestContext } from '../../context.js';
import { createCommandRouter } from '../../utils/command-router.js';
import { timersCommandConfig } from './command.js';
import { timersList, timersGet, timersStart, timersStop } from './handlers.js';

describe('timers command wiring', () => {
  it('uses "timers" as resource name', () => {
    expect(timersCommandConfig.resource).toBe('timers');
  });

  it('wires list and ls to timersList', () => {
    expect(timersCommandConfig.handlers.list).toBe(timersList);
    expect(timersCommandConfig.handlers.ls).toBe(timersList);
  });

  it('wires get to timersGet as args handler', () => {
    expect(timersCommandConfig.handlers.get).toEqual([timersGet, 'args']);
  });

  it('wires start to timersStart', () => {
    expect(timersCommandConfig.handlers.start).toBe(timersStart);
  });

  it('wires stop to timersStop as args handler', () => {
    expect(timersCommandConfig.handlers.stop).toEqual([timersStop, 'args']);
  });
});

describe('timers command routing', () => {
  const mockTimersList = vi.fn().mockResolvedValue(undefined);
  const mockTimersGet = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);
  const mockTimersStart = vi.fn().mockResolvedValue(undefined);
  const mockTimersStop = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);

  const router = createCommandRouter({
    resource: 'timers',
    handlers: {
      list: mockTimersList,
      ls: mockTimersList,
      get: [mockTimersGet, 'args'],
      start: mockTimersStart,
      stop: [mockTimersStop, 'args'],
    },
    contextFactory: (options) => createTestContext({ options }),
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockTimersList.mockClear();
    mockTimersGet.mockClear();
    mockTimersStart.mockClear();
    mockTimersStop.mockClear();
  });

  it('routes "list" subcommand to timersList handler', async () => {
    await router('list', [], { format: 'json' });
    expect(mockTimersList).toHaveBeenCalled();
  });

  it('routes "ls" alias to timersList handler', async () => {
    await router('ls', [], { format: 'json' });
    expect(mockTimersList).toHaveBeenCalled();
  });

  it('routes "get" subcommand to timersGet handler', async () => {
    await router('get', ['123'], { format: 'json' });
    expect(mockTimersGet).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('routes "start" subcommand to timersStart handler', async () => {
    await router('start', [], { format: 'json' });
    expect(mockTimersStart).toHaveBeenCalled();
  });

  it('routes "stop" subcommand to timersStop handler', async () => {
    await router('stop', ['123'], { format: 'json' });
    expect(mockTimersStop).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('exits with error for unknown subcommand', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await router('unknown', [], { format: 'json' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown timers subcommand: unknown'),
    );
  });
});
