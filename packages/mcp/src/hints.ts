/**
 * Contextual hints for AI agents
 *
 * Provides suggestions for related resources and common actions
 * to help agents discover how to fetch additional context.
 */

export interface ResourceHint {
  resource: string;
  description: string;
  example: Record<string, unknown>;
}

export interface ActionHint {
  action: string;
  example: Record<string, unknown>;
}

export interface ContextualHints {
  related_resources?: ResourceHint[];
  common_actions?: ActionHint[];
}

/**
 * Generate hints for a task
 */
export function getTaskHints(taskId: string, serviceId?: string): ContextualHints {
  const hints: ContextualHints = {
    related_resources: [
      {
        resource: 'comments',
        description: 'Get comments on this task',
        example: {
          resource: 'comments',
          action: 'list',
          filter: { task_id: taskId },
        },
      },
      {
        resource: 'time',
        description: 'Get time entries logged on this task',
        example: {
          resource: 'time',
          action: 'list',
          filter: { task_id: taskId },
        },
      },
      {
        resource: 'tasks',
        description: 'Get subtasks of this task',
        example: {
          resource: 'tasks',
          action: 'list',
          filter: { parent_task_id: taskId },
        },
      },
    ],
    common_actions: [
      {
        action: 'Add a comment',
        example: {
          resource: 'comments',
          action: 'create',
          task_id: taskId,
          body: '<your comment>',
        },
      },
    ],
  };

  // Add time logging hint if we have a service ID
  if (serviceId) {
    hints.common_actions!.push({
      action: 'Log time on this task',
      example: {
        resource: 'time',
        action: 'create',
        service_id: serviceId,
        task_id: taskId,
        date: new Date().toISOString().split('T')[0],
        time: 60,
        note: '<description of work>',
      },
    });
  }

  return hints;
}

/**
 * Generate hints for a project
 */
export function getProjectHints(projectId: string): ContextualHints {
  return {
    related_resources: [
      {
        resource: 'tasks',
        description: 'Get tasks in this project',
        example: {
          resource: 'tasks',
          action: 'list',
          filter: { project_id: projectId },
        },
      },
      {
        resource: 'services',
        description: 'Get services (budget lines) for this project',
        example: {
          resource: 'services',
          action: 'list',
          filter: { project_id: projectId },
        },
      },
      {
        resource: 'time',
        description: 'Get time entries for this project',
        example: {
          resource: 'time',
          action: 'list',
          filter: { project_id: projectId },
        },
      },
      {
        resource: 'comments',
        description: 'Get comments on this project',
        example: {
          resource: 'comments',
          action: 'list',
          filter: { project_id: projectId },
        },
      },
      {
        resource: 'deals',
        description: 'Get deals/budgets for this project',
        example: {
          resource: 'deals',
          action: 'list',
          filter: { project_id: projectId },
        },
      },
    ],
    common_actions: [
      {
        action: 'Create a task',
        example: {
          resource: 'tasks',
          action: 'create',
          project_id: projectId,
          task_list_id: '<task_list_id>',
          title: '<task title>',
        },
      },
    ],
  };
}

/**
 * Generate hints for a deal/budget
 */
export function getDealHints(dealId: string): ContextualHints {
  return {
    related_resources: [
      {
        resource: 'comments',
        description: 'Get comments on this deal/budget',
        example: {
          resource: 'comments',
          action: 'list',
          filter: { deal_id: dealId },
        },
      },
      {
        resource: 'services',
        description: 'Get services (budget lines) for this deal',
        example: {
          resource: 'services',
          action: 'list',
          filter: { deal_id: dealId },
        },
      },
      {
        resource: 'time',
        description: 'Get time entries for this deal/budget',
        example: {
          resource: 'time',
          action: 'list',
          filter: { deal_id: dealId },
        },
      },
      {
        resource: 'bookings',
        description: 'Get resource bookings for this deal',
        example: {
          resource: 'bookings',
          action: 'list',
          filter: { deal_id: dealId },
        },
      },
    ],
    common_actions: [
      {
        action: 'Add a comment',
        example: {
          resource: 'comments',
          action: 'create',
          deal_id: dealId,
          body: '<your comment>',
        },
      },
    ],
  };
}

/**
 * Generate hints for a budget
 */
export function getBudgetHints(budgetId: string): ContextualHints {
  return {
    related_resources: [
      {
        resource: 'services',
        description: 'Get services (budget lines) for this budget',
        example: {
          resource: 'services',
          action: 'list',
          filter: { budget_id: budgetId },
        },
      },
      {
        resource: 'time',
        description: 'Get time entries for this budget',
        example: {
          resource: 'time',
          action: 'list',
          filter: { budget_id: budgetId },
        },
      },
      {
        resource: 'bookings',
        description: 'Get bookings for this budget',
        example: {
          resource: 'bookings',
          action: 'list',
          filter: { budget_id: budgetId },
        },
      },
    ],
  };
}

/**
 * Generate hints for a person
 */
export function getPersonHints(personId: string): ContextualHints {
  return {
    related_resources: [
      {
        resource: 'tasks',
        description: 'Get tasks assigned to this person',
        example: {
          resource: 'tasks',
          action: 'list',
          filter: { assignee_id: personId },
        },
      },
      {
        resource: 'time',
        description: 'Get time entries by this person',
        example: {
          resource: 'time',
          action: 'list',
          filter: { person_id: personId },
        },
      },
      {
        resource: 'bookings',
        description: 'Get bookings for this person',
        example: {
          resource: 'bookings',
          action: 'list',
          filter: { person_id: personId },
        },
      },
      {
        resource: 'timers',
        description: 'Get active timers for this person',
        example: {
          resource: 'timers',
          action: 'list',
          filter: { person_id: personId },
        },
      },
    ],
  };
}

