import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerPostHogErrorReporter } = await import("./posthog-server");
    registerPostHogErrorReporter();
    await import("./orpc/client.server");
  }
}

// Report uncaught server-side request errors to PostHog error tracking.
export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
) => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { captureServerException } = await import("./posthog-server");
    captureServerException(err, {
      path: request.path,
      method: request.method,
    });
  }
};
