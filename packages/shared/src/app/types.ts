import type { DefaultSession } from "next-auth";

import type { UserRole } from "./enums";

export type SlackUserMeta = Record<string, unknown>;

export type SlackSpacesMeta = Record<string, unknown>;

export type UserMeta = Record<string, unknown>;

export type EventMeta = {
  eventTypeId?: number;
  mapSeed?: boolean;
} & Record<string, unknown>;

export type LocationMeta = {
  latLonKey?: string;
  mapSeed?: boolean;
} & Record<string, unknown>;

export type OrgMeta = {
  latLonKey?: string;
  mapSeed?: boolean;
  firstEventNotificationSent?: boolean;
  region_location_short_description?: string;
} & Record<string, unknown>;

// The original/new id fields an update request carries as `meta` when it
// doesn't have a dedicated DB column. Both the writer (buildMeta in
// packages/api/src/lib/update-request-handlers.ts) and the reader (the map's
// MetaOverridesSchema in apps/map/src/utils/open-request-modal.ts) derive
// from this single list so they can't drift apart again.
export const PRESERVED_META_FIELDS = [
  "originalRegionId",
  "originalAoId",
  "originalLocationId",
  "originalEventId",
  "newRegionId",
  "newAoId",
  "newLocationId",
] as const;

export type PreservedMetaField = (typeof PRESERVED_META_FIELDS)[number];

export type UpdateRequestMeta = Partial<Record<PreservedMetaField, number>> &
  Record<string, unknown>;

export type AttendanceMeta = Record<string, unknown>;

export interface ApiKeyInfo {
  id: number;
  key: string;
  ownerId: number | null;
  revokedAt: string | null;
  expiresAt: string | null;
  orgIds: number[] | null;
}

export interface OrgRole {
  orgId: number;
  orgName: string;
  roleName: UserRole;
}

declare module "next-auth" {
  interface Session extends DefaultSession {
    id: number;
    email: string | undefined;
    roles?: OrgRole[];
    apiKey?: ApiKeyInfo;
  }
}

export type AchievementAwardMeta = Record<string, unknown>;
