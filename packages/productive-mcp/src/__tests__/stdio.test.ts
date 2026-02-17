import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the CLI config
const mockGetConfig = vi.fn();
const mockSetConfig = vi.fn();

vi.mock('@studiometa/productive-api', () => ({
  getConfig: () => mockGetConfig(),
  setConfig: (key: string, value: string) => mockSetConfig(key, value),
}));

// Mock the handlers
vi.mock('../handlers.js', () => ({
  executeToolWithCredentials: vi.fn().mockImplementation((name, args, creds) => {
    return Promise.resolve({
      content: [{ type: 'text', text: JSON.stringify({ tool: name, args, creds }) }],
    });
  }),
}));

import { executeToolWithCredentials } from '../handlers.js';
import {
  getAvailableTools,
  getAvailablePrompts,
  handleSetupPrompt,
  handleConfigureTool,
  handleGetConfigTool,
  handleToolCall,
  handlePrompt,
} from '../stdio.js';

describe('stdio handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConfig.mockResolvedValue({});
    mockSetConfig.mockResolvedValue(undefined);
  });

  describe('getAvailableTools', () => {
    it('should return all tools including stdio-only tools', () => {
      const tools = getAvailableTools();

      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);

      // Should include single consolidated tool
      const productive = tools.find((t) => t.name === 'productive');
      expect(productive).toBeDefined();

      // Should include stdio-only tools
      const configure = tools.find((t) => t.name === 'productive_configure');
      expect(configure).toBeDefined();

      const getConfig = tools.find((t) => t.name === 'productive_get_config');
      expect(getConfig).toBeDefined();
    });

    it('should have 3 total tools (1 main + 2 stdio-only)', () => {
      const tools = getAvailableTools();
      expect(tools.length).toBe(3);
    });
  });

  describe('getAvailablePrompts', () => {
    it('should return setup prompt', () => {
      const prompts = getAvailablePrompts();

      expect(Array.isArray(prompts)).toBe(true);
      expect(prompts.length).toBe(1);
      expect(prompts[0].name).toBe('setup_productive');
      expect(prompts[0].description).toContain('setup');
    });
  });

  describe('handleSetupPrompt', () => {
    it('should return setup message when not configured', async () => {
      mockGetConfig.mockResolvedValue({});

      const result = await handleSetupPrompt();

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[0].content.type).toBe('text');
      expect(result.messages[0].content.text).toContain('configure');
      expect(result.messages[0].content.text).toContain('Organization ID');
    });

    it('should return update message when already configured', async () => {
      mockGetConfig.mockResolvedValue({
        organizationId: 'test-org',
        apiToken: 'test-token',
      });

      const result = await handleSetupPrompt();

      expect(result.messages[0].content.text).toContain('already configured');
      expect(result.messages[0].content.text).toContain('update');
    });
  });

  describe('handleConfigureTool', () => {
    it('should save all credentials', async () => {
      const result = await handleConfigureTool({
        organizationId: 'new-org',
        apiToken: 'new-token',
        userId: 'new-user',
      });

      expect(mockSetConfig).toHaveBeenCalledWith('organizationId', 'new-org');
      expect(mockSetConfig).toHaveBeenCalledWith('apiToken', 'new-token');
      expect(mockSetConfig).toHaveBeenCalledWith('userId', 'new-user');

      expect(result.content[0].type).toBe('text');
      const response = JSON.parse(result.content[0].text as string);
      expect(response.success).toBe(true);
      expect(response.configured.organizationId).toBe('new-org');
      expect(response.configured.apiToken).toBe('***oken'); // Masked
    });

    it('should work without userId', async () => {
      const result = await handleConfigureTool({
        organizationId: 'new-org',
        apiToken: 'new-token',
      });

      expect(mockSetConfig).toHaveBeenCalledTimes(2);
      expect(mockSetConfig).not.toHaveBeenCalledWith('userId', expect.anything());

      const response = JSON.parse(result.content[0].text as string);
      expect(response.configured.userId).toBe('not set');
    });
  });

  describe('handleGetConfigTool', () => {
    it('should return current config with masked token', async () => {
      mockGetConfig.mockResolvedValue({
        organizationId: 'test-org',
        apiToken: 'super-secret-token',
        userId: 'test-user',
      });

      const result = await handleGetConfigTool();

      const response = JSON.parse(result.content[0].text as string);
      expect(response.organizationId).toBe('test-org');
      expect(response.userId).toBe('test-user');
      expect(response.apiToken).toBe('***oken'); // Masked
      expect(response.configured).toBe(true);
    });

    it('should handle missing config', async () => {
      mockGetConfig.mockResolvedValue({});

      const result = await handleGetConfigTool();

      const response = JSON.parse(result.content[0].text as string);
      expect(response.organizationId).toBe('not configured');
      expect(response.userId).toBe('not configured');
      expect(response.apiToken).toBe('not configured');
      expect(response.configured).toBe(false);
    });

    it('should handle partial config', async () => {
      mockGetConfig.mockResolvedValue({
        organizationId: 'test-org',
      });

      const result = await handleGetConfigTool();

      const response = JSON.parse(result.content[0].text as string);
      expect(response.organizationId).toBe('test-org');
      expect(response.apiToken).toBe('not configured');
      expect(response.configured).toBe(false);
    });
  });

  describe('handleToolCall', () => {
    it('should handle productive_configure tool', async () => {
      const result = await handleToolCall('productive_configure', {
        organizationId: 'org',
        apiToken: 'token',
      });

      expect(mockSetConfig).toHaveBeenCalled();
      const response = JSON.parse(result.content[0].text as string);
      expect(response.success).toBe(true);
    });

    it('should handle productive_get_config tool', async () => {
      mockGetConfig.mockResolvedValue({ organizationId: 'test' });

      const result = await handleToolCall('productive_get_config', {});

      expect(mockGetConfig).toHaveBeenCalled();
      const response = JSON.parse(result.content[0].text as string);
      expect(response.organizationId).toBe('test');
    });

    it('should return error when credentials not configured', async () => {
      mockGetConfig.mockResolvedValue({});

      const result = await handleToolCall('productive_list_projects', {});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('not configured');
    });

    it('should execute API tools with credentials', async () => {
      mockGetConfig.mockResolvedValue({
        organizationId: 'test-org',
        apiToken: 'test-token',
        userId: 'test-user',
      });

      await handleToolCall('productive', { resource: 'projects', action: 'list', page: 1 });

      expect(executeToolWithCredentials).toHaveBeenCalledWith(
        'productive',
        { resource: 'projects', action: 'list', page: 1 },
        {
          organizationId: 'test-org',
          apiToken: 'test-token',
          userId: 'test-user',
        },
      );
    });
  });

  describe('handlePrompt', () => {
    it('should handle setup_productive prompt', async () => {
      mockGetConfig.mockResolvedValue({});

      const result = await handlePrompt('setup_productive');

      expect(result.messages).toBeDefined();
      expect(result.messages.length).toBeGreaterThan(0);
    });

    it('should throw for unknown prompt', async () => {
      await expect(handlePrompt('unknown_prompt')).rejects.toThrow('Unknown prompt');
    });
  });
});
