import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { GenericRenderer, RenderContext } from '../types.js';

import { csvRenderer } from '../csv.js';
import { kanbanRenderer } from '../human/kanban.js';
import { humanTaskListRenderer } from '../human/task.js';
import { humanTimeEntryListRenderer } from '../human/time-entry.js';
import { jsonRenderer } from '../json.js';
import {
  registerRenderer,
  getRenderer,
  render,
  hasRenderer,
  getFormatsForResource,
} from '../registry.js';
import { tableRenderer } from '../table.js';

const defaultCtx: RenderContext = {
  noColor: true,
  terminalWidth: 80,
};

describe('renderer registry', () => {
  describe('getRenderer', () => {
    it('should return json renderer for any resource type', () => {
      expect(getRenderer('time_entry', 'json')).toBe(jsonRenderer);
      expect(getRenderer('task', 'json')).toBe(jsonRenderer);
      expect(getRenderer('project', 'json')).toBe(jsonRenderer);
    });

    it('should return csv renderer for any resource type', () => {
      expect(getRenderer('time_entry', 'csv')).toBe(csvRenderer);
      expect(getRenderer('task', 'csv')).toBe(csvRenderer);
    });

    it('should return table renderer for any resource type', () => {
      expect(getRenderer('time_entry', 'table')).toBe(tableRenderer);
      expect(getRenderer('project', 'table')).toBe(tableRenderer);
    });

    it('should return human renderer for registered resource types', () => {
      expect(getRenderer('time_entry', 'human')).toBe(humanTimeEntryListRenderer);
      expect(getRenderer('task', 'human')).toBe(humanTaskListRenderer);
    });

    it('should return kanban renderer for tasks', () => {
      expect(getRenderer('task', 'kanban')).toBe(kanbanRenderer);
    });
  });

  describe('registerRenderer', () => {
    it('should register a specific renderer for a resource type', () => {
      const mockRenderer: GenericRenderer = {
        render: vi.fn(),
      };

      registerRenderer('budget', 'human', mockRenderer);

      expect(getRenderer('budget', 'human')).toBe(mockRenderer);
    });

    it('should allow overriding wildcard with specific renderer', () => {
      const specificRenderer: GenericRenderer = {
        render: vi.fn(),
      };

      registerRenderer('service', 'json', specificRenderer);

      // Specific renderer takes precedence
      expect(getRenderer('service', 'json')).toBe(specificRenderer);
    });
  });

  describe('render', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should render data using the appropriate renderer', () => {
      const data = { id: '1', name: 'Test' };

      render('project', 'json', data, defaultCtx);

      expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
    });

    it('should render human format for registered resource types', () => {
      const data = {
        data: [{ id: '1', date: '2024-01-15', time_minutes: 480, time_hours: '8.00', note: null }],
        meta: { page: 1, total_pages: 1, total_count: 1 },
      };

      render('time_entry', 'human', data, defaultCtx);

      // Should output time entry in human format
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('hasRenderer', () => {
    it('should return true for registered formats', () => {
      expect(hasRenderer('time_entry', 'json')).toBe(true);
      expect(hasRenderer('task', 'csv')).toBe(true);
      expect(hasRenderer('project', 'table')).toBe(true);
    });

    it('should return true for human renderers', () => {
      expect(hasRenderer('time_entry', 'human')).toBe(true);
      expect(hasRenderer('task', 'human')).toBe(true);
      expect(hasRenderer('project', 'human')).toBe(true);
    });

    it('should return true for kanban renderer', () => {
      expect(hasRenderer('task', 'kanban')).toBe(true);
    });
  });

  describe('getFormatsForResource', () => {
    it('should return all registered formats for a resource', () => {
      const formats = getFormatsForResource('time_entry');

      expect(formats).toContain('json');
      expect(formats).toContain('csv');
      expect(formats).toContain('table');
    });
  });
});
