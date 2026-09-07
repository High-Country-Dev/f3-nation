/**
 * Guards against a non-production deployment silently sending mail under the
 * production sender identity (issue #603).
 */

import { afterEach, describe, expect, it, vi } from "vitest";

interface MockEnv {
  EMAIL_FROM: string;
  EMAIL_SERVER: string;
  EMAIL_ADMIN_DESTINATIONS: string;
  NEXT_PUBLIC_CHANNEL: string | undefined;
}

const mockEnv = vi.hoisted<MockEnv>(() => ({
  EMAIL_FROM: "F3 Support Staging <support+staging@f3nation.com>",
  EMAIL_SERVER: "smtp://localhost:1025",
  EMAIL_ADMIN_DESTINATIONS: "admin@example.test",
  NEXT_PUBLIC_CHANNEL: "staging",
}));

vi.mock("@acme/env", () => ({ env: mockEnv }));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: "test" }),
    }),
  },
}));

import { MailService } from "./service";
import { Templates } from "./templates";

const mapChangeRequestParams = {
  to: "recipient@example.test",
  regionName: "Test Region",
  workoutName: "Test Workout",
  requestType: "New Workout",
  submittedBy: "someone@example.test",
  requestsUrl: "https://admin.example.test/requests",
};

describe("MailService sender-identity guard", () => {
  afterEach(() => {
    mockEnv.EMAIL_FROM = "F3 Support Staging <support+staging@f3nation.com>";
    mockEnv.NEXT_PUBLIC_CHANNEL = "staging";
  });

  it("sends normally when a non-prod channel uses its own sender identity", async () => {
    const mail = new MailService();
    await expect(
      mail.sendTemplateMessages(
        Templates.mapChangeRequest,
        mapChangeRequestParams,
      ),
    ).resolves.toBeDefined();
  });

  it("sends normally in production using the production sender identity", async () => {
    mockEnv.NEXT_PUBLIC_CHANNEL = "prod";
    mockEnv.EMAIL_FROM = "F3 Support <support@f3nation.com>";
    const mail = new MailService();
    await expect(
      mail.sendTemplateMessages(
        Templates.mapChangeRequest,
        mapChangeRequestParams,
      ),
    ).resolves.toBeDefined();
  });

  it("refuses to send when a non-prod channel is configured with the production sender identity", async () => {
    mockEnv.EMAIL_FROM = "F3 Support <support@f3nation.com>";
    const mail = new MailService();
    await expect(
      mail.sendTemplateMessages(
        Templates.mapChangeRequest,
        mapChangeRequestParams,
      ),
    ).rejects.toThrow(/production identity/i);
  });

  it("refuses to send when NEXT_PUBLIC_CHANNEL is missing", async () => {
    mockEnv.NEXT_PUBLIC_CHANNEL = undefined;
    const mail = new MailService();
    await expect(
      mail.sendTemplateMessages(
        Templates.mapChangeRequest,
        mapChangeRequestParams,
      ),
    ).rejects.toThrow(/missing or unrecognized/i);
  });

  it("refuses to send when NEXT_PUBLIC_CHANNEL is an unrecognized value", async () => {
    mockEnv.NEXT_PUBLIC_CHANNEL = "banana";
    const mail = new MailService();
    await expect(
      mail.sendTemplateMessages(
        Templates.mapChangeRequest,
        mapChangeRequestParams,
      ),
    ).rejects.toThrow(/missing or unrecognized/i);
  });

  // A bracket-only parser (`/<([^>]+)>/`) would miss this — no angle brackets,
  // just the address followed by an RFC 5322 comment. Nodemailer accepts this
  // shape, so the guard must too.
  it("refuses to send when the production address appears without angle brackets", async () => {
    mockEnv.EMAIL_FROM = "support@f3nation.com (F3 Support)";
    const mail = new MailService();
    await expect(
      mail.sendTemplateMessages(
        Templates.mapChangeRequest,
        mapChangeRequestParams,
      ),
    ).rejects.toThrow(/production identity/i);
  });
});
