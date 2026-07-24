# AO logo management: map is read-only, admin is the only upload path

> Human designer: taterhead247 (@taterhead247)

## 1. Summary

Map's suggested-edit flow is intentionally open to authenticated non-editors
so anyone can propose basic corrections (start time, location, coordinates).
Logo upload doesn't belong in that flow: it accepts arbitrary image blobs into
a production public image bucket, a higher-risk surface than the rest of the
form, and one that's disproportionate to the trust level the open-suggestion
model assumes. This spec makes map's AO logo display-only and routes all logo
changes through `apps/admin`, where uploaders are already role-gated
(editor/admin).

## 2. Context & links

- App(s) affected: map (primary — upload path removed), admin (unaffected —
  already has its own role-gated upload flow, referenced but not changed)
- Issue: [F3-Nation/f3-nation#589](https://github.com/F3-Nation/f3-nation/issues/589)
- Prior art superseded by this spec: security issue #369 (map logo upload was
  a dangerous surface), PR #535 (tightened upload auth to any org role —
  closed without merge; role-gating in map wasn't the right fix since the
  suggest-edit flow needs to stay open to non-editors)
- Key code:
  - `apps/map/src/app/api/upload-logo/route.ts` — the endpoint being removed
  - `apps/map/src/utils/image/upload-logo.ts` — the client helper being removed
  - `apps/map/src/app/_components/forms/location-event-form.tsx` — the AO
    Details section's logo field, changed from upload input to read-only
  - `apps/map/src/app/_components/modal/update-location-modal.tsx` — drops
    the `badImage` submit-blocking check
  - `apps/admin/src/app/api/upload-logo/route.ts` — admin's existing,
    unaffected role-gated upload endpoint (the only remaining upload path)

## 3. User stories

- As an authenticated non-editor map user, I want to suggest a correction to
  a workout's time/location without being blocked by an unrelated logo issue,
  so that the low-friction suggestion model still works for me.
- As a map user who wants to change an AO's logo, I want clear direction to
  the admin app, so that I'm not stuck on a dead-end control in map.
- As a security-conscious maintainer, I want no path in the public map app
  that writes arbitrary image blobs to production storage, so that the
  attack surface matches the trust level of anonymous/non-editor callers.

## 4. Acceptance criteria (testable, non-contradictory)

- **AC-1** — GIVEN any user (authenticated or not) in map's edit mode WHEN
  they open the suggest-edit form for a location THEN no logo file-upload
  input is rendered; the AO's current logo (or fallback image) renders
  read-only.
- **AC-2** — GIVEN the suggest-edit form is open THEN helper text is visible
  stating that logo changes must be made in Admin, with a link to the admin
  app.
- **AC-3** — GIVEN an authenticated non-editor user WHEN they submit a
  suggested edit that changes only non-logo fields (e.g. start time) THEN
  the request submits successfully, regardless of whether the AO's existing
  logo URL is broken or unreachable.
- **AC-4** — GIVEN any caller (authenticated or not) WHEN they POST directly
  to map's former `/api/upload-logo` path THEN the response is a 404 (route
  no longer exists) — never a successful upload.
- **AC-5** — GIVEN an editor/admin using `apps/admin`'s AO management screen
  THEN uploading a logo continues to work unchanged (regression guard — this
  spec removes map's path, not admin's).

## 5. Roles & authorization (RBAC)

| Action                                   | Allowed                         | Explicitly denied                                      |
| ---------------------------------------- | ------------------------------- | ------------------------------------------------------ |
| Submit non-logo suggested edits from map | Any authenticated user          | Anonymous (sign-in already required, unchanged)        |
| Upload/change an AO logo via map         | Nobody — path removed           | Everyone, including editors/admins (use admin instead) |
| Upload/change an AO logo via admin       | Editor or admin role on the org | Non-editor authenticated users, anonymous              |

## 6. Out of scope / non-goals

- Any other field in map's suggest-edit form (name, time, location,
  coordinates) — pre-existing behavior, unchanged by this spec.
- Changes to `apps/admin`'s own logo upload UI/flow or its authorization.
- Changes to change-request review/approval semantics beyond the logo field.

## 7. Critical-path test cases

1. Non-editor authenticated user submits a non-logo suggested edit
   successfully, including when the AO's existing logo is broken (AC-3).
2. Map's suggest-edit form shows no upload input and shows the admin helper
   text/link (AC-1, AC-2).
3. A direct POST to map's old `/api/upload-logo` path 404s (AC-4).

## 8. Observability

- Removed: the `map.logo.upload_failed` log event (emitted by the deleted
  route) no longer exists — nothing should expect it going forward.
