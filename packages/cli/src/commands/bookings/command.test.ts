import { describe, it, expect, vi, afterEach } from 'vitest';

import { createTestContext } from '../../context.js';
import { createCommandRouter } from '../../utils/command-router.js';
import { bookingsCommandConfig } from './command.js';
import { bookingsList, bookingsGet, bookingsAdd, bookingsUpdate } from './handlers.js';

describe('bookings command wiring', () => {
  it('uses "bookings" as resource name', () => {
    expect(bookingsCommandConfig.resource).toBe('bookings');
  });

  it('wires list and ls to bookingsList', () => {
    expect(bookingsCommandConfig.handlers.list).toBe(bookingsList);
    expect(bookingsCommandConfig.handlers.ls).toBe(bookingsList);
  });

  it('wires get to bookingsGet as args handler', () => {
    expect(bookingsCommandConfig.handlers.get).toEqual([bookingsGet, 'args']);
  });

  it('wires add and create to bookingsAdd', () => {
    expect(bookingsCommandConfig.handlers.add).toBe(bookingsAdd);
    expect(bookingsCommandConfig.handlers.create).toBe(bookingsAdd);
  });

  it('wires update to bookingsUpdate as args handler', () => {
    expect(bookingsCommandConfig.handlers.update).toEqual([bookingsUpdate, 'args']);
  });
});

describe('bookings command routing', () => {
  const mockBookingsList = vi.fn().mockResolvedValue(undefined);
  const mockBookingsGet = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);
  const mockBookingsAdd = vi.fn().mockResolvedValue(undefined);
  const mockBookingsUpdate = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);

  const router = createCommandRouter({
    resource: 'bookings',
    handlers: {
      list: mockBookingsList,
      ls: mockBookingsList,
      get: [mockBookingsGet, 'args'],
      add: mockBookingsAdd,
      create: mockBookingsAdd,
      update: [mockBookingsUpdate, 'args'],
    },
    contextFactory: (options) => createTestContext({ options }),
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockBookingsList.mockClear();
    mockBookingsGet.mockClear();
    mockBookingsAdd.mockClear();
    mockBookingsUpdate.mockClear();
  });

  it('routes "list" subcommand to bookingsList handler', async () => {
    await router('list', [], { format: 'json' });
    expect(mockBookingsList).toHaveBeenCalled();
  });

  it('routes "ls" alias to bookingsList handler', async () => {
    await router('ls', [], { format: 'json' });
    expect(mockBookingsList).toHaveBeenCalled();
  });

  it('routes "get" subcommand to bookingsGet handler', async () => {
    await router('get', ['123'], { format: 'json' });
    expect(mockBookingsGet).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('routes "add" subcommand to bookingsAdd handler', async () => {
    await router('add', [], { format: 'json' });
    expect(mockBookingsAdd).toHaveBeenCalled();
  });

  it('routes "create" alias to bookingsAdd handler', async () => {
    await router('create', [], { format: 'json' });
    expect(mockBookingsAdd).toHaveBeenCalled();
  });

  it('routes "update" subcommand to bookingsUpdate handler', async () => {
    await router('update', ['123'], { format: 'json' });
    expect(mockBookingsUpdate).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('exits with error for unknown subcommand', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await router('unknown', [], { format: 'json' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown bookings subcommand: unknown'),
    );
  });
});
