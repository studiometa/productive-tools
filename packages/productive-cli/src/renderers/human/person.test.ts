import { describe, it, expect, vi, afterEach } from 'vitest';

import type { RenderContext } from '../types.js';

import { HumanPersonListRenderer } from './person.js';

const ctx: RenderContext = { format: 'human', verbose: false, links: false };

describe('HumanPersonListRenderer', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('renders a list', () => {
    new HumanPersonListRenderer().render(
      {
        data: [
          {
            id: '1',
            name: 'John Doe',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@test.com',
            active: true,
            title: 'Dev',
          },
        ],
        meta: { page: 1, total_pages: 2, total_count: 10 },
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders inactive person', () => {
    new HumanPersonListRenderer().render(
      {
        data: [{ id: '1', name: 'X', first_name: 'X', last_name: 'Y', email: '', active: false }],
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders empty list', () => {
    new HumanPersonListRenderer().render({ data: [] }, ctx);
    expect(spy).not.toHaveBeenCalled();
  });
});
