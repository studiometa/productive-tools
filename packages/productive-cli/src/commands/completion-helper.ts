/**
 * Completion helper for dynamic argument completion
 * This is called by shell completion scripts to provide context-aware suggestions
 */

import { getConfig } from '../config.js';
import { getSqliteCache } from '../utils/sqlite-cache.js';

/**
 * Get project names/IDs for completion
 */
async function getProjects(): Promise<void> {
  const config = getConfig();
  if (!config.organizationId) {
    return;
  }

  const cache = getSqliteCache(config.organizationId);
  const projects = await cache.searchProjects('');

  // Output format: "id:name" for easy parsing
  for (const project of projects.slice(0, 50)) {
    // Limit to 50 results
    console.log(`${project.id}:${project.name}`);
  }
}

/**
 * Get person names/IDs for completion
 */
async function getPeople(): Promise<void> {
  const config = getConfig();
  if (!config.organizationId) {
    return;
  }

  const cache = getSqliteCache(config.organizationId);
  const people = await cache.searchPeople('');

  for (const person of people.slice(0, 50)) {
    const name = `${person.first_name} ${person.last_name}`.trim();
    console.log(`${person.id}:${name}`);
  }
}

/**
 * Get service names/IDs for completion
 */
async function getServices(): Promise<void> {
  const config = getConfig();
  if (!config.organizationId) {
    return;
  }

  const cache = getSqliteCache(config.organizationId);
  const services = await cache.searchServices('');

  for (const service of services.slice(0, 50)) {
    console.log(`${service.id}:${service.name}`);
  }
}

/**
 * Get config keys for completion
 */
function getConfigKeys(): void {
  const keys = ['apiToken', 'organizationId', 'userId', 'baseUrl', 'useKeychain'];
  for (const key of keys) {
    console.log(key);
  }
}

/**
 * Main handler
 */
export async function handleCompletionHelper(args: string[]): Promise<void> {
  const type = args[0];

  try {
    switch (type) {
      case 'projects':
        await getProjects();
        break;
      case 'people':
        await getPeople();
        break;
      case 'services':
        await getServices();
        break;
      case 'config-keys':
        getConfigKeys();
        break;
      default:
        // Silent failure for unknown types
        break;
    }
  } catch {
    // Silent failure - completion should never error visibly
  }
}
