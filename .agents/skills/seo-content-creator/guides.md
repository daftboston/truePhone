# Guide backlog and ready outlines

Guides are long-form (800–1,500 words) informational pieces. No guide route exists yet (`docs/plan.md` Phase 18 "Blog foundation (future)"); deliver as a Markdown or TSX draft and confirm the route with the user before adding one. Skeleton: `templates.md` §4.

## Backlog

| # | Topic (working title)                                                          | Reader     | Primary intent                                        | Ties to                                  |
| - | ------------------------------------------------------------------------------ | ---------- | ----------------------------------------------------- | ---------------------------------------- |
| 1 | Cómo verificar el IMEI de un iPhone usado en Colombia                          | Comprador  | `verificar IMEI Colombia`, `consultar IMEI`           | Review checks (PRD §21)                  |
| 2 | Qué es Activation Lock y por qué importa al comprar un iPhone usado            | Comprador  | `qué es Activation Lock`, `iPhone bloqueado iCloud`   | Seller terms (PRD §20 Step 5)            |
| 3 | Salud de batería: qué porcentaje aceptar en un iPhone usado                    | Comprador  | `salud de batería iPhone usado`                       | ≤ 1 point tolerance (FINANCIAL_MODEL §5.3) |
| 4 | Checklist para revisar un iPhone usado en las primeras 24 horas                | Comprador  | `revisar iPhone usado antes de comprar checklist`     | 24-hour rule (FINANCIAL_MODEL §5.1)      |
| 5 | Cómo vender tu iPhone sin comisión y sin riesgos                               | Vendedor   | `vender iPhone usado Colombia`                        | 0% seller commission, verification       |
| 6 | iPhone usado vs reacondicionado: diferencias reales                            | Ambos      | `iPhone usado vs reacondicionado`                     | Positioning (PRD §4)                     |
| 7 | Cómo preparar tu iPhone antes de venderlo (copia, cerrar sesión, borrado)      | Vendedor   | `cómo borrar iPhone para vender`                      | Activation Lock requirement — outline below |
| 8 | Cómo enviar un iPhone por transportadora en Colombia sin riesgos               | Vendedor   | `enviar celular por transportadora`                   | Carrier method (SHIPPING §4) — outline below |

Add new rows here before drafting so topics are not duplicated.

---

## Outline 7 — Cómo preparar tu iPhone antes de venderlo

```
Intent: ¿Qué debo hacer en mi iPhone antes de entregarlo a un comprador?
Reader: vendedor
Primary keyword: cómo preparar iPhone para vender
Secondary: borrar iPhone para vender, cerrar sesión Cuenta de Apple, quitar Activation Lock, copia de seguridad iPhone, desenlazar Apple Watch
URL: /guias/preparar-iphone-para-vender   (confirm with user)
Actualizado: <mes año>

Title (≤60): Cómo preparar tu iPhone para venderlo paso a paso
Description (120–155): Copia de seguridad, cerrar sesión de tu Cuenta de Apple y borrar el iPhone: los pasos para entregarlo sin bloqueo de activación ni datos tuyos.

H1: Prepara tu iPhone antes de venderlo: copia, cierra sesión y bórralo

[Direct answer, 2–3 sentences]
Antes de entregar tu iPhone haz tres cosas en este orden: copia de seguridad, cerrar sesión
de tu Cuenta de Apple y borrar contenido y configuración. Con eso el equipo queda sin
bloqueo de activación (Activation Lock) y sin tus datos, listo para el comprador.

H2: Por qué importa el orden
  - Si borras sin cerrar sesión, el iPhone queda con Activation Lock y el comprador no podrá usarlo.
  - En TruePhone el vendedor confirma que el equipo está libre de Activation Lock antes de publicar; un anuncio con bloqueo no se publica.

H2: 1. Haz una copia de seguridad
  - iCloud (Configuración > [tu nombre] > iCloud > Copia en iCloud) o computador (Finder / iTunes).
  - Si ya tienes el iPhone nuevo, Inicio Rápido transfiere todo directamente.
  Cite: Apple Support "Qué hacer antes de vender, regalar o canjear un iPhone o iPad" — https://support.apple.com/es-co/109511 (verified 2026-09; re-check before publishing)

H2: 2. Desenlaza el Apple Watch y revisa AppleCare
  - Desenlazar desde la app Watch conserva una copia del reloj.
  - AppleCare puede cancelarse o transferirse al nuevo dueño.

H2: 3. Cierra sesión de tu Cuenta de Apple
  - Configuración > [tu nombre] > Cerrar sesión > contraseña > Desactivar.
  - Esto apaga Buscar (Find My) y elimina el bloqueo de activación.
  Cite: Apple Support "Vender, regalar o canjear tu iPhone" — https://support.apple.com/es-co/guide/iphone/iph415eb3fe5/ios

H2: 4. Borra contenido y configuración
  - Configuración > General > Transferir o restablecer iPhone > Borrar contenido y configuración.
  - Retira la SIM física o borra la eSIM cuando el sistema lo pregunte.

H2: 5. Si ya lo entregaste sin borrar
  - Desde iCloud.com > Buscar > eliminar el dispositivo; cambia la contraseña de tu Cuenta de Apple.
  - Pide al comprador que borre el equipo con los pasos anteriores.

H2: Cómo lo aplica TruePhone
  - Fotos guiadas incluyen la pantalla de IMEI y de salud de batería; tómalas ANTES de borrar
    (después del borrado no puedes entrar a Configuración sin configurar de nuevo).
  - Prueba de posesión (código + foto) también antes del borrado.
  - Borra el iPhone solo cuando el pedido esté pagado y vayas a enviarlo o entregarlo a Premium.
  - Facts only from facts.md: 0% comisión al vendedor; pago a cuenta bancaria tras confirmar / 24 h.

H2: Preguntas frecuentes
  - ¿Puedo vender un iPhone con Activation Lock si doy la contraseña? → No. Ciérrala tú; nunca compartas tu contraseña de Apple.
  - ¿Borrar el iPhone elimina el IMEI? → No; el IMEI es del hardware y sigue visible en la caja o marcando *#06#.
  - ¿Cuándo borro el equipo si vendo en TruePhone? → Después del pago, justo antes de enviarlo.

CTA (one): Vender tu iPhone → /vender
Internal links: /ayuda#vender, /ayuda#seguridad, guía 2 (Activation Lock)
JSON-LD: Article + BreadcrumbList + FAQPage
```

