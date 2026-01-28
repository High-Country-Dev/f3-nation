import { ORPCError } from "@orpc/server";
import type { SQL } from "drizzle-orm";
import { z } from "zod";

import {
  aliasedTable,
  and,
  countDistinct,
  eq,
  ilike,
  inArray,
  or,
  schema,
  sql,
} from "@acme/db";
import type { AppDb } from "@acme/db/client";
import { EventCategory, IsActiveStatus } from "@acme/shared/app/enums";
import { arrayOrSingle } from "@acme/shared/app/functions";
import { EventInsertSchema } from "@acme/validators";

import { checkHasRoleOnOrg } from "../check-has-role-on-org";
import { getDescendantOrgIds } from "../get-descendant-org-ids";
import { getEditableOrgIdsForUser } from "../get-editable-org-ids";
import { emitWebhookEvent } from "../lib/webhook-events";
import type { Context } from "../shared";
import { editorProcedure, protectedProcedure } from "../shared";

// Shared filter schema for events (used by both `all` and `count` endpoints)
const eventFilterSchema = z.object({
  searchTerm: z.string().optional(),
  statuses: arrayOrSingle(z.enum(["active", "inactive"])).optional(),
  eventTypeNames: arrayOrSingle(z.string())
    .optional()
    .describe(
      "Filter events by event type name(s). Matches events with ANY of the given type names.",
    ),
  eventCategories: arrayOrSingle(z.enum(EventCategory))
    .optional()
    .describe(
      "Filter events by event category(ies). Matches events with ANY of the given categories.",
    ),
  regionIds: arrayOrSingle(z.coerce.number()).optional(),
  aoIds: arrayOrSingle(z.coerce.number()).optional(),
  onlyMine: z.coerce.boolean().optional(),
});

type EventFilterInput = z.infer<typeof eventFilterSchema>;

// Aliased tables used across event queries
const regionOrg = aliasedTable(schema.orgs, "region_org");
const parentOrg = aliasedTable(schema.orgs, "parent_org");

/**
 * Resolves editable org IDs for "onlyMine" filter
 * Returns empty result indicator if user has no access
 */
async function resolveEditableOrgIds(params: {
  ctx: Context;
  onlyMine?: boolean;
}): Promise<{ editableOrgIds: number[]; isNationAdmin: boolean } | null> {
  const { ctx, onlyMine } = params;

  if (!onlyMine) {
    return { editableOrgIds: [], isNationAdmin: false };
  }

  const result = await getEditableOrgIdsForUser(ctx);
  const { editableOrgs, isNationAdmin } = result;

  if (!isNationAdmin && editableOrgs.length > 0) {
    const editableOrgIdsList = editableOrgs.map((org) => org.id);
    const editableOrgIds = await getDescendantOrgIds(
      ctx.db,
      editableOrgIdsList,
    );
    return { editableOrgIds, isNationAdmin };
  }

  // If user has no editable orgs and is not a nation admin, return null to indicate empty result
  if (editableOrgs.length === 0 && !isNationAdmin) {
    return null;
  }

  return { editableOrgIds: [], isNationAdmin };
}

/**
 * Builds the WHERE clause for event queries based on filter input
 */
function buildEventWhereClause(params: {
  input?: EventFilterInput;
  editableOrgIds: number[];
  isNationAdmin: boolean;
}): SQL | undefined {
  const { input, editableOrgIds, isNationAdmin } = params;

  return and(
    !input?.statuses?.length // no statuses provided, default to active
      ? eq(schema.events.isActive, true)
      : input.statuses.length === IsActiveStatus.length
        ? undefined
        : eq(schema.events.isActive, input.statuses.includes("active")),
    input?.searchTerm
      ? or(
          ilike(schema.events.name, `%${input.searchTerm}%`),
          ilike(schema.events.description, `%${input.searchTerm}%`),
        )
      : undefined,
    input?.eventTypeNames?.length
      ? inArray(schema.eventTypes.name, input.eventTypeNames)
      : undefined,
    input?.eventCategories?.length
      ? inArray(schema.eventTypes.eventCategory, input.eventCategories)
      : undefined,
    input?.regionIds?.length
      ? inArray(regionOrg.id, input.regionIds)
      : undefined,
    input?.aoIds?.length ? inArray(parentOrg.id, input.aoIds) : undefined,
    // Filter by editable org IDs if onlyMine is true and not a nation admin
    input?.onlyMine && !isNationAdmin && editableOrgIds.length > 0
      ? or(
          inArray(regionOrg.id, editableOrgIds),
          inArray(parentOrg.id, editableOrgIds),
        )
      : undefined,
  );
}

/**
 * Builds the base query with all required joins for event queries
 */
