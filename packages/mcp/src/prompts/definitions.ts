/**
 * MCP Prompt Template Definitions
 *
 * Prompt templates serve as guided conversation starters that instruct the LLM
 * which productive tool calls to make and how to format the output.
 */

export interface PromptArgument {
  name: string;
  description: string;
  required: boolean;
}

export interface PromptDefinition {
  name: string;
  description: string;
  arguments: PromptArgument[];
}

export const PROMPT_DEFINITIONS: PromptDefinition[] = [
  {
    name: 'end-of-day',
    description: 'Compose an end-of-day standup message based on your activity today',
    arguments: [
      {
        name: 'format',
        description: 'Output format: slack, email, or plain (default: plain)',
        required: false,
      },
    ],
  },
  {
    name: 'project-review',
    description: 'Analyze project health and status with budget, tasks, and timeline overview',
    arguments: [
      {
        name: 'project',
        description: 'Project ID or project number (e.g. PRJ-123)',
        required: true,
      },
    ],
  },
  {
    name: 'plan-sprint',
    description: 'Help prioritize tasks for the next sprint based on open tasks and budget',
    arguments: [
      {
        name: 'project',
        description: 'Project ID or project number (e.g. PRJ-123)',
        required: true,
      },
    ],
  },
  {
    name: 'weekly-report',
    description: 'Generate a polished weekly progress report',
    arguments: [
      {
        name: 'person',
        description: 'Person email or ID to report on (default: current user)',
        required: false,
      },
      {
        name: 'format',
        description: 'Output format: slack, email, or plain (default: plain)',
        required: false,
      },
    ],
  },
  {
    name: 'invoice-prep',
    description: 'Prepare a billing summary for a project within a date range',
    arguments: [
      {
        name: 'project',
        description: 'Project ID or project number (e.g. PRJ-123)',
        required: true,
      },
      {
        name: 'from',
        description: 'Start date in YYYY-MM-DD format',
        required: true,
      },
      {
        name: 'to',
        description: 'End date in YYYY-MM-DD format',
        required: true,
      },
    ],
  },
];
