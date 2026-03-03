/**
 * Resolve raw custom field values to human-readable names.
 *
 * Transforms `{ "42236": "417421" }` → `{ "Semaine": "2026-09 (23 février-01 mars)" }`
 *
 * For select/multi-select fields, values are option IDs that need resolution
 * via the custom field options. For text/number/date fields, values are used as-is.
 */

import type {
  ProductiveCustomField,
  ProductiveCustomFieldOption,
} from '@studiometa/productive-api';

import { CUSTOM_FIELD_DATA_TYPE } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';

/** Data types that require option resolution */
const OPTION_DATA_TYPES: Set<number> = new Set([
  CUSTOM_FIELD_DATA_TYPE.SELECT,
  CUSTOM_FIELD_DATA_TYPE.MULTI_SELECT,
]);

export interface ResolvedCustomFields {
  /** Resolved fields: { "Field Name": "Resolved Value" } */
  resolved: Record<string, unknown>;
  /** Raw fields for reference: { "field_id": "raw_value" } */
  raw: Record<string, unknown>;
}

/**
 * Resolve raw custom field values to human-readable names.
 *
 * @param rawHash - The raw custom_fields hash from the API (e.g. { "42236": "417421" })
 * @param customizableType - The resource type (e.g. 'Task', 'Deal', 'Company')
 * @param ctx - Executor context with API access
 * @returns Resolved custom fields with human-readable names and values
 */
export async function resolveCustomFieldValues(
  rawHash: Record<string, unknown>,
  customizableType: string,
  ctx: ExecutorContext,
): Promise<ResolvedCustomFields> {
  if (!rawHash || Object.keys(rawHash).length === 0) {
    return { resolved: {}, raw: rawHash || {} };
  }

  // Fetch all custom field definitions for this type
  const definitionsResponse = await ctx.api.getCustomFields({
    perPage: 200,
    filter: { customizable_type: customizableType },
  });

  // Build a lookup map: field ID → definition
  const definitionsMap = new Map<string, ProductiveCustomField>();
  for (const def of definitionsResponse.data) {
    definitionsMap.set(def.id, def);
  }

  // Collect option IDs that need resolution (for select/multi-select fields)
  const optionIdsToResolve = new Set<string>();
  for (const [fieldId, value] of Object.entries(rawHash)) {
    const def = definitionsMap.get(fieldId);
    if (def && OPTION_DATA_TYPES.has(def.attributes.data_type)) {
      if (typeof value === 'string') {
        optionIdsToResolve.add(value);
      } else if (Array.isArray(value)) {
        for (const v of value) {
          if (typeof v === 'string') optionIdsToResolve.add(v);
        }
      }
    }
  }

  // Fetch options if any need resolution
  const optionsMap = new Map<string, ProductiveCustomFieldOption>();
  if (optionIdsToResolve.size > 0) {
    const optionsResponse = await ctx.api.getCustomFieldOptions({
      perPage: 200,
      filter: { id: [...optionIdsToResolve].join(',') },
    });
    for (const opt of optionsResponse.data) {
      optionsMap.set(opt.id, opt);
    }
  }

  // Build resolved hash
  const resolved: Record<string, unknown> = {};
  for (const [fieldId, value] of Object.entries(rawHash)) {
    const def = definitionsMap.get(fieldId);
    const fieldName = def?.attributes.name ?? fieldId;

    if (def && OPTION_DATA_TYPES.has(def.attributes.data_type)) {
      // Select/multi-select: resolve option IDs to values
      if (typeof value === 'string') {
        const opt = optionsMap.get(value);
        resolved[fieldName] = opt?.attributes.value ?? value;
      } else if (Array.isArray(value)) {
        resolved[fieldName] = value.map((v) => {
          if (typeof v === 'string') {
            const opt = optionsMap.get(v);
            return opt?.attributes.value ?? v;
          }
          return v;
        });
      } else {
        resolved[fieldName] = value;
      }
    } else {
      // Text, number, date, person, attachment: pass through
      resolved[fieldName] = value;
    }
  }

  return { resolved, raw: rawHash };
}
