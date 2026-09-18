/**
 * @file faq.ts
 * @description Spanish FAQ clusters for the public /ayuda page (Phase 23 + Legal PR2).
 * @dependencies @/lib/legal
 * @changelog 2026-09-17 — Legal PR2: cobros, dirección, retracto, reposición, impuestos.
 */

import { PREMIUM_SHIPPING_FEE_PESOS } from "@/lib/financial-core/fees";
import { formatOrderMoney } from "@/lib/format-money";
import { LEGAL_CONTACT_EMAIL, LEGAL_PATHS } from "@/lib/legal";

const premiumShippingFeeLabel = formatOrderMoney(PREMIUM_SHIPPING_FEE_PESOS);

export type FaqItemLink = {
  href: string;
  label: string;
};

export type FaqItem = {
  question: string;
  answer: string;
  links?: FaqItemLink[];
};

export type FaqCluster = {
  id: string;
  title: string;
  items: FaqItem[];
};

/**
 * FAQ_CLUSTERS
 *
 * Canonical help copy for TruePhone. Answers stay short; policy detail lives
 * on /privacidad, /terminos, and /cookies.
 *
 * @calledBy AyudaPage
 */
export const FAQ_CLUSTERS: FaqCluster[] = [
  {
    id: "que-es",
    title: "Qué es TruePhone",
    items: [
      {
        question: "¿Qué es TruePhone?",
        answer:
          "TruePhone es un marketplace de iPhones usados en Colombia. Cada anuncio lo revisa una persona antes de publicarse. No es un clasificado abierto: el objetivo es que puedas comprar y vender con más confianza.",
      },
      {
        question: "¿En qué se diferencia de un clasificado?",
        answer:
          "Pedimos identidad al vendedor (cédula y selfie), prueba de posesión del equipo, IMEI y fotos claras. El pago de Compra Garantizada lo retiene TruePhone hasta que confirmes el iPhone o pasen 24 horas después de marcar que lo recibiste.",
      },
    ],
  },
  {
    id: "comprar",
    title: "Comprar",
    items: [
      {
        question: "¿Por qué hay una comisión del 10%?",
        answer:
          "Es la protección TruePhone (Compra Garantizada). Cubre la revisión del anuncio, el cobro seguro y retener el dinero hasta que el pedido se complete. Ves el precio del equipo y la protección por separado, sin cargos escondidos.",
      },
      {
        question: "¿Cuándo se paga al vendedor?",
        answer:
          "Después de que marques «Ya recibí» y confirmes que el iPhone está correcto, o 24 horas después de marcar recepción si no reportas un problema. Hasta entonces el dinero está en custodia de TruePhone.",
      },
      {
        question: "¿Qué pasa si el vendedor cancela después de que pagué?",
        answer:
          "Soporte revisa primero la solicitud del vendedor. Si la acepta, te avisamos en TruePhone y en el pedido eliges: reembolso, o una compra de reemplazo con 8% de protección una sola vez. El reembolso sigue disponible mientras no uses esa compensación. El anuncio queda archivado y no vuelve al mercado.",
      },
      {
        question: "¿Qué significa «También en otros sitios»?",
        answer:
          "El vendedor indicó que el iPhone también puede estar publicado fuera de TruePhone. Antes de cobrarte, le pedimos que confirme que sigue disponible. Verás «Esperando confirmación del vendedor» con un plazo; solo después podrás pagar en TruePhone.",
        links: [{ href: LEGAL_PATHS.terms, label: "Términos" }],
      },
      {
        question: "¿Qué pasa si el vendedor no confirma a tiempo?",
        answer:
          "Si no responde dentro del plazo, la solicitud vence y no se te cobra. El anuncio puede seguir publicado; puedes intentar de nuevo más tarde o explorar otros equipos. Esto no es retracto: el cobro nunca se inició.",
      },
    ],
  },
  {
    id: "politicas",
    title: "Cobros, retracto y políticas",
    items: [
      {
        question: "¿Cómo se cobra en TruePhone?",
        answer:
          "El vendedor no paga comisión por vender. El comprador paga el precio del iPhone más la protección TruePhone (Compra Garantizada): 10% sobre el precio del anuncio (8% una sola vez si elige compra de reemplazo tras una cancelación de vendedor aceptada). Si el vendedor elige TruePhone Premium en Bogotá, se descuentan $25.000 de su liquidación. El pago se hace con Wompi. Si el comprador cancela un pedido ya pagado, el reembolso puede descontar el costo de procesamiento de Wompi (2,75% + IVA), según los Términos.",
        links: [{ href: LEGAL_PATHS.terms, label: "Términos" }],
      },
      {
        question: "¿Puedo cambiar la dirección después de pagar?",
        answer:
          "No de forma unilateral. La dirección queda fijada al pagar. Solo puede cambiarse si comprador y vendedor lo aceptan en TruePhone antes de entregar el paquete a la transportadora o a Premium. Queda registro del cambio. Si el envío ya inició, no se puede cambiar.",
      },
      {
        question: "¿Puedo arrepentirme de la compra?",
        answer:
          "Depende del caso: (a) Derecho de retracto: en compras a distancia, cuando la ley lo permita, 5 días hábiles desde la entrega; se radica en PQR; el comprador asume el envío de devolución; reembolso de todo lo pagado en el pedido en los plazos legales/contractuales. (b) Compra Garantizada: 24 horas después de marcar «Ya recibí» para reportar que el equipo no coincide con el anuncio. (c) Cancelación del comprador fuera de esos casos: el vendedor no está obligado a aceptar un arrepentimiento tardío; si TruePhone procesa cancelación según Términos, puede aplicar el costo Wompi. El retracto legal no se elimina por las reglas de 24 horas.",
        links: [
          { href: LEGAL_PATHS.pqr, label: "PQR" },
          { href: LEGAL_PATHS.terms, label: "Términos" },
        ],
      },
      {
        question: "¿Existe cuota de reposición?",
        answer:
          "No. Los vendedores no pueden cobrar cuota de reposición ni penalidad por arrepentimiento. En retracto legal el reembolso es completo.",
      },
      {
        question:
          '¿TruePhone cobra un impuesto tipo "sales tax" de Estados Unidos?',
        answer:
          "No. TruePhone opera en Colombia. En el checkout verás el precio del iPhone y la protección en pesos colombianos, desglosados. No aplicamos el esquema de impuestos de marketplace de EE.UU.",
      },
    ],
  },
  {
    id: "vender",
    title: "Vender",
    items: [
      {
        question: "¿Qué necesito para publicar?",
        answer:
          "Verificar identidad con cédula y selfie, completar el anuncio (modelo, estado, IMEI, 6 fotos guiadas) y enviar prueba de posesión. Un revisor de TruePhone aprueba o rechaza antes de que el anuncio sea público.",
      },
      {
        question: "¿TruePhone me dice a qué precio vender?",
        answer:
          "Mostramos un rango recomendado según el modelo y el estado. Tú eliges el precio del equipo. La comisión la paga el comprador, no se descuenta de tu venta (salvo el envío Premium Bogotá, si lo eliges).",
      },
      {
        question: "¿Qué pasa con mi anuncio si cancelo una venta ya pagada?",
        answer:
          "Abre «Contactar soporte» en la venta y envía una solicitud con el motivo. No cancela de inmediato: el equipo de TruePhone puede responder, pedir información o decidir. Si lo acepta, el pedido se cancela y el anuncio queda archivado. El incidente permanece privado para nuestro equipo; no aparece como contador público ni permite una reseña del pedido cancelado.",
      },
      {
        question:
          "¿Qué pasa si también publico el iPhone en Facebook o Mercado Libre?",
        answer:
          "Puedes indicarlo al crear el anuncio. Se mostrará un aviso al comprador y, antes del pago, deberás confirmar que el iPhone sigue disponible. Si lo vendes en otro sitio, pausa o archiva el anuncio en TruePhone de inmediato.",
        links: [{ href: LEGAL_PATHS.terms, label: "Términos" }],
      },
      {
        question: "¿Debo confirmar disponibilidad antes de cada compra?",
        answer:
          "Solo en anuncios marcados como publicados también fuera de TruePhone. Te avisamos por correo y en la app cuando un comprador inicia el proceso; tienes un plazo limitado para responder sí o no.",
      },
    ],
  },
  {
    id: "envios",
    title: "Envíos",
    items: [
      {
        question: "¿Cómo llega el iPhone?",
        answer: `El vendedor elige el envío después del pago. En Bogotá ciudad puede usar TruePhone Premium (recogemos, revisamos y entregamos; el vendedor paga ${premiumShippingFeeLabel}) o transportadora. Fuera de Bogotá solo hay transportadora: el vendedor envía y sube el código de rastreo.`,
      },
      {
        question: "¿El comprador paga el envío?",
        answer:
          "No en el checkout. Premium lo paga el vendedor (se descuenta de su liquidación). La transportadora la paga el vendedor directo al operador.",
      },
    ],
  },
  {
    id: "pagos",
    title: "Pagos y desembolsos",
    items: [
      {
        question: "¿Con qué pago?",
        answer:
          "Con tarjeta a través de Wompi. El total es el precio del equipo más la protección TruePhone (10%, o 8% en la compra de reemplazo si el vendedor anterior canceló).",
      },
      {
        question: "¿Cómo recibe el vendedor su dinero?",
        answer:
          "En la cuenta bancaria que registre en Pagos. Cuando el pedido se completa, TruePhone autoriza el desembolso y un operador lo envía desde Wompi.",
      },
    ],
  },
  {
    id: "seguridad",
    title: "Seguridad",
    items: [
      {
        question: "¿Revisan IMEI y Activation Lock?",
        answer:
          "Sí. Pedimos IMEI y comprobamos que el equipo no esté reportado ni con bloqueo de activación. Si algo no cuadra, el anuncio no se publica.",
      },
      {
        question: "¿Qué hago si sospecho fraude?",
        answer: `No completes el pago fuera de TruePhone. Reporta el pedido o escríbenos a ${LEGAL_CONTACT_EMAIL}. Nunca pedimos tu contraseña de Apple ni códigos de verificación por chat.`,
      },
    ],
  },
  {
    id: "cuenta",
    title: "Cuenta",
    items: [
      {
        question: "¿Cómo inicio sesión?",
        answer:
          "Con correo y contraseña, o con Google. Más adelante añadiremos Apple, WhatsApp y Facebook.",
      },
      {
        question: "¿Dónde están los términos y la privacidad?",
        answer: `Los términos, la privacidad y las cookies están en estas páginas. Esta ayuda resume cómo funciona TruePhone. Para borrar la cuenta o una duda de datos, escribe a ${LEGAL_CONTACT_EMAIL}.`,
        links: [
          { href: LEGAL_PATHS.terms, label: "Términos" },
          { href: LEGAL_PATHS.privacy, label: "Privacidad" },
          { href: LEGAL_PATHS.cookies, label: "Cookies" },
        ],
      },
    ],
  },
];
