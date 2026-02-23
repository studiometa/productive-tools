/**
 * MCP Prompt Template Handlers
 *
 * Returns messages arrays that instruct the LLM which productive tool calls to
 * make and how to format and present the output to the user.
 */

type PromptMessage = {
  role: string;
  content: { type: string; text: string };
};

type PromptResult = {
  messages: PromptMessage[];
};

/**
 * Build the end-of-day standup prompt messages
 */
function endOfDay(args?: Record<string, string>): PromptResult {
  const format = args?.format ?? 'plain';

  const formatInstruction =
    format === 'slack'
      ? 'Format the output as a Slack message using emoji bullets and bold text with *asterisks*.'
      : format === 'email'
        ? 'Format the output as a professional email with a subject line and proper greeting/closing.'
        : 'Format the output as a plain-text standup message with clear sections.';

  return {
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Please compose my end-of-day standup message.

First, call the productive tool to gather today's activity:
\`\`\`json
{ "resource": "summaries", "action": "my_day" }
\`\`\`

Then compose a standup message with these sections:
- **What I did today**: Summarize completed tasks and logged time by project
- **What I'm working on tomorrow**: Any open/in-progress tasks from today
- **Blockers**: Note any overdue tasks or items needing attention

${formatInstruction}

Keep it concise — this is for a standup, not a novel.`,
        },
      },
    ],
  };
}

/**
 * Build the project-review prompt messages
 */
function projectReview(args?: Record<string, string>): PromptResult {
  const project = args?.project ?? '';

  return {
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Please analyze the health and status of project ${project ? `"${project}"` : '(project not specified)'}.

Fetch all project context in one call:
\`\`\`json
{ "resource": "projects", "action": "context", "id": "${project}" }
\`\`\`

Also check the project's tasks for a fuller picture:
\`\`\`json
{ "resource": "tasks", "action": "list", "filter": { "project_id": "${project}", "status": 1 }, "per_page": 50 }
\`\`\`

Then provide a structured project health review covering:
1. **Overview**: Project name, client, current status
2. **Budget**: Budget used vs total, burn rate, projected overage risk
3. **Tasks**: Open vs completed task counts, overdue tasks, upcoming deadlines
4. **Recent activity**: What has been worked on recently
5. **Health assessment**: Overall RAG status (🟢 On track / 🟡 At risk / 🔴 Critical) with reasoning
6. **Recommendations**: Concrete next steps or concerns to address`,
        },
      },
    ],
  };
}

/**
 * Build the plan-sprint prompt messages
 */
function planSprint(args?: Record<string, string>): PromptResult {
  const project = args?.project ?? '';

  return {
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Please help me plan the next sprint for project ${project ? `"${project}"` : '(project not specified)'}.

Fetch all open tasks for the project:
\`\`\`json
{ "resource": "tasks", "action": "list", "filter": { "project_id": "${project}", "status": 1 }, "per_page": 100 }
\`\`\`

Fetch the project's budget services to understand available capacity:
\`\`\`json
{ "resource": "services", "action": "list", "filter": { "project_id": "${project}" }, "per_page": 50 }
\`\`\`

Then provide sprint planning recommendations:
1. **Backlog summary**: Total open tasks, categories/task-lists breakdown
2. **Priority candidates**: Top tasks to tackle next sprint based on:
   - Due dates and overdue items
   - Task dependencies (if visible)
   - Effort estimates
3. **Budget check**: Remaining budget per service — flag if any service is near its limit
4. **Suggested sprint scope**: A realistic list of tasks for a 1-2 week sprint
5. **Risks**: Tasks that are blocked, unassigned, or missing estimates`,
        },
      },
    ],
  };
}

/**
 * Build the weekly-report prompt messages
 */
function weeklyReport(args?: Record<string, string>): PromptResult {
  const person = args?.person;
  const format = args?.format ?? 'plain';

  const personInstruction = person
    ? `Focus on person "${person}". Resolve the person ID if needed using: { "resource": "people", "action": "resolve", "query": "${person}" } first.`
    : 'Focus on the current authenticated user (use the default person from summaries).';

  const formatInstruction =
    format === 'slack'
      ? 'Format as a Slack message with emoji bullets, bold project names, and a summary header.'
      : format === 'email'
        ? 'Format as a professional email with subject line, greeting, bulleted highlights per project, and a closing.'
        : 'Format as a clean plain-text weekly report with clear section headers.';

  const standupCall = person
    ? `First resolve the person ID, then fetch weekly standup data:
\`\`\`json
{ "resource": "people", "action": "resolve", "query": "${person}" }
\`\`\`
\`\`\`json
{ "resource": "workflows", "action": "weekly_standup", "person_id": "<resolved_person_id>" }
\`\`\``
    : `Fetch weekly standup data:
\`\`\`json
{ "resource": "workflows", "action": "weekly_standup" }
\`\`\``;

  return {
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Please generate a weekly progress report.

${personInstruction}

${standupCall}

Then compose a polished weekly report with:
1. **This week's accomplishments**: Completed tasks grouped by project
2. **Time logged**: Hours per project this week, total hours
3. **In progress**: Tasks still open that were worked on
4. **Upcoming**: Any tasks with deadlines in the next 7 days
5. **Highlights**: Notable wins or milestones reached

${formatInstruction}`,
        },
      },
    ],
  };
}

/**
 * Build the invoice-prep prompt messages
 */
function invoicePrep(args?: Record<string, string>): PromptResult {
  const project = args?.project ?? '';
  const from = args?.from ?? '';
  const to = args?.to ?? '';

  return {
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Please prepare a billing summary for project ${project ? `"${project}"` : '(project not specified)'} from ${from || '(start date not specified)'} to ${to || '(end date not specified)'}.

Fetch time entries for the date range:
\`\`\`json
{
  "resource": "time",
  "action": "list",
  "filter": {
    "project_id": "${project}",
    "after": "${from}",
    "before": "${to}"
  },
  "include": ["person", "service"],
  "per_page": 200
}
\`\`\`

Fetch project services/budget lines:
\`\`\`json
{ "resource": "services", "action": "list", "filter": { "project_id": "${project}" }, "per_page": 50 }
\`\`\`

Fetch the project deal/budget details:
\`\`\`json
{ "resource": "deals", "action": "list", "filter": { "project_id": "${project}", "type": 2 }, "per_page": 10 }
\`\`\`

Then produce a billing summary:
1. **Period**: ${from} → ${to}
2. **Time entries by service**: Hours logged per service/budget line with team member breakdown
3. **Billable totals**: If rates are available, calculate amounts per service
4. **Budget consumed**: Planned vs actual hours per service
5. **Invoice line items**: Suggested line items ready to copy into an invoice
6. **Notes**: Any unbilled items, write-offs, or adjustments to flag`,
        },
      },
    ],
  };
}

/**
 * Get messages for a named prompt template
 */
export function getPromptMessages(name: string, args?: Record<string, string>): PromptResult {
  switch (name) {
    case 'end-of-day':
      return endOfDay(args);
    case 'project-review':
      return projectReview(args);
    case 'plan-sprint':
      return planSprint(args);
    case 'weekly-report':
      return weeklyReport(args);
    case 'invoice-prep':
      return invoicePrep(args);
    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
}
