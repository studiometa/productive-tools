/**
 * Extract a field value from data using dot notation path.
 *
 * @param data - The data object to extract from
 * @param fieldPath - Dot-notation path (e.g., 'id', 'attributes.title', 'relationships.project.data.id')
 * @returns The extracted value, or undefined if not found
 */
export function extractField(data: unknown, fieldPath: string): unknown {
  if (!fieldPath) {
    return undefined;
  }

  const parts = fieldPath.split('.');
  let current = data;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Format extracted value for output.
 * Handles primitives and basic objects/arrays.
 *
 * @param value - The extracted value
 * @returns String representation suitable for console output
 */
export function formatExtractedValue(value: unknown): string {
  if (value === null) {
    return 'null';
  }

  if (value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}
