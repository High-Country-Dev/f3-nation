# Me: version indicator and changelog page

> Human designer: taterhead247 (@taterhead247)

## 1. Summary

`apps/me` has no visible indication of its own version, unlike map and
admin. This adds a small version indicator to Me's navbar — matching the
`v{version} (channel)` convention already used elsewhere — that links to a
new `/changelog` page. Unlike map's `/changelog` (which renders a hand-
curated, manually-maintained array unrelated to any actual `CHANGELOG.md`),
Me's page parses and renders its own real, release-please-generated
`apps/me/CHANGELOG.md`, so it never goes stale and needs no manual upkeep.

## 2. Context & links

- App(s) affected: me
- Issue: [F3-Nation/f3-nation#586](https://github.com/F3-Nation/f3-nation/issues/586)
- Prior art referenced (not reused as-is):
  - `apps/map/src/app/_components/version-info.tsx` +
    `apps/map/src/app/changelog/page.tsx` (renders a curated
    `packages/shared/src/app/changelog.ts` array, not any `CHANGELOG.md`)
  - `apps/admin/src/app/_components/version-info.tsx` (uses the shared
    `@acme/ui/version-info` base component, version label only, no link, no
    changelog page)
- Key code:
  - `apps/me/src/lib/changelog.ts` — parses `apps/me/CHANGELOG.md`'s
    release-please format into structured entries, dropping "Dependencies"
    sections
  - `apps/me/src/app/changelog/page.tsx` — renders the parsed entries
  - `apps/me/src/components/version-info.tsx` — wraps the shared
    `@acme/ui/version-info` with a `/changelog` link and Me's own
    `package.json` version
  - `apps/me/src/components/navbar.tsx` — renders `VersionInfo`, now takes
    a `channel` prop
  - `apps/me/src/app/layout.tsx` — reads `env.F3_CHANNEL` server-side and
    passes it to `Navbar` (same pattern as `apps/admin/src/app/admin-layout.tsx`)
  - `apps/me/next.config.ts` — `outputFileTracingIncludes` forces
    `CHANGELOG.md` into the standalone build output, since it's read via
    `fs.readFileSync` at runtime rather than statically imported

## 3. User stories

- As anyone viewing Me, I want to see its current version, so that I can
  tell which build I'm using when reporting an issue.
- As anyone viewing Me, I want to click the version to see what changed,
  so that I don't have to dig through GitHub to find out.
- As a maintainer, I want the changelog page to reflect the real
  `CHANGELOG.md`, so that nobody has to remember to hand-update a second,
  parallel changelog on every release.

## 4. Acceptance criteria (testable, non-contradictory)

- **AC-1** — GIVEN any visitor (authenticated or not) THEN Me's navbar
  shows `v{package.json version} (channel)`, matching the format already
  used by map/admin.
- **AC-2** — GIVEN the navbar's version text WHEN clicked THEN the browser
  navigates to `/changelog`.
- **AC-3** — GIVEN `/changelog` is loaded THEN it renders entries parsed
  from `apps/me/CHANGELOG.md` — each entry showing its version, release
  date, and non-"Dependencies" sections (e.g. Features, Bug Fixes) with
  their bullet items.
- **AC-4** — GIVEN a changelog entry's "Dependencies" section (workspace
  version-bump listing) THEN it is not rendered on the page.
- **AC-5** — GIVEN a changelog bullet item containing a markdown link
  (e.g. `[#579](url)`) THEN the rendered page shows it as a real,
  clickable link, not raw bracket/paren markdown syntax.
- **AC-6** — GIVEN `/changelog` is requested THEN it loads successfully
  without requiring sign-in.

## 5. Roles & authorization (RBAC)

Both the version indicator and `/changelog` are static, read-only, and
carry no user- or org-specific data — there is nothing to gate.

| Action                           | Allowed                      | Explicitly denied |
| -------------------------------- | ---------------------------- | ----------------- |
| View version indicator in navbar | Everyone, anonymous included | —                 |
| View `/changelog`                | Everyone, anonymous included | —                 |

## 6. Out of scope / non-goals

- Replicating this for `apps/auth` (has neither a version indicator nor a
  changelog page today) — not requested by this issue.
- Changing map's or admin's existing version-info/changelog behavior.
- A general-purpose markdown renderer — the parser in `changelog.ts` only
  handles the fixed shape release-please emits (`##`/`###` headers, `*`/`-`
  bullets, `[text](url)` links), not arbitrary markdown.

## 7. Critical-path test cases

1. Navbar renders the version string and it links to `/changelog` (AC-1, AC-2).
2. `/changelog` renders at least one entry with a non-"Dependencies"
   section and its items, with links rendered as real anchors, not raw
   markdown (AC-3, AC-5).
3. No "Dependencies" section heading ever appears on the page (AC-4).

## 8. Observability

- None added — this is a static, read-only page with no user action to
  log.