function buildEventBaseQuery(params: { db: AppDb; where: SQL | undefined }) {
  const { db, where } = params;

  return db
    .select({ count: countDistinct(schema.events.id) })
    .from(schema.events)
    .innerJoin(
      schema.locations,
      eq(schema.locations.id, schema.events.locationId),
    )
    .leftJoin(
      parentOrg,
      and(eq(parentOrg.orgType, "ao"), eq(parentOrg.id, schema.events.orgId)),
    )
    .leftJoin(
      regionOrg,
      and(
        eq(regionOrg.orgType, "region"),
        or(
          eq(regionOrg.id, schema.locations.orgId),
          eq(regionOrg.id, schema.events.orgId),
          eq(regionOrg.id, parentOrg.parentId),
        ),
      ),
    )
    .leftJoin(
      schema.eventsXEventTypes,
      eq(schema.eventsXEventTypes.eventId, schema.events.id),
    )
    .leftJoin(
      schema.eventTypes,
      eq(schema.eventTypes.id, schema.eventsXEventTypes.eventTypeId),
    )
    .where(where);
}

/**
 * Executes a count query for events with the given filters
 */
async function getEventCount(params: {
  db: AppDb;
  where: SQL | undefined;
}): Promise<number> {
  const { db, where } = params;

  const [eventCount] = await buildEventBaseQuery({ db, where });

  return eventCount?.count ?? 0;
}

