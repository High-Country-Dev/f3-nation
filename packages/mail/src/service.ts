import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";

import { env } from "@acme/env";

import { logError, logInfo } from "./logger";
import type { TemplateType } from "./templates";
import { DefaultSubject, renderTemplate, Templates } from "./templates";

// Derive the transporter and result types from createTransport so they track
// whichever SentMessageInfo variant @types/nodemailer infers for our config,
// rather than pinning SMTPTransport (which mismatches under nodemailer 9).
type AppTransporter = ReturnType<typeof nodemailer.createTransport>;
type SentMessageInfo = Awaited<ReturnType<AppTransporter["sendMail"]>>;

// The real production identity (see issue #603) — used only as a guard, not
// a default. If a non-prod deployment ends up resolving its sender to this
// address (e.g. EMAIL_FROM was copy-pasted from prod config), recipients
// would be unable to tell a staging/dev notification from a real one.
const PRODUCTION_SENDER_ADDRESS = "support@f3nation.com";

const KNOWN_CHANNELS = ["local", "ci", "branch", "dev", "staging", "prod"];

function extractAddress(from: string): string {
  // "Display Name <addr@x.com>" -> "addr@x.com"; a bare address is returned as-is.
  const match = /<([^>]+)>/.exec(from);
  return (match?.[1] ?? from).trim().toLowerCase();
}

/**
 * Refuses to send rather than risk a non-production deployment silently
 * emailing recipients under the production sender identity. See issue #603.
 */
function assertSenderMatchesEnvironment(from: string): void {
  const channel: string | undefined = env.NEXT_PUBLIC_CHANNEL;

  if (channel === "prod") return;

  if (!channel || !KNOWN_CHANNELS.includes(channel)) {
    logError("mail.sender_identity.unknown_environment", {
      channel: channel ?? "(missing)",
    });
    throw new Error(
      `Refusing to send email: NEXT_PUBLIC_CHANNEL is missing or unrecognized ` +
        `("${channel ?? "(missing)"}"), so the sender identity for this ` +
        `deployment can't be verified.`,
    );
  }

  if (extractAddress(from) === PRODUCTION_SENDER_ADDRESS) {
    logError("mail.sender_identity.production_identity_in_non_prod", {
      channel,
    });
    throw new Error(
      `Refusing to send email: this is a "${channel}" deployment, but its ` +
        `sender is configured as the production identity ` +
        `(${PRODUCTION_SENDER_ADDRESS}). Check EMAIL_FROM for this environment.`,
    );
  }
}

/**
 * Default recipients for each template
 */
export const DefaultTo: Partial<Record<Templates, string | string[]>> = {
  [Templates.feedbackForm]: env.EMAIL_ADMIN_DESTINATIONS?.split(",") ?? [],
};

type TemplateMessage<T extends Templates> = TemplateType[T] & {
  to?: string | string[];
  cc?: string | string[];
  subject?: string;
  from?: string;
};

type TemplateMessageParams<T extends Templates> =
  TemplateMessage<T>[] | TemplateMessage<T>;

export class MailService {
  private transporter: AppTransporter | null = null;
  templates = Templates;
  adminDestinations: string[] = env.EMAIL_ADMIN_DESTINATIONS?.split(",") ?? [];

  constructor() {
    //
  }

  /**
   * Render a template with the given parameters (type-safe)
   */
  public getTemplate<T extends Templates>(
    name: T,
    params: TemplateType[T],
  ): string {
    return renderTemplate(name, params);
  }

  /**
   * Preview a template (for testing/admin purposes)
   */
  public previewTemplate<T extends Templates>(
    name: T,
    params: TemplateType[T],
  ): string {
    return this.getTemplate(name, params);
  }

  async sendTemplateMessages<T extends Templates>(
    template: T,
    params: TemplateMessageParams<T>,
  ) {
    const paramsArray = Array.isArray(params) ? params : [params];
    if (!DefaultTo[template] && !paramsArray.every((p) => p.to)) {
      throw new Error("Missing to and no default to set");
    }

    if (!DefaultSubject[template] && !paramsArray.every((p) => p.subject)) {
      throw new Error("Missing subject and no default subject set");
    }

    const batchSize = 100;
    const sent: (Error | SentMessageInfo)[] = [];

    // Create batches
    for (let i = 0; i < paramsArray.length; i += batchSize) {
      const batchParams = paramsArray.slice(i, i + batchSize);
      const batchMessages = batchParams.map((item) => {
        const from = item.from ?? env.EMAIL_FROM;
        assertSenderMatchesEnvironment(from);
        return {
          ...item,
          from,
          to: item.to ?? DefaultTo[template],
          subject: item.subject ?? DefaultSubject[template],
          html: this.getTemplate(template, item),
        };
      });
      const sentBatch = await this.sendViaTransporter(batchMessages);
      sent.push(...sentBatch);
    }

    return sent;
  }

  private getTransporter() {
    this.transporter ??= nodemailer.createTransport(env.EMAIL_SERVER);
    return this.transporter;
  }

  private async sendViaTransporter(messages: Mail.Options[], batchSize = 50) {
    if (messages.some((m) => m.text)) {
      throw new Error("Text is not supported, just use html");
    }

    // Disable SendGrid click/open tracking - makes links look suspicious
    // See: https://github.com/F3-Nation/f3-nation/issues/45
    const sendGridHeaders = {
      "X-SMTPAPI": JSON.stringify({
        filters: {
          clicktrack: { settings: { enable: 0 } },
          opentrack: { settings: { enable: 0 } },
        },
      }),
    };

    const batches = messages.reduce((acc, message, i) => {
      const batchIndex = Math.floor(i / batchSize);
      acc[batchIndex] = acc[batchIndex] ?? [];
      acc[batchIndex]?.push(message);
      return acc;
    }, [] as Mail.Options[][]);

    const sentInfo: (SentMessageInfo | Error)[] = [];

    for (const batch of batches) {
      await Promise.all(
        batch.map((msg) => {
          const t = this.getTransporter();
          return t
            ?.sendMail({ ...msg, headers: sendGridHeaders })
            .then((info) => {
              sentInfo.push(info);
              logInfo("mail.send.success", {});
            })
            .catch((error: Error) => {
              sentInfo.push(error);
              logError("mail.send.failed", {}, error);
            });
        }),
      );
    }

    const errors = sentInfo.filter((r): r is Error => r instanceof Error);
    if (errors.length > 0) {
      throw new AggregateError(
        errors,
        `${errors.length}/${sentInfo.length} emails failed to send`,
      );
    }

    return sentInfo;
  }
}

export const mail = new MailService();
