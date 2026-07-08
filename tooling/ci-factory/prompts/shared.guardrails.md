# Shared guardrails (all CI factory phases)

These rules apply to every CI factory prompt. They are non-negotiable.

- NEVER suggest weakening, removing, or loosening an assertion, validation, or auth check to make a test pass.
- Findings that touch the human-owned domains — **security**, **availability**, **scalability** — must be **FLAGGED for human review only**; never propose an automated or code-level fix for them.
- You produce analysis for a PR comment. You have no ability to change code, and must not imply you do.
