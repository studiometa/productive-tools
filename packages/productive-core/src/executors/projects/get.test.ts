import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { getProject } from './get.js';

describe('getProject', () => {
  const mockProject = {
    id: '42',
    type: 'projects' as const,
    attributes: {
      name: 'Test Project',
      archived: false,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  };

  it('resolves ID and returns project', async () => {
    const resolveValue = vi.fn().mockResolvedValue('42');
    const getProjectApi = vi.fn().mockResolvedValue({ data: mockProject });
    const ctx = createTestExecutorContext({
      api: { getProject: getProjectApi },
      resolver: { resolveValue },
    });

    const result = await getProject({ id: 'PRJ-001' }, ctx);

    expect(resolveValue).toHaveBeenCalledWith('PRJ-001', 'project');
    expect(getProjectApi).toHaveBeenCalledWith('42');
    expect(result.data).toEqual(mockProject);
  });
});
