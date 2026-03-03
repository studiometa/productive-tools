/**
 * Formatter for Custom Field resources
 */

import type { JsonApiResource, FormatOptions } from './types.js';

import { CUSTOM_FIELD_DATA_TYPE } from '../constants.js';
import { DEFAULT_FORMAT_OPTIONS } from './types.js';

export interface FormattedCustomField {
  [key: string]: unknown;
  id: string;
  name: string;
  data_type: string;
  data_type_id: number;
  customizable_type: string;
  archived: boolean;
  required: boolean;
}

export interface FormattedCustomFieldOption {
  [key: string]: unknown;
  id: string;
  value: string;
  archived: boolean;
}

/**
 * Format a custom field definition for output.
 */
export function formatCustomField(
  field: JsonApiResource,
  options: FormatOptions = {},
): FormattedCustomField {
  const opts = { ...DEFAULT_FORMAT_OPTIONS, ...options };
  const attrs = field.attributes;

  const dataTypeId = (attrs.data_type as number) ?? 0;

  const result: FormattedCustomField = {
    id: field.id,
    name: (attrs.name as string) || '',
    data_type: CUSTOM_FIELD_DATA_TYPE.fromValue(dataTypeId),
    data_type_id: dataTypeId,
    customizable_type: (attrs.customizable_type as string) || '',
    archived: (attrs.archived as boolean) || false,
    required: (attrs.required as boolean) || false,
  };

  if (attrs.description) {
    result.description = attrs.description as string;
  }

  if (attrs.default_value !== undefined && attrs.default_value !== null) {
    result.default_value = attrs.default_value;
  }

  // Resolve options from included resources (when include=options was used)
  if (opts.included) {
    const options = opts.included.filter(
      (r) =>
        r.type === 'custom_field_options' && r.relationships?.custom_field?.data?.id === field.id,
    );
    if (options.length > 0) {
      result.options = options.map((opt) => formatCustomFieldOption(opt));
    }
  }

  if (opts.includeTimestamps) {
    result.created_at = attrs.created_at as string | undefined;
    result.updated_at = attrs.updated_at as string | undefined;
  }

  return result;
}

/**
 * Format a custom field option for output.
 */
export function formatCustomFieldOption(option: JsonApiResource): FormattedCustomFieldOption {
  const attrs = option.attributes;

  const result: FormattedCustomFieldOption = {
    id: option.id,
    value: (attrs.value as string) || '',
    archived: (attrs.archived as boolean) || false,
  };

  if (attrs.color) {
    result.color = attrs.color as string;
  }

  if (attrs.position !== undefined) {
    result.position = attrs.position as number;
  }

  return result;
}
