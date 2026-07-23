import type { APIRequestContext } from "@playwright/test";
import { expect, test } from "@playwright/test";

/**
 * Blocking-tier data-visibility E2E suite for the map data endpoint.
 *
 * Implements AC-15 from specs/map-browse-and-search.md (Regression: #606)
 * via direct API calls — no browser, fully deterministic:
 *
 *   1. An active, public event under a DEACTIVATED AO must not render on
 *      the map, even though the event row itself is still active.
 *   2. Positive control: the same event, once its AO is reactivated, DOES
 *      render — proving the exclusion is tied to the AO's active state and
 *      not some unrelated reason (e.g. missing coordinates).
 *
 * The AO is deactivated via org.crupdate (`isActive: false` directly on
 * create), NOT via org.delete — the delete_ao flow separately deactivates
 * the AO's own events, which would never reproduce #606. This mirrors real
 * bad data: an AO deactivated by some other means while its events remain
 * active rows.
 *
 * AUTH: recipe 1 of docs/PREVIEW_AUTH.md — local-api-key is an editor
 * scoped to the F3 Nation org (an ancestor of every seeded region), so it
 * can create orgs/events under any seeded region without extra setup.
 *
 * DATA ASSUMPTION: E2E_API_URL is a preview api backed by the deterministic
 * sandbox seed (packages/db/src/local-seed-lib/data.ts): region "Boone",
 * event type "Bootcamp". The AO/location/event this suite creates are
 * uniquely named per run; the preview DB persists for the run and resets
 * on cold start, so no cleanup is needed.
 */

const API_KEY = "local-api-key";

const apiUrl = process.env.E2E_API_URL;
if (!apiUrl) {
  throw new Error(
    "E2E_API_URL is required but not set. Point it at the api deployment " +
      "under test, e.g. " +
      "E2E_API_URL=https://pr-123-api-<project>.us-central1.run.app " +
      "pnpm test:e2e",
  );
}
const API_URL = apiUrl.replace(/\/$/, "");

// Cold-starting scale-to-zero preview: first request may wait out a boot.
const REQUEST_TIMEOUT_MS = 60_000;

const HEADERS = {
  // Any non-oRPC value routes to the OpenAPI handler AND satisfies the
  // `client`-header requirement of API-key auth (packages/api/src/shared.ts).
  client: "e2e",
  authorization: `Bearer ${API_KEY}`,
};

interface OrgsResponse {
  orgs: { id: number; name: string; orgType: string }[];
  total: number;
}

interface EventTypesResponse {
  eventTypes: { id: number; name: string }[];
}

interface OrgResponse {
  org: { id: number; isActive: boolean } | null;
}

interface SubmitResponse {
  status: string;
  updateRequest?: { eventId?: number };
}

// [locationId, aoName, aoLogo, lat, lon, fullAddress, events[]] — the
// low-bandwidth tuple format from map.location.eventsAndLocations. Field 1
// is the AO's name (packages/api/src/router/map/location.ts sets
// `locations.name` to `aoOrg.name`), NOT the location's own name — don't
// match on it expecting a location name.
type MapEvent = [eventId: number, ...rest: unknown[]];
type MapMarker = [
  locationId: number,
  aoName: string,
  logo: string | null,
  lat: number,
  lon: number,
  fullAddress: string | null,
  events: MapEvent[],
];

async function getJson<T>(
  request: APIRequestContext,
  path: string,
): Promise<T> {
  const res = await request.get(`${API_URL}${path}`, {
    headers: HEADERS,
    timeout: REQUEST_TIMEOUT_MS,
  });
  expect(res.status(), `GET ${path} should succeed`).toBe(200);
  return (await res.json()) as T;
}

async function resolveBoonId(request: APIRequestContext): Promise<number> {
  const body = await getJson<OrgsResponse>(
    request,
    "/v1/org?orgTypes=region&searchTerm=Boone",
  );
  const boone = body.orgs.find((o) => o.name === "Boone");
  expect(boone, 'seeded region "Boone" should exist').toBeTruthy();
  return boone!.id;
}

async function resolveBootcampTypeId(
  request: APIRequestContext,
): Promise<number> {
  const body = await getJson<EventTypesResponse>(
    request,
    "/v1/event-type?searchTerm=Bootcamp",
  );
  const bootcamp = body.eventTypes.find((et) => et.name === "Bootcamp");
  expect(bootcamp, 'seeded event type "Bootcamp" should exist').toBeTruthy();
  return bootcamp!.id;
}

async function fetchMapMarkers(
  request: APIRequestContext,
): Promise<MapMarker[]> {
  return getJson<MapMarker[]>(request, "/v1/map/location/events-and-locations");
}

