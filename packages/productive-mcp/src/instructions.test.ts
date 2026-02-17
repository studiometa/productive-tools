import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

import { INSTRUCTIONS } from './instructions.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Load SKILL.md content for comparison
 */
function loadSkillMd(): string {
  const skillPath = join(__dirname, '..', 'skills', 'SKILL.md');
  return readFileSync(skillPath, 'utf-8');
}

describe('instructions', () => {
  const skillContent = loadSkillMd();

  describe('INSTRUCTIONS export', () => {
    it('should export INSTRUCTIONS as a non-empty string', () => {
      expect(typeof INSTRUCTIONS).toBe('string');
      expect(INSTRUCTIONS.length).toBeGreaterThan(0);
    });

    it('should not contain YAML frontmatter', () => {
      expect(INSTRUCTIONS).not.toMatch(/^---\n/);
      expect(INSTRUCTIONS).not.toContain('name: productive-mcp');
      expect(INSTRUCTIONS).not.toContain('description: MCP server');
    });
  });

  describe('sync with SKILL.md', () => {
    it('should contain the same title as SKILL.md', () => {
      expect(skillContent).toContain('# Productive MCP Server');
      expect(INSTRUCTIONS).toContain('# Productive MCP Server');
    });

    it('should contain the productive tool section', () => {
      expect(skillContent).toContain('## The `productive` Tool');
      expect(INSTRUCTIONS).toContain('## The `productive` Tool');
    });

    it('should contain resources and actions table', () => {
      const resources = ['projects', 'time', 'tasks', 'services', 'people', 'companies'];
      for (const resource of resources) {
        expect(skillContent).toContain(`\`${resource}\``);
        expect(INSTRUCTIONS).toContain(`\`${resource}\``);
      }
    });

    it('should contain common parameters section', () => {
      expect(skillContent).toContain('## Common Parameters');
      expect(INSTRUCTIONS).toContain('## Common Parameters');
    });

    it('should contain examples section', () => {
      expect(skillContent).toContain('## Examples by Resource');
      expect(INSTRUCTIONS).toContain('## Examples by Resource');
    });

    it('should contain filters reference', () => {
      expect(skillContent).toContain('## Filters Reference');
      expect(INSTRUCTIONS).toContain('## Filters Reference');
    });

    it('should contain time values section', () => {
      expect(skillContent).toContain('## Time Values');
      expect(INSTRUCTIONS).toContain('## Time Values');
      expect(INSTRUCTIONS).toContain('MINUTES');
      expect(INSTRUCTIONS).toContain('480');
    });

    it('should contain best practices section', () => {
      expect(skillContent).toContain('## Best Practices');
      expect(INSTRUCTIONS).toContain('## Best Practices');
      expect(INSTRUCTIONS).toContain('Never modify text content');
      expect(INSTRUCTIONS).toContain('Never invent IDs');
    });

    it('should match SKILL.md content (without frontmatter)', () => {
      // Remove frontmatter from SKILL.md for comparison
      const skillWithoutFrontmatter = skillContent.replace(/^---\n[\s\S]*?\n---\n+/, '').trim();

      expect(INSTRUCTIONS).toBe(skillWithoutFrontmatter);
    });
  });
});
