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
