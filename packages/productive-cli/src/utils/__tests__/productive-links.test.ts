import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { setColorEnabled } from '../colors.js';
import {
  projectUrl,
  taskUrl,
  serviceUrl,
  timeEntriesUrl,
  personUrl,
  budgetUrl,
  linkedId,
  linkedProject,
  linkedTask,
  linkedPerson,
  linkedService,
} from '../productive-links.js';

// Mock the config module
vi.mock('../../config.js', () => ({
  getConfig: vi.fn(() => ({ organizationId: 'test-org-123' })),
}));

describe('productive-links', () => {
  beforeEach(() => {
    setColorEnabled(true);
  });

  describe('projectUrl', () => {
    it('should generate correct project URL', () => {
      const url = projectUrl('456');
      expect(url).toBe('https://app.productive.io/test-org-123/projects/456');
    });
  });

  describe('taskUrl', () => {
    it('should generate correct task URL', () => {
      const url = taskUrl('789');
      expect(url).toBe('https://app.productive.io/test-org-123/tasks/789');
    });
  });

  describe('serviceUrl', () => {
    it('should generate correct service URL without deal', () => {
      const url = serviceUrl('111');
      expect(url).toBe('https://app.productive.io/test-org-123/services/111');
    });

    it('should generate correct service URL with deal', () => {
      const url = serviceUrl('111', '222');
      expect(url).toBe('https://app.productive.io/test-org-123/deals/222/budget?service=111');
    });
  });

  describe('timeEntriesUrl', () => {
    it('should generate correct time entries URL without date', () => {
      const url = timeEntriesUrl();
      expect(url).toBe('https://app.productive.io/test-org-123/time');
    });

    it('should generate correct time entries URL with date', () => {
      const url = timeEntriesUrl('2024-01-15');
      expect(url).toBe('https://app.productive.io/test-org-123/time?date=2024-01-15');
    });
  });

  describe('personUrl', () => {
    it('should generate correct person URL', () => {
      const url = personUrl('333');
      expect(url).toBe('https://app.productive.io/test-org-123/people/333');
    });
  });

  describe('budgetUrl', () => {
    it('should generate correct budget URL', () => {
      const url = budgetUrl('444');
      expect(url).toBe('https://app.productive.io/test-org-123/budgets/444');
    });
  });

  describe('linkedId', () => {
    it('should create clickable link for project', () => {
      const result = linkedId('456', 'project');
      expect(result).toContain('#456');
      expect(result).toContain('https://app.productive.io/test-org-123/projects/456');
      expect(result).toContain('\x1b]8;;'); // OSC 8 sequence
    });

    it('should create clickable link for task', () => {
      const result = linkedId('789', 'task');
      expect(result).toContain('#789');
      expect(result).toContain('https://app.productive.io/test-org-123/tasks/789');
    });

    it('should create clickable link for service', () => {
      const result = linkedId('111', 'service');
      expect(result).toContain('#111');
      expect(result).toContain('https://app.productive.io/test-org-123/services/111');
    });

    it('should create clickable link for person', () => {
      const result = linkedId('333', 'person');
      expect(result).toContain('#333');
      expect(result).toContain('https://app.productive.io/test-org-123/people/333');
    });

    it('should create clickable link for time', () => {
      const result = linkedId('999', 'time');
      expect(result).toContain('#999');
      expect(result).toContain('https://app.productive.io/test-org-123/time');
    });

    it('should create clickable link for budget', () => {
      const result = linkedId('444', 'budget');
      expect(result).toContain('#444');
      expect(result).toContain('https://app.productive.io/test-org-123/budgets/444');
    });

    it('should return plain ID when colors disabled', () => {
      setColorEnabled(false);
      const result = linkedId('456', 'project');
      expect(result).toContain('#456');
      expect(result).not.toContain('\x1b]8;;');
    });
  });

  describe('linkedProject', () => {
    it('should create clickable link for project text', () => {
      const result = linkedProject('My Project', '456');
      expect(result).toContain('My Project');
      expect(result).toContain('https://app.productive.io/test-org-123/projects/456');
      expect(result).toContain('\x1b]8;;');
    });
  });

  describe('linkedTask', () => {
    it('should create clickable link for task text', () => {
      const result = linkedTask('My Task', '789');
      expect(result).toContain('My Task');
      expect(result).toContain('https://app.productive.io/test-org-123/tasks/789');
      expect(result).toContain('\x1b]8;;');
    });
  });

  describe('linkedPerson', () => {
    it('should create clickable link for person text', () => {
      const result = linkedPerson('John Doe', '333');
      expect(result).toContain('John Doe');
      expect(result).toContain('https://app.productive.io/test-org-123/people/333');
      expect(result).toContain('\x1b]8;;');
    });
  });

  describe('linkedService', () => {
    it('should create clickable link for service text without deal', () => {
      const result = linkedService('Dev Service', '111');
      expect(result).toContain('Dev Service');
      expect(result).toContain('https://app.productive.io/test-org-123/services/111');
      expect(result).toContain('\x1b]8;;');
    });

    it('should create clickable link for service text with deal', () => {
      const result = linkedService('Dev Service', '111', '222');
      expect(result).toContain('Dev Service');
      expect(result).toContain(
        'https://app.productive.io/test-org-123/deals/222/budget?service=111',
      );
    });
  });
});

describe('productive-links without org ID', () => {
  beforeEach(async () => {
    setColorEnabled(true);
    const configModule = await import('../../config.js');
    vi.mocked(configModule.getConfig).mockReturnValue({ organizationId: undefined } as any);
  });

  afterEach(async () => {
    const configModule = await import('../../config.js');
    vi.mocked(configModule.getConfig).mockReturnValue({ organizationId: 'test-org-123' } as any);
  });

  it('should return empty string for projectUrl without org ID', () => {
    const url = projectUrl('456');
    expect(url).toBe('');
  });

  it('should return empty string for taskUrl without org ID', () => {
    const url = taskUrl('789');
    expect(url).toBe('');
  });

  it('should return empty string for serviceUrl without org ID', () => {
    expect(serviceUrl('111')).toBe('');
    expect(serviceUrl('111', '222')).toBe('');
  });

  it('should return empty string for timeEntriesUrl without org ID', () => {
    expect(timeEntriesUrl()).toBe('');
    expect(timeEntriesUrl('2024-01-15')).toBe('');
  });

  it('should return empty string for personUrl without org ID', () => {
    const url = personUrl('333');
    expect(url).toBe('');
  });

  it('should return empty string for budgetUrl without org ID', () => {
    const url = budgetUrl('444');
    expect(url).toBe('');
  });

  it('should return plain ID text for linkedId without org ID', () => {
    const result = linkedId('456', 'project');
    expect(result).toContain('#456');
    // Should not contain OSC 8 link since URL is empty
    expect(result).not.toContain('\x1b]8;;https');
  });

  it('should return plain text for linkedProject without org ID', () => {
    const result = linkedProject('My Project', '456');
    expect(result).toBe('My Project');
  });

  it('should return plain text for linkedTask without org ID', () => {
    const result = linkedTask('My Task', '789');
    expect(result).toBe('My Task');
  });

  it('should return plain text for linkedPerson without org ID', () => {
    const result = linkedPerson('John Doe', '333');
    expect(result).toBe('John Doe');
  });

  it('should return plain text for linkedService without org ID', () => {
    expect(linkedService('Dev Service', '111')).toBe('Dev Service');
    expect(linkedService('Dev Service', '111', '222')).toBe('Dev Service');
  });
});
