#!/usr/bin/env node
import { chmodSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const files = ['index.js', 'server.js'];

for (const file of files) {
  const distFile = resolve(__dirname, '../dist', file);
  try {
    chmodSync(distFile, 0o755);
    console.log(`✓ Made dist/${file} executable`);
  } catch (error) {
    console.error(`Failed to make dist/${file} executable:`, error.message);
    process.exit(1);
  }
}
