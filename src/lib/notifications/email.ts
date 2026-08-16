/**
 * @file email.ts
 * @description Transactional email delivery for notifications (Resend or console noop).
 * @dependencies fetch, process.env
 */

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendEmailResult =
  | { ok: true; mode: "resend" | "noop"; id?: string }
  | { ok: false; error: string };

/**
 * sendNotificationEmail
 *
 * Delivers a transactional email via Resend when `RESEND_API_KEY` is set;
 * otherwise logs and returns noop success so local/dev never blocks settlement.
 *
 * @param input.to - Recipient email address.
 * @param input.subject - Email subject line.
 * @param input.text - Plain-text body (required).
 * @param input.html - Optional HTML body; falls back to escaped text paragraphs.
 * @returns SendEmailResult with provider mode or error.
 * @calledBy createNotification (email channel)
 * @consumers Settlement received + reminder notifications
 */
export async function sendNotificationEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || "TruePhone <noreply@truephone.co>";

  if (!apiKey) {
    console.info("[notifications:email:noop]", {
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return { ok: true, mode: "noop" };
  }

  const html =
    input.html ??
    `<p>${input.text
      .split("\n")
      .map((line) => escapeHtml(line) || "<br />")
      .join("</p><p>")}</p>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return {
        ok: false,
        error: `Resend ${response.status}: ${detail.slice(0, 200)}`,
      };
    }

    const payload = (await response.json()) as { id?: string };
    return { ok: true, mode: "resend", id: payload.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Email send failed.",
    };
  }
}

/**
 * escapeHtml
 *
 * Escapes HTML special characters for safe email markup.
 *
 * @param value - Raw text fragment.
 * @returns Escaped string safe for HTML text nodes.
 * @calledBy sendNotificationEmail
 */
function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
