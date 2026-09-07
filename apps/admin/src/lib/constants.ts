export const ADMIN_SIDEBAR_WIDTH = 240;
export const ADMIN_HEADER_HEIGHT = 64;

export const EVENT_CATEGORY_OPTIONS = [
  { label: "1st F", value: "first_f" },
  { label: "2nd F", value: "second_f" },
  { label: "3rd F", value: "third_f" },
] as const;

export const EVENT_CATEGORY_LABEL_MAP: Record<string, string> =
  Object.fromEntries(EVENT_CATEGORY_OPTIONS.map((o) => [o.value, o.label]));
