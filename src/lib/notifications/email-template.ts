/**
 * @file email-template.ts
 * @description Branded HTML wrapper for transactional notification emails.
 * @dependencies @/lib/legal
 */

import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_OPERATOR_NAME,
  LEGAL_PATHS,
} from "@/lib/legal";

const EMAIL_BG = "#f4f4f5";
const EMAIL_CARD = "#ffffff";
const EMAIL_TEXT = "#111111";
const EMAIL_MUTED = "#71717a";
const EMAIL_BORDER = "#e4e4e7";
const EMAIL_CTA = "#2563eb";
const EMAIL_CTA_TEXT = "#ffffff";

export type BuildNotificationEmailInput = {
  subject: string;
  title: string;
  body: string;
  siteOrigin: string;
  href: string;
  ctaLabel: string;
  extraTextLines?: string[];
};

/**
 * resolveEmailSiteOrigin
 *
 * Normalizes an absolute origin for email deep links (no trailing slash).
 *
 * @param siteOrigin - Optional request or env origin.
 * @returns Origin URL without a trailing slash.
 * @calledBy buildNotificationEmail, createNotification
 */
export function resolveEmailSiteOrigin(siteOrigin?: string) {
  return (
    siteOrigin ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

/**
 * absoluteEmailUrl
 *
 * Joins origin and an app path into an absolute URL.
 *
 * @param siteOrigin - Origin that may include a trailing slash.
 * @param path - App path beginning with `/`.
 * @returns Absolute URL.
 * @calledBy renderNotificationEmailHtml, buildNotificationEmail
 */
export function absoluteEmailUrl(siteOrigin: string, path: string) {
  const origin = siteOrigin.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalized}`;
}

/**
 * escapeEmailHtml
 *
 * Escapes HTML special characters for safe email markup.
 *
 * @param value - Raw text fragment.
 * @returns Escaped string safe for HTML text nodes.
 * @calledBy renderNotificationEmailHtml
 */
export function escapeEmailHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * bodyToParagraphs
 *
 * Splits plain-text body into escaped HTML paragraphs.
 *
 * @param body - Notification body (newlines become paragraphs).
 * @returns HTML paragraph markup.
 * @calledBy renderNotificationEmailHtml
 */
function bodyToParagraphs(body: string) {
  return body
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(
      (line) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:${EMAIL_TEXT};">${escapeEmailHtml(line)}</p>`,
    )
    .join("");
}

/**
 * renderNotificationEmailHtml
 *
 * Wraps a notification in a table-based TruePhone layout: wordmark, title,
 * body, optional CTA, and footer with help + legal links.
 *
 * @param input.title - Email heading (usually the in-app title).
 * @param input.body - Plain-text body; newlines become paragraphs.
 * @param input.siteOrigin - Absolute site origin for links.
 * @param input.href - Optional in-app path for the CTA.
 * @param input.ctaLabel - Spanish button label when href is set.
 * @param input.extraTextLines - Optional muted notes under the body.
 * @returns Full HTML document string for Resend.
 * @calledBy buildNotificationEmail, createNotification
 */
export function renderNotificationEmailHtml(input: {
  title: string;
  body: string;
  siteOrigin: string;
  href?: string | null;
  ctaLabel?: string;
  extraTextLines?: string[];
}) {
  const origin = resolveEmailSiteOrigin(input.siteOrigin);
  const helpUrl = absoluteEmailUrl(origin, LEGAL_PATHS.help);
  const privacyUrl = absoluteEmailUrl(origin, LEGAL_PATHS.privacy);
  const termsUrl = absoluteEmailUrl(origin, LEGAL_PATHS.terms);
  const cookiesUrl = absoluteEmailUrl(origin, LEGAL_PATHS.cookies);
  const ctaHref = input.href ? absoluteEmailUrl(origin, input.href) : null;
  const ctaLabel = input.ctaLabel?.trim() || "Abrir en TruePhone";

  const extraHtml = (input.extraTextLines ?? [])
    .map((line) => line.trim())
    .filter(Boolean)
    .map(
      (line) =>
        `<p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:${EMAIL_MUTED};">${escapeEmailHtml(line)}</p>`,
    )
    .join("");

  const ctaHtml = ctaHref
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
        <tr>
          <td style="border-radius:10px;background:${EMAIL_CTA};">
            <a href="${escapeEmailHtml(ctaHref)}" style="display:inline-block;padding:12px 20px;font-size:15px;font-weight:600;color:${EMAIL_CTA_TEXT};text-decoration:none;">${escapeEmailHtml(ctaLabel)}</a>
          </td>
        </tr>
      </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeEmailHtml(input.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${EMAIL_BG};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_BG};padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${EMAIL_CARD};border:1px solid ${EMAIL_BORDER};border-radius:16px;padding:32px 28px;">
            <tr>
              <td>
                <p style="margin:0 0 20px;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${EMAIL_CTA};">${escapeEmailHtml(LEGAL_OPERATOR_NAME)}</p>
                <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${EMAIL_TEXT};">${escapeEmailHtml(input.title)}</h1>
                ${bodyToParagraphs(input.body)}
                ${extraHtml}
                ${ctaHtml}
                <p style="margin:0;font-size:13px;line-height:1.5;color:${EMAIL_MUTED};">
                  Si el botón no funciona, abre TruePhone e inicia sesión.
                </p>
              </td>
            </tr>
          </table>
          <p style="max-width:560px;margin:20px 0 0;font-size:12px;line-height:1.6;color:${EMAIL_MUTED};">
            <a href="${escapeEmailHtml(helpUrl)}" style="color:${EMAIL_CTA};text-decoration:none;">Ayuda</a>
            · <a href="${escapeEmailHtml(privacyUrl)}" style="color:${EMAIL_CTA};text-decoration:none;">Privacidad</a>
            · <a href="${escapeEmailHtml(termsUrl)}" style="color:${EMAIL_CTA};text-decoration:none;">Términos</a>
            · <a href="${escapeEmailHtml(cookiesUrl)}" style="color:${EMAIL_CTA};text-decoration:none;">Cookies</a><br />
            ¿Dudas? Escríbenos a <a href="mailto:${LEGAL_CONTACT_EMAIL}" style="color:${EMAIL_CTA};text-decoration:none;">${LEGAL_CONTACT_EMAIL}</a>
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * buildNotificationEmail
 *
 * Builds subject, plain-text, and branded HTML for a notification email.
 *
 * @param input.subject - Email subject line.
 * @param input.title - HTML heading.
 * @param input.body - Shared body copy.
 * @param input.siteOrigin - Absolute origin for deep links.
 * @param input.href - In-app path for the CTA.
 * @param input.ctaLabel - Spanish CTA label.
 * @param input.extraTextLines - Optional notes appended under the body.
 * @returns Fields to spread into createNotification.
 * @calledBy marketplace, settlement, and order-support notify helpers
 */
export function buildNotificationEmail(input: BuildNotificationEmailInput) {
  const origin = resolveEmailSiteOrigin(input.siteOrigin);
  const url = absoluteEmailUrl(origin, input.href);
  const extra = (input.extraTextLines ?? []).filter((line) => line.trim());

  return {
    emailSubject: input.subject,
    emailText: [input.body, "", `${input.ctaLabel}:`, url, ...extra].join("\n"),
    emailHtml: renderNotificationEmailHtml({
      title: input.title,
      body: input.body,
      siteOrigin: origin,
      href: input.href,
      ctaLabel: input.ctaLabel,
      extraTextLines: extra,
    }),
  };
}
