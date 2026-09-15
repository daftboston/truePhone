/**
 * @file pqr-labels.ts
 * @description Client-safe PQR type/status labels (no database imports).
 * @dependencies @prisma/client types only
 */

import type { PqrCaseStatus, PqrCaseType } from "@prisma/client";

/**
 * pqrTipoLabel
 *
 * Maps persisted PQR type to Spanish consumer/staff labels.
 *
 * @param tipo - Persisted PqrCaseType.
 * @returns Localized label.
 * @calledBy Pqr pages, notifications, ops panel
 */
export function pqrTipoLabel(tipo: PqrCaseType) {
  switch (tipo) {
    case "PETICION":
      return "Petición";
    case "QUEJA":
      return "Queja";
    case "RECLAMO":
      return "Reclamo";
    case "RETRACTO":
      return "Retracto";
    case "HABEAS_DATA":
      return "Datos personales (habeas data)";
    case "OTRO":
      return "Otro";
    default:
      return tipo;
  }
}

/**
 * pqrStatusLabel
 *
 * Maps PQR status to staff-facing Spanish.
 *
 * @param status - Persisted PqrCaseStatus.
 * @returns Localized status label.
 * @calledBy PqrQueuePage, PqrCasePage, ops panel
 */
export function pqrStatusLabel(status: PqrCaseStatus) {
  switch (status) {
    case "PENDING":
      return "Pendiente";
    case "IN_REVIEW":
      return "En revisión";
    case "RESPONDED":
      return "Respondido";
    case "CLOSED":
      return "Cerrado";
    default:
      return status;
  }
}