/** Mirrors the packages/api unit test's approach: check by event id across
 * every returned location's flattened events, not by a top-level name field
 * (which is the AO's name, not the location's). */
function isEventPresent(markers: MapMarker[], eventId: number): boolean {
  return markers.flatMap((m) => m[6]).some((event) => event[0] === eventId);
}

/** Unique per run so reruns against a warm preview never collide. */
function uniqueSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

test.describe("map data visibility — deactivated AOs (AC-15, #606)", () => {
  test("event under a deactivated AO is excluded, then reappears once the AO is reactivated", async ({
    request,
  }) => {
    const suffix = uniqueSuffix();
    const aoName = `E2E Data-Visibility AO ${suffix}`;
    const locationName = `E2E Data-Visibility Location ${suffix}`;

    const regionId = await resolveBoonId(request);
    const eventTypeId = await resolveBootcampTypeId(request);

    // Arrange: create the AO already deactivated — via crupdate, NOT
    // org.delete, so nothing cascades to deactivate the event we're about
    // to create under it. This is the "other means" of deactivation #606
    // describes: an active event row surviving under an inactive AO.
    const createAoRes = await request.post(`${API_URL}/v1/org`, {
      headers: HEADERS,
      data: {
        name: aoName,
        parentId: regionId,
        orgType: "ao",
        isActive: false,
        website: null,
        phone: null,
        twitter: null,
        facebook: null,
        instagram: null,
        description: null,
        email: null,
        logoUrl: null,
        lastAnnualReview: null,
      },
      timeout: REQUEST_TIMEOUT_MS,
    });
    expect(createAoRes.status(), "creating the test AO should succeed").toBe(
      200,
    );
    const createdAo = (await createAoRes.json()) as OrgResponse;
    const aoId = createdAo.org?.id;
    expect(aoId, "created AO should have an id").toBeTruthy();
    expect(createdAo.org?.isActive).toBe(false);

    // Arrange: an active, public event under the deactivated AO. Editor
    // submissions auto-apply (see rbac.spec.ts), so this is created and
    // active immediately.
    const submitRes = await request.post(
      `${API_URL}/v1/request/update-request`,
      {
        headers: HEADERS,
        data: {
          id: crypto.randomUUID(),
          requestType: "create_event",
          regionId,
          eventTypeIds: [eventTypeId],
          eventName: `E2E Data-Visibility Event ${suffix}`,
          eventDescription: "Created by the data-visibility blocking suite",
          eventDayOfWeek: "monday",
          // 05:30 AM keeps the browse suite's AM/PM filter determinism intact.
          eventStartTime: "0530",
          eventEndTime: "0615",
          eventRecurrencePattern: "weekly",
          eventRecurrenceInterval: 1,
          aoId,
          aoName,
          locationName,
          locationAddress: "123 E2E Test Street",
          locationCity: "Boone",
          locationState: "NC",
          locationCountry: "US",
          locationLat: 36.2168,
          locationLng: -81.6746,
          submittedBy: "e2e-data-visibility@f3local.dev",
        },
        timeout: REQUEST_TIMEOUT_MS,
      },
    );
    expect(submitRes.status(), "creating the test event should succeed").toBe(
      200,
    );
    const submitted = (await submitRes.json()) as SubmitResponse;
    expect(submitted.status).toBe("approved");
    const eventId = submitted.updateRequest?.eventId;
    expect(eventId, "created event should have an id").toBeTruthy();

    // Act + Assert: the event's AO is inactive, so the event must not
    // appear on the map at all (#606) — even though the event row itself
    // is active.
    const markersWhileInactive = await fetchMapMarkers(request);
    expect(isEventPresent(markersWhileInactive, eventId!)).toBe(false);

    // Positive control: reactivate the AO and confirm the same location
    // NOW appears, proving the prior absence was the AO's active state —
    // not a coincidence (e.g. missing coordinates, wrong region).
    const reactivateRes = await request.post(`${API_URL}/v1/org`, {
      headers: HEADERS,
      data: {
        id: aoId,
        name: aoName,
        parentId: regionId,
        orgType: "ao",
        isActive: true,
        website: null,
        phone: null,
        twitter: null,
        facebook: null,
        instagram: null,
        description: null,
        email: null,
        logoUrl: null,
        lastAnnualReview: null,
      },
      timeout: REQUEST_TIMEOUT_MS,
    });
    expect(
      reactivateRes.status(),
      "reactivating the test AO should succeed",
    ).toBe(200);

    const markersWhileActive = await fetchMapMarkers(request);
    expect(isEventPresent(markersWhileActive, eventId!)).toBe(true);
  });
});
