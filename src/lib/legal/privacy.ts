/**
 * @file privacy.ts
 * @description Spanish privacy policy sections (Ley 1581 habeas data).
 * @dependencies ./constants, ./types
 */

import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_JURISDICTION,
  LEGAL_OPERATOR_NAME,
} from "./constants";
import { formatOperatorIdentityLegalParagraph } from "./operator-identity";
import type { LegalDocument } from "./types";

/**
 * PRIVACY_DOCUMENT
 *
 * Canonical privacy copy. Facts match product KYC, payouts, and messaging rules.
 *
 * @calledBy /privacidad page
 */
export const PRIVACY_DOCUMENT: LegalDocument = {
  title: "Política de privacidad",
  description: `Cómo ${LEGAL_OPERATOR_NAME} trata tus datos personales en ${LEGAL_JURISDICTION}.`,
  summary: {
    title: "En 30 segundos",
    bullets: [
      `${LEGAL_OPERATOR_NAME} trata tus datos en ${LEGAL_JURISDICTION}. Preguntas: ${LEGAL_CONTACT_EMAIL}.`,
      "Pedimos cuenta, identidad de vendedores, anuncios, pedidos, desembolsos y mensajes: solo lo necesario para el marketplace.",
      "Los usamos para verificar, cobrar con Compra Garantizada, notificar y prevenir fraude.",
      "No publicamos tu cédula, selfie, IMEI completo, datos bancarios ni correo.",
      "Puedes conocer, actualizar, rectificar o pedir borrar tus datos escribiendo desde el correo de tu cuenta.",
    ],
  },
  sections: [
    {
      id: "responsable",
      title: "Quién trata tus datos",
      paragraphs: [
        `${LEGAL_OPERATOR_NAME} opera el marketplace de iPhones usados en ${LEGAL_JURISDICTION} y es responsable de los datos personales que nos das al crear una cuenta, verificar identidad, publicar, comprar o recibir un desembolso.`,
        formatOperatorIdentityLegalParagraph(),
        `Si tienes una pregunta sobre tus datos, escríbenos a ${LEGAL_CONTACT_EMAIL}.`,
      ],
    },
    {
      id: "datos",
      title: "Qué datos usamos",
      paragraphs: [
        "Solo pedimos lo necesario para que el marketplace funcione con confianza.",
      ],
      bullets: [
        "Cuenta: nombre, correo, foto de perfil, ciudad y datos que editas en tu perfil.",
        "Identidad (vendedores): fotos de cédula, selfie y el resultado de la revisión. No publicamos tu número de documento; guardamos un resumen seguro y los últimos 4 dígitos.",
        "Anuncios: fotos del iPhone, IMEI, prueba de posesión, estado del equipo y lo que describes.",
        "Pedidos y pagos: historial de compras y ventas, y el cobro a través de Wompi.",
        "Desembolsos: tipo y número de documento, banco, tipo y número de cuenta, nombre y correo de la cuenta bancaria.",
        "Mensajes y preguntas: lo que escribes en el chat privado y en las preguntas públicas del anuncio.",
        "Uso del sitio: vistas de anuncios (para operaciones, no en tu perfil público) y datos técnicos de la sesión.",
      ],
    },
    {
      id: "fines",
      title: "Para qué los usamos",
      paragraphs: ["Usamos tus datos para:"],
      bullets: [
        "Crear y proteger tu cuenta.",
        "Verificar que quien vende es quien dice ser, antes de publicar.",
        "Revisar anuncios (IMEI, posesión, fotos) y mostrar solo los aprobados.",
        "Cobrar, retener y desembolsar dinero según las reglas de Compra Garantizada.",
        "Enviar notificaciones del pedido, mensajes y avisos de cuenta.",
        "Atender reportes, disputas y solicitudes de soporte.",
        "Cumplir obligaciones legales y prevenir fraude.",
      ],
    },
    {
      id: "publico",
      title: "Qué no publicamos",
      paragraphs: [
        "Tu cédula, selfie, IMEI completo, datos bancarios y correo no aparecen en el anuncio ni en el perfil público.",
        "En el perfil y en el pedido otras personas pueden ver nombre, foto, ciudad, fecha de ingreso, calificación y contadores públicos de anuncios (total, activos y comprados). No mostramos vistas privadas ni cifras de dinero.",
      ],
    },
    {
      id: "encargados",
      title: "Quién nos ayuda a tratarlos",
      paragraphs: [
        "Proveedores que prestan el servicio técnico, bajo nuestras instrucciones:",
      ],
      bullets: [
        "Supabase: cuenta, base de datos y archivos (fotos de anuncio, cédula y selfie).",
        "Wompi: cobro al comprador y desembolso a la cuenta bancaria del vendedor.",
        "Vercel: hospedaje de la aplicación.",
      ],
    },
    {
      id: "conservacion",
      title: "Cuánto tiempo los guardamos",
      paragraphs: [
        "Los datos de cuenta se conservan mientras la cuenta esté activa.",
        "Documentos de identidad, IMEI, pedidos, ledger y casos de soporte se conservan el tiempo necesario para revisar anuncios, completar pagos, atender disputas y cumplir la ley.",
        `Puedes pedir la eliminación de documentos de identidad o el cierre de la cuenta escribiendo a ${LEGAL_CONTACT_EMAIL}. Si hay un pedido abierto, una disputa o una obligación legal, podemos conservar lo mínimo hasta resolverlo.`,
      ],
    },
    {
      id: "derechos",
      title: "Tus derechos (Ley 1581)",
      paragraphs: [
        `En ${LEGAL_JURISDICTION} puedes conocer, actualizar, rectificar y solicitar la eliminación de tus datos personales, y pedir información sobre cómo los usamos.`,
        `Para ejercerlos, escribe a ${LEGAL_CONTACT_EMAIL} desde el correo de tu cuenta. Responderemos por el mismo canal.`,
      ],
    },
    {
      id: "contacto",
      title: "Contacto",
      paragraphs: [
        `Correo: ${LEGAL_CONTACT_EMAIL}. Esta política se actualiza cuando cambia el producto; la fecha aparece al inicio de la página.`,
      ],
    },
  ],
};