export const eventRouter = {
  count: protectedProcedure
    .input(eventFilterSchema.optional())
    .route({
      method: "GET",
      path: "/count",
      tags: ["event"],
      summary: "Count events",
      description: "Get the count of events matching the given filters",
    })
    .handler(async ({ context: ctx, input }) => {
      // Resolve editable org IDs for "onlyMine" filter
      const editableResult = await resolveEditableOrgIds({
        ctx,
        onlyMine: input?.onlyMine,
      });

      // If user has no access, return zero count
      if (editableResult === null) {
        return { count: 0 };
      }

      const { editableOrgIds, isNationAdmin } = editableResult;

      const where = buildEventWhereClause({
        input,
        editableOrgIds,
        isNationAdmin,
      });

      const count = await getEventCount({ db: ctx.db, where });

      return { count };
    }),
  byId: protectedProcedure
    .input(z.object({ id: z.coerce.number() }))
    .route({
      method: "GET",
      path: "/id/{id}",
      tags: ["event"],
      summary: "Get event by ID",
      description: "Retrieve detailed information about a specific event",
    })
    .handler(async ({ context: ctx, input }) => {
      const regionOrg = aliasedTable(schema.orgs, "region_org");
      const aoOrg = aliasedTable(schema.orgs, "ao_org");
      const [event] = await ctx.db
        .select({
          id: schema.events.id,
          name: schema.events.name,
          description: schema.events.description,
          isActive: schema.events.isActive,
          location: aoOrg.name,
          locationId: schema.events.locationId,
          startDate: schema.events.startDate,
          dayOfWeek: schema.events.dayOfWeek,
          startTime: schema.events.startTime,
          endTime: schema.events.endTime,
          email: schema.events.email,
          highlight: schema.events.highlight,
          created: schema.events.created,
          meta: schema.events.meta,
          isPrivate: schema.events.isPrivate,
          aos: sql<{ aoId: number; aoName: string }[]>`COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'aoId', ${aoOrg.id}, 
                'aoName', ${aoOrg.name}
              )
            ) 
            FILTER (
              WHERE ${aoOrg.id} IS NOT NULL
            ), 
            '[]'
          )`,
          regions: sql<{ regionId: number; regionName: string }[]>`COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'regionId', ${regionOrg.id}, 
                'regionName', ${regionOrg.name}
              )
            ) 
            FILTER (
              WHERE ${regionOrg.id} IS NOT NULL
            ), 
            '[]'
          )`,
          eventTypes: sql<
            { eventTypeId: number; eventTypeName: string }[]
          >`COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'eventTypeId', ${schema.eventTypes.id},
                'eventTypeName', ${schema.eventTypes.name}
              )
            )
            FILTER (
              WHERE ${schema.eventTypes.id} IS NOT NULL
            ),
            '[]'
          )`,
        })
        .from(schema.events)
        .leftJoin(
          schema.locations,
          eq(schema.locations.id, schema.events.locationId),
        )
        .leftJoin(
          aoOrg,
          and(eq(aoOrg.orgType, "ao"), eq(aoOrg.id, schema.events.orgId)),
        )
        .leftJoin(
          regionOrg,
          and(
            eq(regionOrg.orgType, "region"),
            or(
              eq(regionOrg.id, schema.locations.orgId),
              eq(regionOrg.id, schema.events.orgId),
              eq(regionOrg.id, aoOrg.parentId),
            ),
          ),
        )
        .leftJoin(
          schema.eventsXEventTypes,
          eq(schema.eventsXEventTypes.eventId, schema.events.id),
        )
        .leftJoin(
          schema.eventTypes,
          eq(schema.eventTypes.id, schema.eventsXEventTypes.eventTypeId),
        )
        .where(eq(schema.events.id, input.id))
        .groupBy(schema.events.id, aoOrg.id, regionOrg.id);

      return { event: event ?? null };
    }),
  crupdate: editorProcedure
    .input(EventInsertSchema.partial({ id: true }))
    .route({
      method: "POST",
      path: "/",
      tags: ["event"],
      summary: "Create or update event",
      description: "Create a new event or update an existing one",
    })
    .handler(async ({ context: ctx, input }) => {
      const [existingEvent] = input.id
        ? await ctx.db
            .select()
            .from(schema.events)
            .where(eq(schema.events.id, input.id))
        : [];

      const orgIdToCheck = input.aoId ?? input.regionId;
      if (!orgIdToCheck) {
        throw new ORPCError("BAD_REQUEST", {
          message: "AO ID or Region ID is required",
        });
      }
      const roleCheckResult = await checkHasRoleOnOrg({
        orgId: existingEvent?.orgId ?? orgIdToCheck,
        session: ctx.session,
        db: ctx.db,
        roleName: "editor",
      });
      if (!roleCheckResult.success) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "You are not authorized to update this Event",
        });
      }

      const { eventTypeIds, meta, ...eventData } = input;
      const eventToUpdate: typeof schema.events.$inferInsert = {
        ...eventData,
        orgId: input.aoId,
        meta: meta
          ? {
              ...meta,
              mapSeed: meta.mapSeed as boolean | undefined,
              eventTypeId: undefined, // Remove eventTypeId from meta since we handle it in join table
            }
          : null,
      };

      const [result] = await ctx.db
        .insert(schema.events)
        .values(eventToUpdate)
        .onConflictDoUpdate({
          target: [schema.events.id],
          set: eventToUpdate,
        })
        .returning();

      if (!result) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create/update event",
        });
      }

      // Handle event type in join table
      if (eventTypeIds) {
        await ctx.db
          .delete(schema.eventsXEventTypes)
          .where(eq(schema.eventsXEventTypes.eventId, result.id));

        await ctx.db.insert(schema.eventsXEventTypes).values(
          eventTypeIds.map((eventTypeId: number) => ({
            eventId: result.id,
            eventTypeId,
          })),
        );
      }

      // Notify webhooks about the event change
      emitWebhookEvent({
        type: input.id ? "event.updated" : "event.created",
        eventId: result.id,
      });

      return { event: result ?? null };
    }),
  eventIdToRegionNameLookup: protectedProcedure
    .route({
      method: "GET",
      path: "/event-id-to-region-name-lookup",
      tags: ["event"],
      summary: "Event to region lookup",
      description: "Get a mapping of event IDs to their region names",
    })
    .handler(async ({ context: ctx }) => {
      const result = await ctx.db
        .select({
          eventId: schema.events.id,
          regionName: regionOrg.name,
        })
        .from(schema.events)
        .leftJoin(parentOrg, eq(schema.events.orgId, parentOrg.id))
        .leftJoin(
          regionOrg,
          or(
            and(
              eq(schema.events.orgId, regionOrg.id),
              eq(regionOrg.orgType, "region"),
            ),
            and(
              eq(parentOrg.orgType, "ao"),
              eq(parentOrg.parentId, regionOrg.id),
              eq(regionOrg.orgType, "region"),
            ),
          ),
        )
        .groupBy(schema.events.id, regionOrg.id);

      const lookup = result.reduce(
        (acc, curr) => {
          if (curr.regionName) {
            acc[curr.eventId] = curr.regionName;
          }
          return acc;
        },
        {} as Record<number, string>,
      );

      return { lookup };
    }),
  delete: editorProcedure
    .input(z.object({ id: z.number() }))
    .route({
      method: "DELETE",
      path: "/delete/{id}",
      tags: ["event"],
      summary: "Delete event",
      description: "Soft delete an event by marking it as inactive",
    })
    .handler(async ({ context: ctx, input }) => {
      const [event] = await ctx.db
        .select()
        .from(schema.events)
        .where(eq(schema.events.id, input.id));
      if (!event) {
        throw new ORPCError("NOT_FOUND", {
          message: "Event not found",
        });
      }

      const roleCheckResult = await checkHasRoleOnOrg({
        orgId: event.orgId,
        session: ctx.session,
        db: ctx.db,
        roleName: "admin",
      });
      if (!roleCheckResult.success) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "You are not authorized to delete this Event",
        });
      }
      await ctx.db
        .update(schema.events)
        .set({ isActive: false })
        .where(
          and(eq(schema.events.id, input.id), eq(schema.events.isActive, true)),
        );

      // Notify webhooks about the event deletion
      emitWebhookEvent({ type: "event.deleted", eventId: input.id });

      return { eventId: input.id };
    }),
};
