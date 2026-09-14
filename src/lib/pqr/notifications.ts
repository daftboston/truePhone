/**
 * @file notifications.ts
 * @description Email copy for PQR submission acknowledgements (DRY legal contact).
 * @dependencies @/lib/legal/constants
 */

import { LEGAL_CONTACT_EMAIL, LEGAL_PATHS } from "@/lib/legal/constants";

type PqrAckEmailInput = {
  radicado: string;
  tipoLabel: string;
  createdAt: Date;
};

/**
 * formatPqrTimestamp
 *
 * Formats a PQR timestamp for consumer-facing email and UI.
 *
 * @param date - Case creation or response time.
 * @returns Spanish Colombia locale string.
 * @calledBy buildPqrAckEmail, buildPqrResponseEmail
 */
export function formatPqrTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(date);
}

/**
 * buildPqrAckEmail
 *
 * Composes the immediate acknowledgement email after a PQR case is created.
 *
 * @param input.radicado - Human-readable case id.
 * @param input.tipoLabel - Spanish case type label.
 * @param input.createdAt - Submission timestamp.
 * @returns Subject and plain-text body for Resend.
 * @calledBy createPqrCaseAction
 */
export function buildPqrAckEmail(input: PqrAckEmailInput) {
  const timestamp = formatPqrTimestamp(input.createdAt);
  const subject = `TruePhone: radicado ${input.radicado}`;
  const text = [
    `Recibimos tu ${input.tipoLabel.toLowerCase()} en TruePhone.`,
    "",
    `Radicado: ${input.radicado}`,
    `Fecha y hora: ${timestamp}`,
    "",
    `Guarda este número de radicado. Te responderemos en un máximo de quince (15) días hábiles.`,
    "",
    `Puedes consultar el estado escribiendo a ${LEGAL_CONTACT_EMAIL} o radicando seguimiento en ${LEGAL_PATHS.pqr}.`,
    "",
    "Equipo TruePhone",
  ].join("\n");

  return { subject, text };
}

/**
 * buildPqrResponseEmail
 *
 * Composes the email sent when staff publishes a formal PQR response.
 *
 * @param input.radicado - Human-readable case id.
 * @param input.respuesta - Staff response body.
 * @param input.respondedAt - Response timestamp.
 * @returns Subject and plain-text body for Resend.
 * @calledBy staffRespondPqrCaseAction
 */
export function buildPqrResponseEmail(input: {
  radicado: string;
  respuesta: string;
  respondedAt: Date;
}) {
  const timestamp = formatPqrTimestamp(input.respondedAt);
  const subject = `TruePhone: respuesta a radicado ${input.radicado}`;
  const text = [
    `Respondimos tu caso ${input.radicado}.`,
    "",
    `Fecha de respuesta: ${timestamp}`,
    "",
    input.respuesta,
    "",
    `Si necesitas aclaraciones, responde a este correo o radica seguimiento en ${LEGAL_PATHS.pqr}.`,
    "",
    "Equipo TruePhone",
  ].join("\n");

  return { subject, text };
}

/**
 * buildPqrStaffAlertEmail
 *
 * Notifies the legal inbox when a new PQR case is opened.
 *
 * @param input.radicado - Human-readable case id.
 * @param input.tipoLabel - Spanish case type label.
 * @param input.fullName - Submitter name.
 * @param input.email - Submitter email.
 * @returns Subject and plain-text body for Resend.
 * @calledBy createPqrCaseAction
 */
export function buildPqrStaffAlertEmail(input: {
  radicado: string;
  tipoLabel: string;
  fullName: string;
  email: string;
}) {
  const subject = `Nuevo PQR ${input.radicado} (${input.tipoLabel})`;
  const text = [
    `Nuevo caso PQR radicado: ${input.radicado}`,
    `Tipo: ${input.tipoLabel}`,
    `Nombre: ${input.fullName}`,
    `Correo: ${input.email}`,
    "",
    `Revisar en /revision/pqr`,
  ].join("\n");

  return { subject, text };
}
