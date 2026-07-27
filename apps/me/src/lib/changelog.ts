import fs from "fs";
import path from "path";

export interface ChangelogSection {
  title: string;
  items: string[];
}

export interface ChangelogEntry {
  version: string;
  date: string | null;
  sections: ChangelogSection[];
}

// release-please writes category headers for every commit type it tracks;
// "Dependencies" is internal workspace-bump noise, not user-facing change —
// skip it so the page stays readable for non-developers.
const SKIPPED_SECTIONS = new Set(["Dependencies"]);

const VERSION_HEADER = /^## \[?([\w.-]+)]?.*?(?:\((\d{4}-\d{2}-\d{2})\))?\s*$/;
const SECTION_HEADER = /^### (.+)$/;
const BULLET_ITEM = /^[*-]\s+(.+)$/;
const INDENTED_LINE = /^\s+\S/;

/**
 * Parses release-please's generated CHANGELOG.md format into structured
 * entries, dropping the "Dependencies" bump lists. Only handles the fixed
 * shape release-please emits — not a general-purpose markdown parser.
 */
export function parseChangelog(markdown: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  let currentEntry: ChangelogEntry | null = null;
  let currentSection: ChangelogSection | null = null;

  for (const line of markdown.split("\n")) {
    const versionMatch = VERSION_HEADER.exec(line);
    if (versionMatch?.[1]) {
      currentEntry = {
        version: versionMatch[1],
        date: versionMatch[2] ?? null,
        sections: [],
      };
      entries.push(currentEntry);
      currentSection = null;
      continue;
    }

    if (!currentEntry) continue;

    const sectionMatch = SECTION_HEADER.exec(line);
    if (sectionMatch?.[1]) {
      currentSection = SKIPPED_SECTIONS.has(sectionMatch[1])
        ? null
        : { title: sectionMatch[1], items: [] };
      if (currentSection) currentEntry.sections.push(currentSection);
      continue;
    }

    if (!currentSection || INDENTED_LINE.exec(line)) continue;

    const itemMatch = BULLET_ITEM.exec(line);
    if (itemMatch?.[1]) {
      currentSection.items.push(itemMatch[1]);
    }
  }

  return entries;
}

export function readChangelog(): ChangelogEntry[] {
  const filePath = path.join(process.cwd(), "CHANGELOG.md");
  const markdown = fs.readFileSync(filePath, "utf-8");
  return parseChangelog(markdown);
}

export interface InlineSegment {
  text: string;
  href?: string;
  bold?: boolean;
}

/**
 * Splits a bullet like "**scope:** did a thing ([#123](url)) ([hash](url))"
 * into plain text, bold (release-please's commit-scope prefix), and link
 * segments. Only handles these two inline forms — not general markdown.
 */
export function parseInlineLinks(text: string): InlineSegment[] {
  const parts: InlineSegment[] = [];
  const pattern = /\*\*([^*]+)\*\*|\[([^\]]+)]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      parts.push({ text: match[1], bold: true });
    } else {
      parts.push({ text: match[2] ?? "", href: match[3] });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex) });
  }
  return parts;
}
