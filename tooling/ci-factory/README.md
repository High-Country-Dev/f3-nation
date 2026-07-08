# CI factory (F3-61)

Versioned prompts and scripts for the F3 Nation CI factory: automated analysis
of preview-environment failures before any auto-heal work lands in phase 2.

## Layout

```
prompts/
  shared.guardrails.md           Non-negotiable rules (all phases)
  triage-phase-1.system.md       Phase-1 classifier instructions
  triage-phase-1.user.template.md  Per-run user message template
src/
  load-prompt.ts                 Read + compose prompts
  triage-e2e-failure.ts          Phase-1 CLI entry point
  inference.ts                   OpenAI-compatible chat completions
  format-comment.ts              Parse model JSON → PR comment markdown
```

Prompts are plain markdown — tool-agnostic, reviewable in PRs, and shared
across local runs and GitHub Actions.

## Phase 1: triage only

Classifies a preview E2E failure and produces a PR comment. **No code changes.**

```bash
pnpm -F @acme/ci-factory triage \
  --error-context /tmp/playwright-error.txt \
  --test-source apps/map/tests/e2e/browse.spec.ts \
  --preview-url "https://pr-42-map-....run.app" \
  --output /tmp/triage-comment.md
```

Print prompts without calling inference:

```bash
pnpm -F @acme/ci-factory triage \
  --error-context /tmp/playwright-error.txt \
  --test-source apps/map/tests/e2e/browse.spec.ts \
  --dry-run
```

### Inference environment

| Variable                         | Required                 | Notes                                       |
| -------------------------------- | ------------------------ | ------------------------------------------- |
| `CI_FACTORY_INFERENCE_API_KEY`   | yes (unless `--dry-run`) | —                                           |
| `CI_FACTORY_INFERENCE_BASE_URL`  | yes (unless `--dry-run`) | OpenAI-compatible `/v1` base; no default    |
| `CI_FACTORY_INFERENCE_MODEL`     | yes (unless `--dry-run`) | Explicit model tiering decision; no default |
| `CI_FACTORY_INFERENCE_JSON_MODE` | no                       | `1` requests `response_format: json_object` |

All three primary variables are required — the endpoint and model are explicit,
reviewable decisions, never silent defaults. JSON mode is off by default: the
response parser is the real guarantee, and some OpenAI-compatible endpoints
reject it (Anthropic's rejects `json_object` — it only accepts `json_schema`).
Anthropic (OpenAI-compatible endpoint) example:

```bash
export CI_FACTORY_INFERENCE_BASE_URL="https://api.anthropic.com/v1"
export CI_FACTORY_INFERENCE_API_KEY="..."
export CI_FACTORY_INFERENCE_MODEL="claude-haiku-4-5-20251001"
```

## Wiring into preview E2E (next step)

After a Playwright job fails in `preview-env.yml`:

1. Upload error output + test source as artifacts
2. Run `pnpm -F @acme/ci-factory triage ... --output comment.md`
3. Post `comment.md` to the PR (marker: `<!-- f3-ci-factory-triage -->`)

Phase 2 (auto-heal) will add separate prompts under `prompts/` — do not extend
the phase-1 prompt with fix instructions.

## Tests

```bash
pnpm -F @acme/ci-factory test
```
