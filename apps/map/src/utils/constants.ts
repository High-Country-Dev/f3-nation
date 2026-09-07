import { z } from "zod";

export const SHORT_DAY_ORDER = ["Su", "M", "Tu", "W", "Th", "F", "Sa"] as const;

export const DEFAULT_ZOOM = 2.9;

export const CLOSE_ZOOM = 13;
export const COUNTRY_ZOOM = 5; // below 5 it is red

export const SIDEBAR_WIDTH = 360;

export const MAX_PLACES_AUTOCOMPLETE_RADIUS = 50000;

export const SELECTED_ITEM_DEBOUNCE_TIME_MS = 100;

export const MIN_TEXT_LENGTH_FOR_SEARCH_RESULTS = 3;

export const feedbackSchema = z.object({
  type: z.enum(["bug", "feature request", "feedback", "other"]),
  subject: z.string(),
  email: z.string(),
  description: z.string(),
});

export type FeedbackSchema = z.infer<typeof feedbackSchema>;

export const FeedbackType = [
  "bug",
  "feature request",
  "feedback",
  "other",
] as const;
export type FeedbackType = (typeof FeedbackType)[number];

export const filterButtonClassName =
  "text-sm w-full whitespace-nowrap font-semibold pointer-events-auto flex items-center justify-center gap-2 rounded-md bg-card px-2 py-1 shadow-sm text-foreground";

export const START_END_TIME_DB_FORMAT = "HHmm";
export const START_END_TIME_DISPLAY_FORMAT = "h:mmA";

// Use process.env so that importing here doesn't cause issues like circular dependencies
export const RERENDER_LOGS = false;
export const isProduction = process.env.NODE_ENV === "production";
