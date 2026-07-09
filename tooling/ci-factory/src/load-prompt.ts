import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const promptsDir = path.join(packageRoot, "prompts");

export function readPromptFile(relativePath: string): string {
  const filePath = path.join(promptsDir, relativePath);
  return readFileSync(filePath, "utf8").trim();
}

export function loadTriagePhase1SystemPrompt(): string {
  const guardrails = readPromptFile("shared.guardrails.md");
  const system = readPromptFile("triage-phase-1.system.md");
  return `${guardrails}\n\n${system}`;
}

export function renderTriagePhase1UserPrompt(args: {
  errorContext: string;
  testSource: string;
  previewUrl?: string;
}): string {
  const template = readPromptFile("triage-phase-1.user.template.md");
  const previewUrlSection = args.previewUrl
    ? `**Preview URL:** ${args.previewUrl}\n`
    : "";

  return template
    .replace("{{PREVIEW_URL_SECTION}}", previewUrlSection)
    .replace("{{ERROR_CONTEXT}}", args.errorContext.trim())
    .replace("{{TEST_SOURCE}}", args.testSource.trim());
}

/**
 * Adversarial review (F3-62 phase 1) prompt composition. All three roles
 * compose the shared guardrails exactly like triage does — the "never weaken
 * auth/validation" and "human-owned domains are flag-only" rules ride along
 * in every call.
 */
export type ReviewPromptRole = "reviewer-a" | "reviewer-b" | "judge";

export function loadReviewPhase1SystemPrompt(role: ReviewPromptRole): string {
  const guardrails = readPromptFile("shared.guardrails.md");
  const system = readPromptFile(`review-phase-1.${role}.system.md`);
  return `${guardrails}\n\n${system}`;
}

// Replacement callbacks keep `$`-sequences in diffs/spec text literal —
// String.replace treats `$&`/`$'` in a string replacement specially.
function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (acc, [key, value]) => acc.replace(`{{${key}}}`, () => value),
    template,
  );
}

export function renderReviewerAUserPrompt(args: {
  specs: string;
  diff: string;
}): string {
  return fill(readPromptFile("review-phase-1.reviewer-a.user.template.md"), {
    SPECS: args.specs.trim() || "(no spec files provided for this diff)",
    DIFF: args.diff.trim(),
  });
}

export function renderReviewerBUserPrompt(args: { diff: string }): string {
  return fill(readPromptFile("review-phase-1.reviewer-b.user.template.md"), {
    DIFF: args.diff.trim(),
  });
}

export function renderJudgeUserPrompt(args: {
  reviewerAFindings: string;
  reviewerBFindings: string;
  coderabbitComments: string;
}): string {
  return fill(readPromptFile("review-phase-1.judge.user.template.md"), {
    REVIEWER_A_FINDINGS: args.reviewerAFindings.trim(),
    REVIEWER_B_FINDINGS: args.reviewerBFindings.trim(),
    CODERABBIT_COMMENTS:
      args.coderabbitComments.trim() || "(no CodeRabbit comments on this PR)",
  });
}

export function getPromptPaths(): {
  guardrails: string;
  triageSystem: string;
  triageUserTemplate: string;
} {
  return {
    guardrails: path.join(promptsDir, "shared.guardrails.md"),
    triageSystem: path.join(promptsDir, "triage-phase-1.system.md"),
    triageUserTemplate: path.join(
      promptsDir,
      "triage-phase-1.user.template.md",
    ),
  };
}
