export interface ChatCompletionRequest {
  systemPrompt: string;
  userPrompt: string;
}

export interface InferenceConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  /** When true, request `response_format: { type: "json_object" }`. */
  jsonMode: boolean;
}

/**
 * Reads inference config from the environment. All three variables are
 * required — the model/endpoint choice is an explicit, reviewable decision
 * (F3-61 model tiering), never a silent default.
 */
export function getInferenceConfigFromEnv(
  env: Record<string, string | undefined> = process.env,
): InferenceConfig {
  const apiKey = env.CI_FACTORY_INFERENCE_API_KEY;
  const baseUrl = env.CI_FACTORY_INFERENCE_BASE_URL;
  const model = env.CI_FACTORY_INFERENCE_MODEL;

  if (!apiKey || !baseUrl || !model) {
    const missing = [
      ["CI_FACTORY_INFERENCE_API_KEY", apiKey],
      ["CI_FACTORY_INFERENCE_BASE_URL", baseUrl],
      ["CI_FACTORY_INFERENCE_MODEL", model],
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name)
      .join(", ");
    throw new Error(
      `Missing required inference env var(s): ${missing}. ` +
        "All of CI_FACTORY_INFERENCE_API_KEY, CI_FACTORY_INFERENCE_BASE_URL, " +
        "and CI_FACTORY_INFERENCE_MODEL must be set — there are no defaults. " +
        "Example (Anthropic OpenAI-compatible endpoint): " +
        'CI_FACTORY_INFERENCE_BASE_URL="https://api.anthropic.com/v1" ' +
        'CI_FACTORY_INFERENCE_MODEL="claude-haiku-4-5-20251001".',
    );
  }

  return {
    apiKey,
    baseUrl,
    model,
    jsonMode: env.CI_FACTORY_INFERENCE_JSON_MODE === "1",
  };
}

export function buildChatCompletionBody(args: {
  config: InferenceConfig;
  systemPrompt: string;
  userPrompt: string;
}): Record<string, unknown> {
  return {
    model: args.config.model,
    temperature: 0,
    messages: [
      { role: "system", content: args.systemPrompt },
      { role: "user", content: args.userPrompt },
    ],
    // JSON mode is optional and off by default: the response parser is the
    // real guarantee, and some OpenAI-compatible endpoints reject
    // response_format (Anthropic's rejects json_object; it only accepts
    // json_schema).
    ...(args.config.jsonMode
      ? { response_format: { type: "json_object" } }
      : {}),
  };
}

export async function runChatCompletion(args: {
  config: InferenceConfig;
  systemPrompt: string;
  userPrompt: string;
}): Promise<string> {
  const url = `${args.config.baseUrl.replace(/\/$/, "")}/chat/completions`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildChatCompletionBody(args)),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Inference request failed (${response.status}): ${body.slice(0, 500)}`,
    );
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Inference response did not include message content");
  }
  return content;
}