/**
 * Generate hints for a service
 */
export function getServiceHints(serviceId: string): ContextualHints {
  return {
    related_resources: [
      {
        resource: 'time',
        description: 'Get time entries for this service',
        example: {
          resource: 'time',
          action: 'list',
          filter: { service_id: serviceId },
        },
      },
      {
        resource: 'tasks',
        description: 'Get tasks linked to this service',
        example: {
          resource: 'tasks',
          action: 'list',
          filter: { service_id: serviceId },
        },
      },
      {
        resource: 'bookings',
        description: 'Get bookings for this service',
        example: {
          resource: 'bookings',
          action: 'list',
          filter: { service_id: serviceId },
        },
      },
    ],
    common_actions: [
      {
        action: 'Log time on this service',
        example: {
          resource: 'time',
          action: 'create',
          service_id: serviceId,
          date: new Date().toISOString().split('T')[0],
          time: 60,
          note: '<description of work>',
        },
      },
      {
        action: 'Start a timer',
        example: {
          resource: 'timers',
          action: 'start',
          service_id: serviceId,
        },
      },
    ],
  };
}

/**
 * Generate hints for a company
 */
export function getCompanyHints(companyId: string): ContextualHints {
  return {
    related_resources: [
      {
        resource: 'projects',
        description: 'Get projects for this company',
        example: {
          resource: 'projects',
          action: 'list',
          filter: { company_id: companyId },
        },
      },
      {
        resource: 'deals',
        description: 'Get deals for this company',
        example: {
          resource: 'deals',
          action: 'list',
          filter: { company_id: companyId },
        },
      },
      {
        resource: 'tasks',
        description: 'Get tasks for this company',
        example: {
          resource: 'tasks',
          action: 'list',
          filter: { company_id: companyId },
        },
      },
      {
        resource: 'people',
        description: 'Get contacts at this company',
        example: {
          resource: 'people',
          action: 'list',
          filter: { company_id: companyId },
        },
      },
    ],
  };
}

/**
 * Generate hints for a time entry
 */
export function getTimeEntryHints(
  timeEntryId: string,
  taskId?: string,
  serviceId?: string,
): ContextualHints {
  const hints: ContextualHints = {
    related_resources: [],
    common_actions: [
      {
        action: 'Update this time entry',
        example: {
          resource: 'time',
          action: 'update',
          id: timeEntryId,
          time: 120,
          note: '<updated note>',
        },
      },
    ],
  };

  if (taskId) {
    hints.related_resources!.push({
      resource: 'tasks',
      description: 'Get the associated task',
      example: {
        resource: 'tasks',
        action: 'get',
        id: taskId,
      },
    });
  }

  if (serviceId) {
    hints.related_resources!.push({
      resource: 'services',
      description: 'Get the associated service',
      example: {
        resource: 'services',
        action: 'get',
        id: serviceId,
      },
    });
  }

  return hints;
}

/**
 * Generate hints for a comment
 */
export function getCommentHints(
  _commentId: string,
  commentableType?: string,
  commentableId?: string,
): ContextualHints {
  const hints: ContextualHints = {
    related_resources: [],
  };

  if (commentableType && commentableId) {
    const resourceMap: Record<string, string> = {
      task: 'tasks',
      deal: 'deals',
      project: 'projects',
      company: 'companies',
    };

    const resource = resourceMap[commentableType];
    if (resource) {
      hints.related_resources!.push({
        resource,
        description: `Get the ${commentableType} this comment is on`,
        example: {
          resource,
          action: 'get',
          id: commentableId,
        },
      });
    }
  }

  return hints;
}

/**
 * Generate hints for an attachment
 */
export function getAttachmentHints(
  _attachmentId: string,
  attachableType?: string,
): ContextualHints {
  const hints: ContextualHints = {
    related_resources: [],
    common_actions: [
      {
        action: 'Delete this attachment',
        example: {
          resource: 'attachments',
          action: 'delete',
          id: _attachmentId,
        },
      },
    ],
  };

  if (attachableType) {
    const resourceMap: Record<string, string> = {
      Task: 'tasks',
      Comment: 'comments',
      Deal: 'deals',
      Page: 'projects',
    };

    const resource = resourceMap[attachableType];
    if (resource) {
      hints.related_resources!.push({
        resource,
        description: `View the ${attachableType.toLowerCase()} this attachment belongs to`,
        example: {
          resource,
          action: 'list',
        },
      });
    }
  }

  return hints;
}

/**
 * Generate hints for a booking
 */
export function getBookingHints(bookingId: string, personId?: string): ContextualHints {
  const hints: ContextualHints = {
    related_resources: [],
    common_actions: [
      {
        action: 'Update this booking',
        example: {
          resource: 'bookings',
          action: 'update',
          id: bookingId,
          time: 480,
        },
      },
    ],
  };

  if (personId) {
    hints.related_resources!.push({
      resource: 'people',
      description: 'Get the person this booking is for',
      example: {
        resource: 'people',
        action: 'get',
        id: personId,
      },
    });
  }

  return hints;
}

/**
 * Generate hints for a timer
 */
export function getTimerHints(timerId: string, serviceId?: string): ContextualHints {
  const hints: ContextualHints = {
    common_actions: [
      {
        action: 'Stop this timer',
        example: {
          resource: 'timers',
          action: 'stop',
          id: timerId,
        },
      },
    ],
    related_resources: [],
  };

  if (serviceId) {
    hints.related_resources!.push({
      resource: 'services',
      description: 'Get the service this timer is running on',
      example: {
        resource: 'services',
        action: 'get',
        id: serviceId,
      },
    });
  }

  return hints;
}
