import type {
  ProductiveTask,
  ProductiveProject,
  ProductiveTimeEntry,
  ProductivePerson,
  ProductiveCompany,
  ProductiveDeal,
  ProductiveService,
  ProductiveComment,
  ProductiveTimer,
  ProductiveDiscussion,
  ProductiveBooking,
  ProductivePage,
  ProductiveAttachment,
  ProductiveActivity,
  RelationshipData,
} from '@studiometa/productive-api';

/**
 * A reference to a related resource, resolved from JSON:API included data.
 * Returns `null` when the relationship exists but the resource wasn't found in includes.
 * Marked optional (`?`) on resource types because it depends on the `include` parameter.
 */
export interface ResourceRef {
  id: string;
  type: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Utility: Flatten a JSON:API resource into a flat object
// ---------------------------------------------------------------------------

/**
 * Picks `id` and `type` from T, spreads T['attributes'], and converts
 * each key in T['relationships'] to `ResourceRef | null` (optional).
 */
type FlattenResource<T extends { id: string; type: string; attributes: object }> = {
  id: T['id'];
  type: T['type'];
} & T['attributes'] &
  (T extends { relationships?: infer R }
    ? { [K in keyof R]?: R[K] extends RelationshipData | undefined ? ResourceRef | null : never }
    : unknown);

// ---------------------------------------------------------------------------
// Flattened SDK types — derived from productive-api types
// ---------------------------------------------------------------------------

export type Task = FlattenResource<ProductiveTask>;
export type Project = FlattenResource<ProductiveProject>;
export type TimeEntry = FlattenResource<ProductiveTimeEntry>;
export type Person = FlattenResource<ProductivePerson>;
export type Company = FlattenResource<ProductiveCompany>;
export type Deal = FlattenResource<ProductiveDeal>;
export type Service = FlattenResource<ProductiveService>;
export type Comment = FlattenResource<ProductiveComment>;
export type Timer = FlattenResource<ProductiveTimer>;
export type Discussion = FlattenResource<ProductiveDiscussion>;
export type Booking = FlattenResource<ProductiveBooking>;
export type Page = FlattenResource<ProductivePage>;
export type Attachment = FlattenResource<ProductiveAttachment>;
export type Activity = FlattenResource<ProductiveActivity>;
