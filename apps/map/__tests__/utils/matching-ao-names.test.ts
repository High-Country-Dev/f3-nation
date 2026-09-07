import { describe, expect, it } from "vitest";

import type { SparseF3Marker } from "~/utils/types";
import { getMatchingAoNames } from "~/utils/matching-ao-names";

const makeEvent = (
  overrides: Partial<SparseF3Marker["events"][number]> & { id: number },
): SparseF3Marker["events"][number] => ({
  name: `Event ${overrides.id}`,
  dayOfWeek: null,
  startTime: null,
  eventTypes: [],
  aoName: null,
  aoLogo: null,
  ...overrides,
});

describe("getMatchingAoNames", () => {
  it("matches an AO whose name contains the search text", () => {
    const events = [makeEvent({ id: 1, aoName: "Red Fox", name: "Bootcamp" })];

    expect(getMatchingAoNames(events, "red")).toEqual(["Red Fox"]);
  });

  it("drops the AO-level match when one of its own events already matches by name", () => {
    const events = [
      makeEvent({ id: 1, aoName: "Iron Ridge", name: "Iron Ridge" }),
    ];

    expect(getMatchingAoNames(events, "iron ridge")).toEqual([]);
  });

  it("keeps the AO-level match when none of its events match by name", () => {
    const events = [
      makeEvent({ id: 1, aoName: "Iron Ridge", name: "Bootcamp" }),
    ];

    expect(getMatchingAoNames(events, "iron ridge")).toEqual(["Iron Ridge"]);
  });

  it("evaluates each AO independently when a location hosts more than one", () => {
    const events = [
      makeEvent({ id: 1, aoName: "Iron Ridge", name: "Iron Ridge" }),
      makeEvent({ id: 2, aoName: "Red Fox", name: "Bootcamp" }),
    ];

    expect(getMatchingAoNames(events, "i").sort()).toEqual([]);
    expect(getMatchingAoNames(events, "red").sort()).toEqual(["Red Fox"]);
  });

  it("returns an empty list when nothing matches", () => {
    const events = [makeEvent({ id: 1, aoName: "Red Fox", name: "Bootcamp" })];

    expect(getMatchingAoNames(events, "nonexistent")).toEqual([]);
  });
});
