import { describe, it, expect, vi, afterEach } from 'vitest';

import { createTestContext } from '../../context.js';
import { createCommandRouter } from '../../utils/command-router.js';
import { activitiesCommandConfig } from './command.js';
import { activitiesList } from './handlers.js';

describe('activities command wiring', () => {
  it('uses "activities" as resource name', () => {
    expect(activitiesCommandConfig.resource).toBe('activities');
  });

  it('wires list and ls to activitiesList', () => {
    expect(activitiesCommandConfig.handlers.list).toBe(activitiesList);
    expect(activitiesCommandConfig.handlers.ls).toBe(activitiesList);
  });
});

describe('activities command routing', () => {
  const mockActivitiesList = vi.fn().mockResolvedValue(undefined);

  const router = createCommandRouter({
    resource: 'activities',
    handlers: {
      list: mockActivitiesList,
      ls: mockActivitiesList,
    },
    contextFactory: (options) => createTestContext({ options }),
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockActivitiesList.mockClear();
  });

  it('routes "list" subcommand to activitiesList handler', async () => {
    await router('list', [], { format: 'json' });
    expect(mockActivitiesList).toHaveBeenCalled();
  });

  it('routes "ls" alias to activitiesList handler', async () => {
    await router('ls', [], { format: 'json' });
    expect(mockActivitiesList).toHaveBeenCalled();
  });

  it('exits with error for unknown subcommand', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await router('unknown', [], { format: 'json' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown activities subcommand: unknown'),
    );
  });
});
