import type { SparseF3Marker } from "~/utils/types";

/**
 * AO names at a location whose own name matches the search text, excluding
 * any AO that already has one of its events matching by name — that event
 * produces its own result with a resolved eventId, so the generic AO-level
 * result would just be a redundant, worse-navigating duplicate.
 */
export const getMatchingAoNames = (
  events: SparseF3Marker["events"],
  text: string,
): string[] => {
  const lowerText = text.toLowerCase();
  const matchingAoNames = new Set<string>();
  for (const event of events) {
    if (event.aoName?.toLowerCase().includes(lowerText)) {
      matchingAoNames.add(event.aoName);
    }
  }
  for (const aoName of matchingAoNames) {
    const hasMatchingEventName = events.some(
      (e) => e.aoName === aoName && e.name.toLowerCase().includes(lowerText),
    );
    if (hasMatchingEventName) matchingAoNames.delete(aoName);
  }
  return Array.from(matchingAoNames);
};
