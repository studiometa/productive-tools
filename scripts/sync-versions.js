#!/usr/bin/env node
/**
 * Pre-publish script to sync inter-package dependency versions.
 *
 * Replaces "*" workspace dependencies with the actual current version
 * before publishing to npm. This ensures all @studiometa/productive-*
 * packages reference each other with proper version ranges.
 *
 * Usage: node scripts/sync-versions.js
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const PACKAGES = ['api', 'core', 'cli', 'mcp'];
const SCOPE = '@studiometa/productive-';

// Read root version as source of truth
const rootPkg = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf-8'));
const version = rootPkg.version;

console.log(`Syncing all packages to version ${version}...\n`);

for (const pkg of PACKAGES) {
  const pkgPath = resolve(rootDir, 'packages', pkg, 'package.json');
  const pkgJson = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const changes = [];

  // Sync version
  if (pkgJson.version !== version) {
    changes.push(`  version: ${pkgJson.version} → ${version}`);
    pkgJson.version = version;
  }

  // Sync inter-package dependencies
  if (pkgJson.dependencies) {
    for (const [dep, range] of Object.entries(pkgJson.dependencies)) {
      if (dep.startsWith(SCOPE) && range === '*') {
        pkgJson.dependencies[dep] = version;
        changes.push(`  ${dep}: * → ${version}`);
      }
    }
  }

  if (changes.length > 0) {
    writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2) + '\n');
    console.log(`✓ ${pkgJson.name}`);
    for (const change of changes) console.log(change);
  } else {
    console.log(`✓ ${pkgJson.name} (no changes)`);
  }
}

console.log(`\nDone. All packages at ${version}.`);
