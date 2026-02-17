import { describe, it, expect, vi, afterEach } from 'vitest';

import type { RenderContext } from '../../types.js';

import { HumanCommentListRenderer } from '../comment.js';

const ctx: RenderContext = { format: 'human', verbose: false, links: false };

describe('HumanCommentListRenderer', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('renders a list', () => {
    new HumanCommentListRenderer().render(
      {
        data: [
          {
            id: '1',
            body: 'Great work!',
            commentable_type: 'Task',
            draft: false,
            pinned: true,
            hidden: false,
            creator_name: 'Jane Doe',
            created_at: '2024-01-01',
          },
        ],
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders draft comment', () => {
    new HumanCommentListRenderer().render(
      {
        data: [
          {
            id: '1',
            body: 'WIP',
            commentable_type: 'Task',
            draft: true,
            pinned: false,
            hidden: false,
          },
        ],
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders hidden comment', () => {
    new HumanCommentListRenderer().render(
      {
        data: [
          {
            id: '1',
            body: 'Hidden',
            commentable_type: 'Task',
            draft: false,
            pinned: false,
            hidden: true,
          },
        ],
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders empty list', () => {
    new HumanCommentListRenderer().render({ data: [] }, ctx);
    // Renderers may log 'no results' for empty data
  });
});
