import { describe, it, expect } from 'vitest';
import { TOOLS, STDIO_ONLY_TOOLS } from '../tools.js';

describe('tools', () => {
  describe('TOOLS', () => {
    it('should export an array of tools', () => {
      expect(Array.isArray(TOOLS)).toBe(true);
      expect(TOOLS.length).toBeGreaterThan(0);
    });

    it('should have valid tool structure for all tools', () => {
      for (const tool of TOOLS) {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(tool.inputSchema).toHaveProperty('type', 'object');
      }
    });

    it('should include project tools', () => {
      const projectTools = TOOLS.filter(t => t.name.includes('project'));
      expect(projectTools.length).toBeGreaterThanOrEqual(2);

      const listProjects = TOOLS.find(t => t.name === 'productive_list_projects');
      expect(listProjects).toBeDefined();
      expect(listProjects?.inputSchema.properties).toHaveProperty('filter');
      expect(listProjects?.inputSchema.properties).toHaveProperty('page');
      expect(listProjects?.inputSchema.properties).toHaveProperty('per_page');

      const getProject = TOOLS.find(t => t.name === 'productive_get_project');
      expect(getProject).toBeDefined();
      expect(getProject?.inputSchema.required).toContain('id');
    });

    it('should include time entry tools', () => {
      const timeTools = TOOLS.filter(t => t.name.includes('time_entr'));
      expect(timeTools.length).toBeGreaterThanOrEqual(5);

      const createTimeEntry = TOOLS.find(t => t.name === 'productive_create_time_entry');
      expect(createTimeEntry).toBeDefined();
      expect(createTimeEntry?.inputSchema.required).toEqual(
        expect.arrayContaining(['person_id', 'service_id', 'time', 'date'])
      );

      const updateTimeEntry = TOOLS.find(t => t.name === 'productive_update_time_entry');
      expect(updateTimeEntry).toBeDefined();
      expect(updateTimeEntry?.inputSchema.required).toContain('id');

      const deleteTimeEntry = TOOLS.find(t => t.name === 'productive_delete_time_entry');
      expect(deleteTimeEntry).toBeDefined();
      expect(deleteTimeEntry?.inputSchema.required).toContain('id');
    });

    it('should include task tools', () => {
      const listTasks = TOOLS.find(t => t.name === 'productive_list_tasks');
      expect(listTasks).toBeDefined();

      const getTask = TOOLS.find(t => t.name === 'productive_get_task');
      expect(getTask).toBeDefined();
      expect(getTask?.inputSchema.required).toContain('id');
    });

    it('should include people tools', () => {
      const listPeople = TOOLS.find(t => t.name === 'productive_list_people');
      expect(listPeople).toBeDefined();

      const getPerson = TOOLS.find(t => t.name === 'productive_get_person');
      expect(getPerson).toBeDefined();
      expect(getPerson?.inputSchema.required).toContain('id');

      const getCurrentUser = TOOLS.find(t => t.name === 'productive_get_current_user');
      expect(getCurrentUser).toBeDefined();
    });

    it('should include service tools', () => {
      const listServices = TOOLS.find(t => t.name === 'productive_list_services');
      expect(listServices).toBeDefined();
    });

    it('should have proper filter schemas', () => {
      const listProjects = TOOLS.find(t => t.name === 'productive_list_projects');
      const filterProps = listProjects?.inputSchema.properties?.filter as { properties?: Record<string, unknown> };
      
      expect(filterProps).toBeDefined();
      expect(filterProps?.properties).toHaveProperty('board_id');
      expect(filterProps?.properties).toHaveProperty('company_id');
      expect(filterProps?.properties).toHaveProperty('project_manager_id');
    });
  });

  describe('STDIO_ONLY_TOOLS', () => {
    it('should export an array of tools', () => {
      expect(Array.isArray(STDIO_ONLY_TOOLS)).toBe(true);
      expect(STDIO_ONLY_TOOLS.length).toBeGreaterThan(0);
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

    it('should have valid tool structure', () => {
      for (const tool of STDIO_ONLY_TOOLS) {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool.name).toMatch(/^productive_/);
      }
    });
  });

  describe('tool naming conventions', () => {
    it('all tools should start with productive_ prefix', () => {
      const allTools = [...TOOLS, ...STDIO_ONLY_TOOLS];
      for (const tool of allTools) {
        expect(tool.name).toMatch(/^productive_/);
      }
    });

    it('list tools should have _list_ in name', () => {
      const listTools = TOOLS.filter(t => t.description.toLowerCase().includes('list'));
      for (const tool of listTools) {
        expect(tool.name).toMatch(/_list_/);
      }
    });

    it('get tools should have _get_ in name', () => {
      const getTools = TOOLS.filter(t => 
        t.description.toLowerCase().includes('get details') ||
        t.description.toLowerCase().includes('get the current')
      );
      for (const tool of getTools) {
        expect(tool.name).toMatch(/_get_/);
      }
    });
  });
});
