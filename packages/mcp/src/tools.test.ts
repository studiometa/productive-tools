import {
  RESOURCES,
  ACTIONS,
  MUTATING_ACTIONS,
  READ_ACTIONS,
  REPORT_TYPES,
} from '@studiometa/productive-core';
import { describe, it, expect } from 'vitest';

import { TOOLS, STDIO_ONLY_TOOLS } from './tools.js';

describe('tools', () => {
  describe('TOOLS', () => {
    it('should export the productive and raw API tools', () => {
      expect(Array.isArray(TOOLS)).toBe(true);
      expect(TOOLS.map((tool) => tool.name)).toEqual([
        'productive',
        'productive_read',
        'api_read',
        'api_write',
        'run_script',
        'search_docs',
      ]);
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

    it('should derive resource enum from shared RESOURCES constant', () => {
      const tool = TOOLS[0];
      const resourceProp = tool.inputSchema.properties?.resource as { enum?: string[] };
      expect(resourceProp?.enum).toEqual([...RESOURCES]);
    });

    it('should derive action enum from shared ACTIONS constant', () => {
      const tool = TOOLS[0];
      const actionProp = tool.inputSchema.properties?.action as { enum?: string[] };
      expect(actionProp?.enum).toEqual([...ACTIONS]);
    });

    it('should derive report_type enum from shared REPORT_TYPES constant', () => {
      const tool = TOOLS[0];
      const reportTypeProp = tool.inputSchema.properties?.report_type as { enum?: string[] };
      expect(reportTypeProp?.enum).toEqual([...REPORT_TYPES]);
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

    it('should have page parameters', () => {
      const tool = TOOLS[0];
      const props = tool.inputSchema.properties;
      expect(props).toHaveProperty('page_id');
      expect(props).toHaveProperty('parent_page_id');
    });

    it('should have attachment parameters', () => {
      const tool = TOOLS[0];
      const props = tool.inputSchema.properties;
      expect(props).toHaveProperty('comment_id');
    });

    it('should include all resources in description', () => {
      const tool = TOOLS[0];
      for (const resource of RESOURCES) {
        expect(tool.description).toContain(resource);
      }
    });

    it('should include all actions in description', () => {
      const tool = TOOLS[0];
      for (const action of ACTIONS) {
        expect(tool.description).toContain(action);
      }
    });

    describe('productive_read', () => {
      const productive = TOOLS.find((tool) => tool.name === 'productive')!;
      const readTool = TOOLS.find((tool) => tool.name === 'productive_read')!;
      const props = readTool.inputSchema.properties ?? {};

      it('should be annotated as read-only', () => {
        expect(readTool.annotations).toEqual({
          title: 'Productive.io (read-only)',
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
        });
      });

      it('should derive action enum from READ_ACTIONS', () => {
        const actionEnum = (props.action as { enum?: string[] }).enum;
        expect(actionEnum).toEqual([...READ_ACTIONS]);
        expect(actionEnum).toContain('list');
        expect(actionEnum).toContain('get');
        for (const action of MUTATING_ACTIONS) {
          expect(actionEnum).not.toContain(action);
        }
      });

      it('should require resource and action', () => {
        expect(readTool.inputSchema.required).toEqual(['resource', 'action']);
      });

      it('should expose only read parameters', () => {
        expect(new Set(Object.keys(props))).toEqual(
          new Set([
            'resource',
            'action',
            'id',
            'filter',
            'page',
            'per_page',
            'compact',
            'include',
            'query',
            'resources',
            'person_id',
            'project_id',
            'task_id',
            'company_id',
            'deal_id',
            'service_id',
            'report_type',
            'group',
            'from',
            'to',
            'operations',
          ]),
        );
      });

      it('should reuse the productive property definitions', () => {
        const productiveProps = productive.inputSchema.properties ?? {};
        for (const key of Object.keys(props)) {
          if (key === 'action') continue;
          expect(props[key]).toEqual(productiveProps[key]);
        }
      });
    });

    it('should include raw API tool definitions', () => {
      const apiRead = TOOLS.find((tool) => tool.name === 'api_read');
      const apiWrite = TOOLS.find((tool) => tool.name === 'api_write');

      expect(apiRead?.annotations).toMatchObject({
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      });
      expect(apiWrite?.annotations).toMatchObject({
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      });
      // api_read no longer requires `path` — `search` is an alternative entry point.
      expect(apiRead?.inputSchema.required).toBeUndefined();
      expect(apiWrite?.inputSchema.required).toEqual(['method', 'path', 'confirm']);
    });
  });

  describe('STDIO_ONLY_TOOLS', () => {
    it('should export an array of tools', () => {
      expect(Array.isArray(STDIO_ONLY_TOOLS)).toBe(true);
      expect(STDIO_ONLY_TOOLS.length).toBe(2);
    });

    it('should include configure tool', () => {
      const configureTool = STDIO_ONLY_TOOLS.find((t) => t.name === 'productive_configure');
      expect(configureTool).toBeDefined();
      expect(configureTool?.inputSchema.required).toEqual(
        expect.arrayContaining(['organizationId', 'apiToken']),
      );
    });

    it('should include get_config tool', () => {
      const getConfigTool = STDIO_ONLY_TOOLS.find((t) => t.name === 'productive_get_config');
      expect(getConfigTool).toBeDefined();
    });
  });

  describe('token optimization', () => {
    it('should have reasonable tool schema size', () => {
      const totalSize = JSON.stringify(TOOLS).length;
      expect(totalSize).toBeLessThan(12000);
    });

    it('should estimate under 3000 tokens', () => {
      const totalSize = JSON.stringify(TOOLS).length;
      const estimatedTokens = Math.ceil(totalSize / 4);
      expect(estimatedTokens).toBeLessThan(3000);
    });
  });
});
