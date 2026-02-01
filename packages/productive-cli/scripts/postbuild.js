#!/usr/bin/env node

import { chmodSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const cliPath = join(__dirname, '..', 'dist', 'cli.js');

try {
  chmodSync(cliPath, 0o755);
  console.log('✓ Made dist/cli.js executable');
} catch (error) {
  console.error('✗ Failed to make cli.js executable:', error.message);
  process.exit(1);
}
