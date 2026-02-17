import { describe, expect, it } from 'vitest';

import { noopCache } from './cache.js';

describe('noopCache', () => {
  it('getAsync always returns null', async () => {
    const result = await noopCache.getAsync('/endpoint', {}, 'org-1');
    expect(result).toBeNull();
  });

  it('setAsync does nothing', async () => {
    await expect(
      noopCache.setAsync('/endpoint', {}, 'org-1', { data: 'test' }),
    ).resolves.toBeUndefined();
  });

  it('invalidateAsync does nothing', async () => {
    await expect(noopCache.invalidateAsync('time_entries')).resolves.toBeUndefined();
  });

  it('setOrgId does nothing', () => {
    expect(() => noopCache.setOrgId('org-1')).not.toThrow();
  });
});
