/**
 * @file faq.ts
 * @description Spanish FAQ clusters for the public /ayuda page (Phase 23 thin slice).
 * @dependencies none
 */

export type FaqItem = {
  question: string;
  answer: string;
};

export type FaqCluster = {
  id: string;
  title: string;
  items: FaqItem[];
};

/**
 * FAQ_CLUSTERS
 *
 * Canonical help copy for TruePhone. Policy detail still lives in legal pages
 * (not shipped yet); these answers stay short and product-accurate.
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
          "No se reembolsa solo. En el pedido eliges: reembolso, o una compra de reemplazo con 8% de comisión una sola vez. El reembolso siempre está disponible mientras no uses esa compensación.",
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
          "Verificar identidad con cédula y selfie, completar el anuncio (modelo, estado, IMEI, al menos 8 fotos) y enviar prueba de posesión. Un revisor de TruePhone aprueba o rechaza antes de que el anuncio sea público.",
      },
      {
        question: "¿TruePhone me dice a qué precio vender?",
        answer:
          "Mostramos un rango recomendado según el modelo y el estado. Tú eliges el precio del equipo. La comisión la paga el comprador, no se descuenta de tu venta (salvo el envío Premium Bogotá, si lo eliges).",
      },
    ],
  },
  {
    id: "envios",
    title: "Envíos",
    items: [
      {
        question: "¿Cómo llega el iPhone?",
        answer:
          "El vendedor elige el envío después del pago. En Bogotá ciudad puede usar TruePhone Premium (recogemos, revisamos y entregamos; el vendedor paga $20.000) o transportadora. Fuera de Bogotá solo hay transportadora: el vendedor envía y sube el código de rastreo.",
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
          "En la cuenta bancaria que registre en Pagos. TruePhone autoriza el desembolso cuando el pedido se completa; en el MVP un operador lo envía desde Wompi.",
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
        answer:
          "No completes el pago fuera de TruePhone. Reporta el pedido o escríbenos a hola@truephone.co. Nunca pedimos tu contraseña de Apple ni códigos de verificación por chat.",
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
        answer:
          "Las páginas legales completas salen antes del lanzamiento público. Esta ayuda resume cómo funciona TruePhone hoy. Para borrar la cuenta o una duda de datos, escribe a hola@truephone.co.",
      },
    ],
  },
];
