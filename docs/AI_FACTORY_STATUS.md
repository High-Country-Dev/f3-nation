# AI Factory — Status

> Tracks what parts of the AI factory design (F3-61 auto-triage, F3-62
> adversarial review — see `AI_FACTORY_DESIGN.md` on the design branch) are
> actually live on this sandbox fork.

## Phase 1 status

**Live (comment-only triage, F3-61 phase 1):**

- `.github/workflows/e2e-triage.yml` runs after every "Preview Environment"
  run, inspects job conclusions for failed `e2e*` jobs, collects the
  Playwright `error-context.md` snapshots + failing spec source, classifies
  the failure via `claude-haiku-4-5` into
  `{app-bug, test-bug, spec-mismatch, flake, infra}`, and posts one PR
  comment per error fingerprint (marker `<!-- ai-triage:<fp> -->`).
- Controls in place: fingerprint dedupe (a repeated failure never re-bills or
  re-comments), a hard cap of 5 triage comments per PR, a 10-minute job
  timeout, and guardrail essentials embedded in the classifier prompt (never
  weaken assertions/auth; security/availability/scalability findings are
  flag-only).
- Single secret: `F3_AI_SDLC_CLAUDE_API_KEY` (Anthropic). The workflow has no
  write access beyond PR comments.

**Not live yet:**

- Fix PRs for `test-bug`/`flake` classifications (phase 2 of F3-61) — the
  factory currently comments only; it opens no branches or PRs.
- The flake ledger and the fix-or-demote automation.
- Adversarial review (F3-62) — no `ai-review` label workflow exists yet.
- Precision tracking / weekly review metrics.
