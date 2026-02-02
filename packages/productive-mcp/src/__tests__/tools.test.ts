import { describe, it, expect } from 'vitest';
import { TOOLS, STDIO_ONLY_TOOLS } from '../tools.js';

describe('tools', () => {
  describe('TOOLS', () => {
    it('should export a single consolidated tool', () => {
      expect(Array.isArray(TOOLS)).toBe(true);
      expect(TOOLS.length).toBe(1);
      expect(TOOLS[0].name).toBe('productive');
    });

    it('should have valid tool structure', () => {
      const tool = TOOLS[0];
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('inputSchema');
      expect(typeof tool.name).toBe('string');
      expect(typeof tool.description).toBe('string');
      expect(tool.inputSchema).toHaveProperty('type', 'object');
    });

    it('should have resource enum with all resources', () => {
      const tool = TOOLS[0];
      const resourceProp = tool.inputSchema.properties?.resource as { enum?: string[] };
      expect(resourceProp?.enum).toEqual(['projects', 'time', 'tasks', 'services', 'people']);
    });

    it('should have action enum with all actions', () => {
      const tool = TOOLS[0];
      const actionProp = tool.inputSchema.properties?.action as { enum?: string[] };
      expect(actionProp?.enum).toEqual(['list', 'get', 'create', 'update', 'delete', 'me']);
    });

    it('should require resource and action', () => {
      const tool = TOOLS[0];
      expect(tool.inputSchema.required).toEqual(['resource', 'action']);
    });

    it('should have common parameters', () => {
      const tool = TOOLS[0];
      const props = tool.inputSchema.properties;
      expect(props).toHaveProperty('id');
      expect(props).toHaveProperty('filter');
      expect(props).toHaveProperty('page');
      expect(props).toHaveProperty('per_page');
      expect(props).toHaveProperty('compact');
    });

    it('should have time entry specific parameters', () => {
      const tool = TOOLS[0];
      const props = tool.inputSchema.properties;
      expect(props).toHaveProperty('person_id');
      expect(props).toHaveProperty('service_id');
      expect(props).toHaveProperty('time');
      expect(props).toHaveProperty('date');
      expect(props).toHaveProperty('note');
    });
  });

  describe('STDIO_ONLY_TOOLS', () => {
    it('should export an array of tools', () => {
      expect(Array.isArray(STDIO_ONLY_TOOLS)).toBe(true);
      expect(STDIO_ONLY_TOOLS.length).toBe(2);
    });

    it('should include configure tool', () => {
      const configureTool = STDIO_ONLY_TOOLS.find(t => t.name === 'productive_configure');
      expect(configureTool).toBeDefined();
      expect(configureTool?.inputSchema.required).toEqual(
        expect.arrayContaining(['organizationId', 'apiToken'])
      );
    });

    it('should include get_config tool', () => {
      const getConfigTool = STDIO_ONLY_TOOLS.find(t => t.name === 'productive_get_config');
      expect(getConfigTool).toBeDefined();
    });
  });

  describe('token optimization', () => {
    it('should have minimal tool schema size', () => {
      const totalSize = JSON.stringify(TOOLS).length;
      // Single tool should be under 800 bytes
      expect(totalSize).toBeLessThan(800);
    });

    it('should estimate under 200 tokens', () => {
      const totalSize = JSON.stringify(TOOLS).length;
      const estimatedTokens = Math.ceil(totalSize / 4);
      expect(estimatedTokens).toBeLessThan(200);
    });
  });
});
