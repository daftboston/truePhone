/**
 * @file terms.ts
 * @description Spanish terms of use. Money and shipping facts match FINANCIAL_MODEL.md and SHIPPING.md.
 * @dependencies ./constants, ./types
 */

import { PREMIUM_SHIPPING_FEE_PESOS } from "@/lib/financial-core/fees";
import { formatOrderMoney } from "@/lib/format-money";

import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_JURISDICTION,
  LEGAL_OPERATOR_NAME,
} from "./constants";
import { formatOperatorIdentityLegalParagraph } from "./operator-identity";
import type { LegalDocument } from "./types";

const premiumShippingFeeLabel = formatOrderMoney(PREMIUM_SHIPPING_FEE_PESOS);

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
      id: "identidad-operador",
      title: "Identidad del operador",
      paragraphs: [formatOperatorIdentityLegalParagraph()],
    },
    {
      id: "servicio",
      title: "Qué es TruePhone",
      paragraphs: [
        "TruePhone opera un marketplace C2C en Colombia para la compraventa de iPhones usados entre personas. TruePhone no es el vendedor del iPhone: no compra ni adquiere la propiedad del equipo, salvo que en un caso concreto se indique lo contrario por escrito.",
        "TruePhone provee la infraestructura de la plataforma, la verificación y moderación de anuncios, la coordinación del pago a través del proveedor de pagos (hoy Wompi), la retención/liberación de fondos según estas reglas, la mediación de disputas y, cuando el vendedor elige TruePhone Premium Bogotá, un servicio logístico de recogida, revisión y entrega. Ese servicio Premium es logística y control de calidad del envío; no convierte a TruePhone en comprador ni en propietario del iPhone.",
        "Al intervenir en el cobro, la retención de fondos, las reglas de la transacción y (en Premium) la logística, TruePhone asume las obligaciones de información, transparencia y atención al consumidor que le correspondan como operador de la plataforma bajo la ley colombiana. No somos un mero «portal de contacto» que solo facilita el chat entre las partes.",
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
        "Los vendedores no pueden cobrar cuotas de reposición, penalidades por arrepentimiento ni descuentos sobre el reembolso del comprador, salvo los costos de procesamiento de pago que estos Términos autoricen de forma expresa (por ejemplo, la comisión de Wompi cuando el comprador cancela un pedido ya pagado). Cuando proceda el derecho de retracto legal, el reembolso al comprador incluye todas las sumas pagadas en el pedido, sin cuota de reposición.",
      ],
    },
    {
      id: "multi-plataforma",
      title:
        "Publicación en otras plataformas y confirmación de disponibilidad",
      paragraphs: [
        "Si el vendedor indica que el iPhone también está publicado fuera de TruePhone (por ejemplo en redes sociales, Mercado Libre u otra tienda), en el anuncio de TruePhone se mostrará un aviso visible («También en otros sitios») para que el comprador lo sepa antes de iniciar la compra.",
        "En esos anuncios, antes de cobrar al comprador TruePhone solicita al vendedor que confirme que el iPhone sigue disponible. El comprador verá un estado de espera con plazo limitado; solo después de la confirmación podrá pagar con Wompi en TruePhone.",
        "Si el vendedor no confirma a tiempo, indica que ya no está disponible, o vende el equipo en otro canal, debe retirar o pausar el anuncio en TruePhone lo antes posible para evitar una doble venta. Si indica que no está disponible o no responde a tiempo, no se cobrará al comprador en TruePhone y el anuncio podrá archivarse.",
        "El vendedor es responsable de mantener sincronizada la disponibilidad real del equipo con sus anuncios, dentro y fuera de TruePhone. TruePhone no garantiza que un equipo publicado en varios sitios siga disponible hasta recibir la confirmación del vendedor en el flujo descrito.",
      ],
    },
    {
      id: "precios",
      title: "Precio y protección",
      paragraphs: [
        "El comprador paga el precio del equipo más la protección TruePhone (Compra Garantizada): 10% sobre el precio del anuncio.",
        "Esa protección cubre la revisión del anuncio, el cobro seguro y retener el dinero hasta que el pedido se complete. Ves el precio del equipo y la protección por separado. No añadimos IVA encima de ese 10%.",
        `El vendedor no paga comisión sobre la venta. Recibe el precio del equipo, menos ${premiumShippingFeeLabel} si eligió envío Premium Bogotá. La transportadora la paga el vendedor directo al operador.`,
        "Si un vendedor cancela después del pago y soporte acepta el caso, el comprador elige: reembolso, o una compra de reemplazo con 8% de protección una sola vez. Después de esa compra (o si pide el reembolso), el 10% vuelve a aplicar.",
      ],
    },
    {
      id: "pago-retencion",
      title: "Pago, retención y desembolso",
      paragraphs: [
        "El pago se hace en TruePhone, con tarjeta a través de Wompi. El dinero no pasa directo al vendedor.",
        "Flujo: el comprador paga → TruePhone retiene → el equipo se envía → el comprador marca «Ya recibí» → el comprador confirma que está correcto, o pasan 24 horas sin reportar un problema → entonces TruePhone paga al vendedor en la cuenta bancaria que registró.",
        "Un operador de TruePhone envía el desembolso en Wompi después de que TruePhone lo autoriza. El pedido se completa cuando el vendedor recibe ese pago.",
        "No pidas ni aceptes pago fuera de TruePhone. Quien lo haga puede perder la protección y que cerremos la cuenta.",
      ],
    },
    {
      id: "derecho-retracto",
      title: "Derecho de retracto",
      paragraphs: [
        "Cuando la compra se celebra a distancia a través de TruePhone (comercio electrónico), el comprador consumidor puede ejercer el derecho de retracto previsto en el artículo 47 de la Ley 1480 de 2011, en los casos en que la ley lo permita.",
        "Plazo: cinco (5) días hábiles contados a partir de la entrega del iPhone (o desde que el comprador marca «Ya recibí» si esa fecha es la evidencia de entrega en la plataforma). No necesitas justificar el retracto.",
        `Cómo ejercerlo: radica la solicitud en /pqr (tipo Retracto) o escribe a ${LEGAL_CONTACT_EMAIL} indicando el número de pedido y que ejerces retracto. Te daremos instrucciones de devolución.`,
        "Obligaciones del comprador: devolver el iPhone por los mismos medios y en las mismas condiciones en que lo recibió. Los costos de transporte y demás gastos de la devolución corren por cuenta del comprador, salvo que la ley o TruePhone indiquen otra cosa en un caso concreto.",
        "Reembolso: se devolverán todas las sumas pagadas por el comprador en ese pedido (precio del iPhone + protección TruePhone cobrada), sin descuentos ni retenciones por el retracto. En comercio electrónico, el reembolso se hará en un máximo de quince (15) días calendario desde que ejerciste el retracto y cumpliste con (i) suministrar los datos correctos para el retorno y (ii) devolver el producto en los términos de este artículo. El reembolso se aplica al medio de pago usado o al medio que acordemos contigo.",
        "Quién interviene: el vendedor es quien vende el iPhone. TruePhone, al retener el pago, gestiona la retención/liberación de fondos y coordina el proceso de retracto y el reembolso al comprador. TruePhone puede exigir al vendedor la cooperación y, si el vendedor no colabora, aplicar las medidas de cuenta y anuncio previstas en estos términos.",
        "Esto es distinto de la Compra Garantizada y del plazo de 24 horas después de «Ya recibí» para reportar que el equipo no coincide con el anuncio. Ese mecanismo contractual no elimina ni reduce el retracto legal cuando este aplique.",
        "Si en un caso concreto una excepción legal del artículo 47 resultara aplicable, te lo informaremos con fundamento. TruePhone no usa de forma genérica la excepción de «bienes de uso personal» para iPhones.",
      ],
    },
    {
      id: "veinticuatro-horas",
      title: "Las 24 horas después de «Ya recibí»",
      paragraphs: [
        "Solo el comprador inicia el reloj al marcar «Ya recibí el iPhone» en el pedido. El rastreo o la entrega Premium no inician ese plazo.",
        "Tienes 24 horas para revisar el iPhone y, en la página del pedido, confirmar que coincide con el anuncio o reportar un problema. Si no reportas nada, pagamos al vendedor.",
        "Una caída de batería de 1 punto porcentual o menos respecto al anuncio no es motivo de reclamo. Si baja más de 1 punto, puedes pedir devolver el equipo y un reembolso, o quedártelo sin reembolso.",
        "Este plazo de 24 horas regula reclamos de Compra Garantizada por no conformidad con el anuncio. No sustituye el derecho de retracto del apartado anterior.",
      ],
    },
    {
      id: "envios",
      title: "Envíos",
      paragraphs: [
        "El vendedor elige el envío después del pago. El comprador no paga envío en el checkout.",
        "La dirección de entrega queda fijada al confirmarse el pago. No puede cambiarse de forma unilateral después. Un cambio solo procede si el comprador y el vendedor lo aceptan en la plataforma antes de entregar el paquete a la transportadora o a TruePhone Premium, y queda constancia de esa aceptación. TruePhone no cubre bajo Compra Garantizada un envío hecho a una dirección distinta de la registrada en el pedido sin ese acuerdo.",
        "El vendedor debe entregar el paquete a la transportadora (o a TruePhone Premium, si aplica) dentro de seis (6) días calendario contados desde el pago exitoso, incluidos fines de semana y festivos en Colombia. Se considera cumplido cuando el vendedor hace la entrega al carrier o a Premium, no cuando aparece el primer escaneo. Si no hay entrega en ese plazo ni otro plazo informado y aceptado, el comprador puede pedir cancelación y reembolso conforme a estos términos y a la ley (incluida la facultad de resolver ante demoras excesivas en comercio electrónico).",
      ],
      bullets: [
        `TruePhone Premium (solo Bogotá ciudad): recogemos, revisamos y entregamos. El vendedor paga ${premiumShippingFeeLabel}, descontados de su liquidación.`,
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
        "Sin perjuicio del derecho de retracto cuando aplique según la ley y estos Términos, las reglas siguientes aplican a cancelaciones voluntarias en la plataforma.",
        "Si el comprador cancela un pedido ya pagado, asume el costo de procesamiento del cobro de Wompi (2,75% + IVA). El reembolso es el total cobrado menos esa comisión.",
        "El vendedor no cancela solo un pedido pagado. Abre una solicitud de soporte. Un revisor o administrador decide. Si la acepta, el anuncio queda archivado (no vuelve al mercado) y el comprador elige reembolso o la compra de reemplazo al 8%.",
        "Si ya hay envío en curso, la solicitud es por un problema de envío: el desembolso se congela hasta que soporte resuelva.",
        "Cuando proceda el derecho de retracto legal, el reembolso al comprador incluye todas las sumas pagadas en el pedido, sin cuota de reposición. Las 24 horas después de «Ya recibí» regulan reclamos de Compra Garantizada por no conformidad con el anuncio; no sustituyen el retracto legal ni autorizan descuentos sobre el reembolso por arrepentimiento.",
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
        "Cobrar cuota de reposición o penalidad por arrepentimiento.",
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
