/**
 * @file terms.ts
 * @description Spanish terms of use. Money and shipping facts match FINANCIAL_MODEL.md and SHIPPING.md.
 * @dependencies ./constants, ./types
 */

import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_JURISDICTION,
  LEGAL_OPERATOR_NAME,
} from "./constants";
import type { LegalDocument } from "./types";

/**
 * TERMS_DOCUMENT
 *
 * Canonical marketplace terms. Does not invent fees, refunds, or shipping rules.
 *
 * @calledBy /terminos page
 */
export const TERMS_DOCUMENT: LegalDocument = {
  title: "Términos y condiciones",
  description: `Reglas para comprar y vender iPhones usados en ${LEGAL_OPERATOR_NAME}.`,
  sections: [
    {
      id: "servicio",
      title: "Qué es TruePhone",
      paragraphs: [
        `${LEGAL_OPERATOR_NAME} es un marketplace en ${LEGAL_JURISDICTION} para comprar y vender iPhones usados. Cada anuncio lo revisa una persona antes de publicarse.`,
        "No somos un clasificado abierto. No compramos ni revendemos el inventario: ponemos en contacto a compradores y vendedores, revisamos anuncios y retenemos el pago hasta que el pedido se complete.",
        "En envío Premium Bogotá podemos recoger, revisar y entregar el equipo. Eso es logística, no una compra del iPhone por parte de TruePhone.",
      ],
    },
    {
      id: "cuenta",
      title: "Tu cuenta",
      paragraphs: [
        "Para comprar o vender necesitas una cuenta. Al crearla aceptas estos términos y la política de privacidad.",
        "Quien vende debe verificar identidad con cédula y selfie, y esperar la aprobación de un revisor, antes de publicar.",
        `Para borrar la cuenta o corregir datos, escribe a ${LEGAL_CONTACT_EMAIL}.`,
      ],
    },
    {
      id: "anuncios",
      title: "Anuncios y confianza",
      paragraphs: [
        "El vendedor declara que el iPhone es de su propiedad legal y que la descripción, fotos, IMEI, estado de batería y accesorios son verdaderos.",
        "Pedimos IMEI, confirmación de Activation Lock y una foto de posesión (el equipo junto al código que mostramos). Si algo no cuadra, el anuncio no se publica.",
        "TruePhone puede rechazar, ocultar o archivar un anuncio para proteger a compradores y vendedores. Un precio de referencia es solo una guía: el vendedor elige el precio.",
      ],
    },
    {
      id: "precios",
      title: "Precio y protección",
      paragraphs: [
        "El comprador paga el precio del equipo más la protección TruePhone (Compra Garantizada): 10% sobre el precio del anuncio.",
        "Esa protección cubre la revisión del anuncio, el cobro seguro y retener el dinero hasta que el pedido se complete. Ves el precio del equipo y la protección por separado. No añadimos IVA encima de ese 10%.",
        "El vendedor no paga comisión sobre la venta. Recibe el precio del equipo, menos $20.000 si eligió envío Premium Bogotá. La transportadora la paga el vendedor directo al operador.",
        "Si un vendedor cancela después del pago y soporte acepta el caso, el comprador elige: reembolso, o una compra de reemplazo con 8% de protección una sola vez. Después de esa compra (o si pide el reembolso), el 10% vuelve a aplicar.",
      ],
    },
    {
      id: "pago-retencion",
      title: "Pago, retención y desembolso",
      paragraphs: [
        "El pago se hace en TruePhone, con tarjeta a través de Wompi. El dinero no pasa directo al vendedor.",
        "Flujo: el comprador paga → TruePhone retiene → el equipo se envía → el comprador marca «Ya recibí» → el comprador confirma que está correcto, o pasan 24 horas sin reportar un problema → entonces TruePhone paga al vendedor en la cuenta bancaria que registró.",
        "En el MVP un operador envía el desembolso en Wompi después de que TruePhone lo autoriza. El pedido se completa cuando el vendedor recibe ese pago.",
        "No pidas ni aceptes pago fuera de TruePhone. Quien lo haga puede perder la protección y que cerremos la cuenta.",
      ],
    },
    {
      id: "veinticuatro-horas",
      title: "Las 24 horas después de «Ya recibí»",
      paragraphs: [
        "Solo el comprador inicia el reloj al marcar «Ya recibí el iPhone» en el pedido. El rastreo o la entrega Premium no inician ese plazo.",
        "Tienes 24 horas para revisar el iPhone y, en la página del pedido, confirmar que coincide con el anuncio o reportar un problema. Si no reportas nada, pagamos al vendedor.",
        "Una caída de batería de 1 punto porcentual o menos respecto al anuncio no es motivo de reclamo. Si baja más de 1 punto, puedes pedir devolver el equipo y un reembolso, o quedártelo sin reembolso.",
      ],
    },
    {
      id: "envios",
      title: "Envíos",
      paragraphs: [
        "El vendedor elige el envío después del pago. El comprador no paga envío en el checkout.",
      ],
      bullets: [
        "TruePhone Premium (solo Bogotá ciudad): recogemos, revisamos y entregamos. El vendedor paga $20.000, descontados de su liquidación.",
        "Transportadora (todo el país; también opción en Bogotá): el vendedor envía por Servientrega, Envía u otra, paga al operador y debe subir el código de rastreo. El comprador lo ve en el pedido.",
        "Fuera de Bogotá ciudad (incluye alrededores) solo hay transportadora.",
      ],
    },
    {
      id: "premium-falla",
      title: "Si la inspección Premium no coincide",
      paragraphs: [
        "Si al recoger el iPhone no coincide con el anuncio, no nos lo llevamos. El comprador recibe el reembolso que corresponda. El anuncio se retira o vuelve a revisión.",
      ],
    },
    {
      id: "cancelaciones",
      title: "Cancelaciones después del pago",
      paragraphs: [
        "Si el comprador cancela un pedido ya pagado, asume el costo de procesamiento del cobro. El reembolso es el total cobrado menos esa comisión de Wompi.",
        "El vendedor no cancela solo un pedido pagado. Abre una solicitud de soporte. Un revisor o administrador decide. Si la acepta, el anuncio queda archivado (no vuelve al mercado) y el comprador elige reembolso o la compra de reemplazo al 8%.",
        "Si ya hay envío en curso, la solicitud es por un problema de envío: el desembolso se congela hasta que soporte resuelva.",
      ],
    },
    {
      id: "prohibido",
      title: "Lo que no está permitido",
      paragraphs: ["Entre otras cosas, no puedes:"],
      bullets: [
        "Publicar un iPhone que no es tuyo, está reportado o tiene Activation Lock activo.",
        "Mentir en fotos, IMEI, batería o estado.",
        "Pedir o enviar dinero, teléfonos o enlaces de pago fuera de TruePhone.",
        "Pedir contraseñas de Apple ni códigos de verificación por chat.",
        "Acosar, hacer spam o usar la plataforma para fraude.",
      ],
    },
    {
      id: "limitacion",
      title: "Límites del servicio",
      paragraphs: [
        "Compra Garantizada cubre el flujo de revisión, cobro y retención descrito aquí. No es un seguro de todo riesgo ni una garantía Apple.",
        "TruePhone no garantiza que un anuncio se venda ni los plazos de una transportadora que elige el vendedor.",
        `Estos términos se rigen por las leyes de ${LEGAL_JURISDICTION}. Dudas: ${LEGAL_CONTACT_EMAIL}.`,
      ],
    },
  ],
};
