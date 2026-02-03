/**
 * MCP Server Instructions
 *
 * These instructions are sent to Claude Desktop during initialization
 * and used as context/hints for the LLM. This ensures the AI agent
 * knows how to properly use the Productive.io MCP server.
 *
 * The content is derived from skills/SKILL.md (without YAML frontmatter).
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Load instructions from SKILL.md file
 * Removes YAML frontmatter (content between --- markers)
 */
function loadInstructions(): string {
  try {
    // In dist/, go up to package root, then to skills/
    const skillPath = join(__dirname, '..', 'skills', 'SKILL.md');
    const content = readFileSync(skillPath, 'utf-8');

    // Remove YAML frontmatter (between --- markers at start of file)
    const withoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n+/, '');

    return withoutFrontmatter.trim();
  } catch {
    // Fallback if file not found (shouldn't happen in production)
    return 'Productive.io MCP Server - Use the productive tool with resource and action parameters.';
  }
}

export const INSTRUCTIONS = loadInstructions();
