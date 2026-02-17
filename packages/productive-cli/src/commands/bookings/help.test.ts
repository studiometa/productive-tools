import { describe, it, expect, vi, afterEach } from 'vitest';

import { showBookingsHelp } from './help.js';

describe('showBookingsHelp', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('shows general help with no argument', () => {
    showBookingsHelp();
    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive bookings');
    expect(output).toContain('list, ls');
    expect(output).toContain('get');
    expect(output).toContain('add, create');
    expect(output).toContain('update');
  });

  it('shows list help for "list"', () => {
    showBookingsHelp('list');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive bookings list');
    expect(output).toContain('--mine');
    expect(output).toContain('--person');
    expect(output).toContain('--from');
    expect(output).toContain('--to');
  });

  it('shows list help for "ls" alias', () => {
    showBookingsHelp('ls');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive bookings list');
  });

  it('shows get help', () => {
    showBookingsHelp('get');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive bookings get');
    expect(output).toContain('<id>');
  });

  it('shows add help for "add"', () => {
    showBookingsHelp('add');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive bookings add');
    expect(output).toContain('--service');
    expect(output).toContain('--event');
    expect(output).toContain('--from');
    expect(output).toContain('--to');
  });

  it('shows add help for "create" alias', () => {
    showBookingsHelp('create');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive bookings add');
  });

  it('shows update help', () => {
    showBookingsHelp('update');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive bookings update');
    expect(output).toContain('--confirm');
  });
});
