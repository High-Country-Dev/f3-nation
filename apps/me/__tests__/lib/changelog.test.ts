import { describe, expect, it, vi } from "vitest";

const { readFileSyncMock } = vi.hoisted(() => ({
  readFileSyncMock: vi.fn(),
}));

vi.mock("fs", () => ({
  default: { readFileSync: readFileSyncMock },
}));

import {
  parseChangelog,
  parseInlineLinks,
  readChangelog,
} from "@/lib/changelog";

describe("parseChangelog", () => {
  it("parses a version header with a date and one section", () => {
    const markdown = `## [2.1.0](https://example.com/compare/2.0.5...2.1.0) (2026-07-08)


### Features

* **me:** add version indicator ([#586](https://example.com/issues/586))
`;
    const entries = parseChangelog(markdown);

    expect(entries).toHaveLength(1);
    expect(entries[0]?.version).toBe("2.1.0");
    expect(entries[0]?.date).toBe("2026-07-08");
    expect(entries[0]?.sections).toEqual([
      {
        title: "Features",
        items: [
          "**me:** add version indicator ([#586](https://example.com/issues/586))",
        ],
      },
    ]);
  });

  it("parses a version header with no date", () => {
    const markdown = `## [Unreleased]

### Features

* something not yet released
`;
    const entries = parseChangelog(markdown);

    expect(entries[0]?.version).toBe("Unreleased");
    expect(entries[0]?.date).toBeNull();
  });

  it("skips the Dependencies section entirely", () => {
    const markdown = `## [1.0.0](url) (2026-01-01)

### Bug Fixes

* fixed a real bug

### Dependencies

* The following workspace dependencies were updated
  * @acme/api bumped to 0.3.0
`;
    const entries = parseChangelog(markdown);

    const titles = entries[0]?.sections.map((s) => s.title);
    expect(titles).toEqual(["Bug Fixes"]);
    expect(titles).not.toContain("Dependencies");
  });

  it("ignores indented continuation lines under a bullet", () => {
    const markdown = `## [1.0.0](url) (2026-01-01)

### Dependencies

* The following workspace dependencies were updated
  * @acme/api bumped to 0.3.0
  * @acme/db bumped to 0.1.2
`;
    const entries = parseChangelog(markdown);
    // The whole Dependencies section is skipped, so no sections at all.
    expect(entries[0]?.sections).toEqual([]);
  });

  it("supports both * and - bullet markers", () => {
    const markdown = `## [1.0.0](url) (2026-01-01)

### Features

* feature via asterisk
- feature via dash
`;
    const entries = parseChangelog(markdown);
    expect(entries[0]?.sections[0]?.items).toEqual([
      "feature via asterisk",
      "feature via dash",
    ]);
  });

  it("parses multiple version entries independently", () => {
    const markdown = `## [2.0.0](url) (2026-02-01)

### Features

* second release feature

## [1.0.0](url) (2026-01-01)

### Bug Fixes

* first release fix
`;
    const entries = parseChangelog(markdown);

    expect(entries).toHaveLength(2);
    expect(entries[0]?.version).toBe("2.0.0");
    expect(entries[0]?.sections[0]?.items).toEqual(["second release feature"]);
    expect(entries[1]?.version).toBe("1.0.0");
    expect(entries[1]?.sections[0]?.items).toEqual(["first release fix"]);
  });

  it("returns an empty array when there are no version headers", () => {
    expect(parseChangelog("# Changelog\n\nNothing here yet.\n")).toEqual([]);
  });

  it("ignores bullets that appear before any section header", () => {
    const markdown = `## [1.0.0](url) (2026-01-01)

* orphan bullet with no section
`;
    const entries = parseChangelog(markdown);
    expect(entries[0]?.sections).toEqual([]);
  });
});

describe("parseInlineLinks", () => {
  it("returns a single plain segment for text with no formatting", () => {
    expect(parseInlineLinks("just plain text")).toEqual([
      { text: "just plain text" },
    ]);
  });

  it("extracts a bold segment", () => {
    expect(parseInlineLinks("**me:** did a thing")).toEqual([
      { text: "me:", bold: true },
      { text: " did a thing" },
    ]);
  });

  it("extracts a link segment", () => {
    expect(parseInlineLinks("see [#123](https://example.com/123)")).toEqual([
      { text: "see " },
      { text: "#123", href: "https://example.com/123" },
    ]);
  });

  it("extracts bold and multiple links together, preserving order", () => {
    const text =
      "**scope:** did a thing ([#123](https://example.com/pr/123)) ([abc1234](https://example.com/commit/abc1234))";
    const result = parseInlineLinks(text);

    expect(result).toEqual([
      { text: "scope:", bold: true },
      { text: " did a thing (" },
      { text: "#123", href: "https://example.com/pr/123" },
      { text: ") (" },
      { text: "abc1234", href: "https://example.com/commit/abc1234" },
      { text: ")" },
    ]);
  });

  it("returns an empty array for an empty string", () => {
    expect(parseInlineLinks("")).toEqual([]);
  });
});

describe("readChangelog", () => {
  it("reads CHANGELOG.md from the working directory and parses it", () => {
    readFileSyncMock.mockReturnValueOnce(
      "## [1.0.0](url) (2026-01-01)\n\n### Features\n\n* a feature\n",
    );

    const entries = readChangelog();

    expect(readFileSyncMock).toHaveBeenCalledWith(
      expect.stringMatching(/CHANGELOG\.md$/),
      "utf-8",
    );
    expect(entries[0]?.version).toBe("1.0.0");
    expect(entries[0]?.sections[0]?.items).toEqual(["a feature"]);
  });
});
