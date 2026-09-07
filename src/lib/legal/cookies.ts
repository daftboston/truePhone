/**
 * @file cookies.ts
 * @description Spanish cookie policy. Describes essential cookies and local storage only.
 * @dependencies ./constants, ./types
 */

import { LEGAL_CONTACT_EMAIL, LEGAL_OPERATOR_NAME } from "./constants";
import type { LegalDocument } from "./types";

/**
 * COOKIES_DOCUMENT
 *
 * Canonical cookie copy. No ad or analytics cookies exist today — no consent banner.
 *
 * @calledBy /cookies page
 */
export const COOKIES_DOCUMENT: LegalDocument = {
  title: "Política de cookies",
  description: `Qué cookies y almacenamiento local usa ${LEGAL_OPERATOR_NAME}.`,
  sections: [
    {
      id: "que-son",
      title: "Qué son las cookies",
      paragraphs: [
        "Las cookies son pequeños archivos que el navegador guarda para que un sitio recuerde tu sesión. También usamos almacenamiento local en tu dispositivo para preferencias que no viajan en cada petición.",
        "Hoy solo usamos lo necesario para iniciar sesión y que la interfaz funcione. No hay cookies de publicidad ni de analítica de terceros.",
      ],
    },
    {
      id: "esenciales",
      title: "Cookies esenciales (sesión)",
      paragraphs: [
        "Al entrar o crear una cuenta, Supabase guarda cookies de sesión para saber que eres tú. Sin ellas no puedes comprar, vender, escribir mensajes ni ver tus pedidos.",
        "Estas cookies son necesarias para el servicio. No pedimos un aviso extra de consentimiento para ellas.",
      ],
    },
    {
      id: "local",
      title: "Lo que queda en tu dispositivo (no es cookie)",
      paragraphs: [
        "Algunas preferencias viven en el navegador, no en cookies:",
      ],
      bullets: [
        "Tema (claro, oscuro o del sistema): se guarda en localStorage para respetar tu elección al volver.",
        "Anuncios vistos recientemente: una lista corta en localStorage para mostrarte lo que ya abriste. No es un historial en nuestros servidores.",
      ],
    },
    {
      id: "vistas",
      title: "Vistas de anuncios",
      paragraphs: [
        "Cuando abres un anuncio, TruePhone registra una vista para operaciones (cuántas veces se vio un iPhone). Eso ocurre en el servidor, con tu cuenta si estás conectado o un identificador técnico si eres visitante. No usamos una cookie de seguimiento para eso y esas cifras no aparecen en perfiles públicos.",
      ],
    },
    {
      id: "terceros",
      title: "Terceros",
      paragraphs: [
        "El pago ocurre en Wompi. Ese checkout puede usar sus propias cookies según su política. Nosotros no colocamos cookies de anuncios ni de redes sociales de seguimiento.",
      ],
    },
    {
      id: "control",
      title: "Cómo controlarlas",
      paragraphs: [
        "Puedes borrar cookies y datos del sitio en la configuración del navegador. Si borras las cookies de sesión, tendrás que volver a iniciar sesión.",
        `Más detalle sobre datos personales está en la política de privacidad. Preguntas: ${LEGAL_CONTACT_EMAIL}.`,
      ],
    },
  ],
};