Do-not-write for this guide: "el comprador puede quitar el bloqueo después" (false), "TruePhone borra el equipo por ti" (only Premium inspects; it does not erase), any Apple password in examples.

---

## Outline 8 — Cómo enviar un iPhone por transportadora en Colombia

```
Intent: Vendí mi iPhone a alguien en otra ciudad. ¿Cómo lo envío sin que se pierda o me estafen?
Reader: vendedor
Primary keyword: enviar celular por transportadora Colombia
Secondary: enviar iPhone Servientrega, enviar celular Envía, código de rastreo, empacar celular para envío, seguro de envío celular
URL: /guias/enviar-iphone-transportadora-colombia   (confirm with user)
Actualizado: <mes año>

Title (≤60): Cómo enviar un iPhone por transportadora en Colombia
Description (120–155): Empaque, declaración de valor, código de rastreo y qué hacer si el envío falla. Guía para vendedores que envían un iPhone usado a otra ciudad.

H1: Enviar un iPhone usado por transportadora sin riesgos

[Direct answer, 2–3 sentences]
Empaca el iPhone apagado, con protección y sin accesorios sueltos; declara el valor real;
guarda la guía con el código de rastreo y compártelo con el comprador. En TruePhone subes
ese código al pedido y el comprador lo ve desde su cuenta.

H2: Antes de enviar: qué debe estar listo
  - Pedido pagado (en TruePhone el dinero ya está en custodia; nunca envíes con "pago contra entrega" fuera de la plataforma).
  - iPhone borrado y sin Activation Lock (enlace a guía 7).
  - Fotos del equipo y del empaque cerrado, con fecha, por si hay reclamo.

H2: Cómo empacar un celular para envío
  - Apagado. Caja rígida, relleno que impida movimiento, bolsa antiestática o la caja original si la tienes.
  - Nada de cargadores sueltos golpeando el equipo; si incluyes accesorios, sepáralos.
  - No escribas "iPhone" por fuera del paquete.

H2: Qué transportadora elegir y qué declarar
  - Servientrega, Envía u otra con rastreo en línea; la elección y el costo son del vendedor.
  - Declara el valor real del equipo; pregunta por el seguro de mercancía y guarda el recibo.
  - Verify with a live search the current terms/URLs of each carrier before citing; do not quote tarifas (they change).

H2: El código de rastreo es tu comprobante
  - Guarda la guía física y una foto.
  - En TruePhone: abre la venta → registra transportadora + código de rastreo (foto del recibo y del empaque, opcionales pero recomendadas). El comprador lo ve en su pedido y ops puede verificar el envío (SHIPPING §4).
  - El código es obligatorio: sin él el pedido no pasa a "en camino" ni se habilita tu pago después de la entrega (SHIPPING §4 MVP notes).

H2: Qué pasa cuando llega
  - El comprador marca «Ya recibí el iPhone» y tiene 24 horas para confirmar o reportar un problema.
  - Si no reporta nada en 24 horas, TruePhone libera el pago a tu cuenta bancaria (FINANCIAL_MODEL §5.1).
  - Cambio de batería ≤ 1 punto vs el anuncio no es motivo de reclamo (FINANCIAL_MODEL §5.3).

H2: Si el envío se pierde o llega dañado
  - Reclama a la transportadora con la guía y la declaración de valor.
  - En TruePhone abre «Tengo un problema con el envío» desde la venta; soporte revisa el caso y el pago queda congelado mientras se resuelve (SHIPPING §2, order support by custody stage).
  - No prometas plazos ni montos de indemnización; eso lo define la transportadora.

H2: ¿Y si estoy en Bogotá?
  - Puedes elegir TruePhone Premium en lugar de transportadora: recogemos, revisamos y entregamos; cuesta $ 20.000 COP al vendedor y se descuenta del pago (SHIPPING §3).
  - Puedes cambiar Premium ↔ transportadora hasta que subas el código o pase la inspección.

H2: Preguntas frecuentes
  - ¿El comprador paga el envío? → No en el checkout; el vendedor paga a la transportadora.
  - ¿Puedo enviar sin subir el código de rastreo? → No. Es obligatorio: sin él el pedido no avanza ni se habilita tu pago, y pierdes el comprobante ante un reclamo.
  - ¿TruePhone genera la guía? → No en esta etapa; el vendedor la compra directo a la transportadora.

CTA (one): Ver cómo funciona vender → /ayuda#envios
Internal links: /ayuda#envios, /ayuda#pagos, guía 7 (preparar iPhone)
JSON-LD: Article + BreadcrumbList + FAQPage
```

Do-not-write for this guide: "envío gratis", "envío asegurado por TruePhone", carrier tarifas or delivery times, "puntos de entrega" (post-MVP), "TruePhone reembolsa si la transportadora lo pierde" (support case first; Financial Core decides).
