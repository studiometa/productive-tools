import { vol } from 'memfs';
import { beforeEach, vi } from 'vitest';

// Mock node:fs and node:fs/promises globally
vi.mock('node:fs');
vi.mock('node:fs/promises');

// Reset the in-memory filesystem before each test
beforeEach(() => {
  vol.reset();
});
