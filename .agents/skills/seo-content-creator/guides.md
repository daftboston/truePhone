# Guide backlog and ready outlines

Guides are long-form (800–1,500 words) informational pieces. They live at `content/guias/<slug>.md` and render on `/guias` (shipped on `main`). Skeleton: `templates.md` §4. Set `published: false` until the user confirms the slug.

## Backlog

| # | Topic (working title)                                                          | Reader     | Status    | Primary intent                                        | Ties to                                  |
| - | ------------------------------------------------------------------------------ | ---------- | --------- | ----------------------------------------------------- | ---------------------------------------- |
| P | Señales de estafa al comprar iPhone usado (Marketplace / WhatsApp)             | Comprador  | Published | `estafas iPhone usado`, WhatsApp                      | `/guias/estafas-iphone-marketplace-whatsapp-colombia` |
| 1 | Cómo verificar el IMEI de un iPhone usado en Colombia                          | Comprador  | Backlog   | `verificar IMEI Colombia`, `consultar IMEI`           | Review checks (PRD §21)                  |
| 2 | Qué es Activation Lock y por qué importa al comprar un iPhone usado            | Comprador  | Backlog   | `qué es Activation Lock`, `iPhone bloqueado iCloud`   | Seller terms (PRD §20 Step 5)            |
| 3 | Salud de batería: qué porcentaje aceptar en un iPhone usado                    | Comprador  | Backlog   | `salud de batería iPhone usado`                       | ≤ 1 point tolerance (FINANCIAL_MODEL §5.3) |
| 4 | Checklist para revisar un iPhone usado en las primeras 24 horas                | Comprador  | Backlog   | `revisar iPhone usado antes de comprar checklist`     | 24-hour rule (FINANCIAL_MODEL §5.1)      |
| 5 | Cómo vender tu iPhone sin comisión y sin riesgos                               | Vendedor   | Backlog   | `vender iPhone usado Colombia`                        | 0% seller commission, verification       |
| 6 | iPhone usado vs reacondicionado: diferencias reales                            | Ambos      | Backlog   | `iPhone usado vs reacondicionado`                     | Positioning (PRD §4)                     |
| 7 | Cómo preparar tu iPhone antes de venderlo (copia, cerrar sesión, borrado)      | Vendedor   | Outlined  | `cómo borrar iPhone para vender`                      | Outline below                            |
| 8 | Cómo enviar un iPhone por transportadora en Colombia sin riesgos               | Vendedor   | Outlined  | `enviar celular por transportadora`                   | Outline below                            |
| 9 | Cómo saber si la pantalla o la batería de un iPhone usado son originales       | Comprador  | Outlined  | `pantalla original iPhone usado`, `batería original`  | Outline below; Apple parts history       |

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

---

## Outline 9 — Cómo saber si la pantalla o la batería son originales

Distinct from backlog #3 (battery **percentage**). This guide is about **parts**: whether the screen or battery was replaced, and whether Apple still calls them original.

```
Intent: ¿Cómo sé si la pantalla o la batería de un iPhone usado son originales?
Reader: comprador
Primary keyword: pantalla original iPhone usado
Secondary: batería original iPhone, historial de piezas y servicio, pieza desconocida iPhone, Face ID no original
URL: /guias/pantalla-bateria-original-iphone-usado   (confirm with user)
Actualizado: <mes año>

Title (≤60): Cómo saber si la pantalla o batería del iPhone son originales
Description (120–155): Revisa Historial de piezas y servicio en Ajustes: Original, Usada o Desconocida. Qué significa cada etiqueta antes de pagar un iPhone usado.

H1: Pantalla y batería originales en un iPhone usado: qué mirar en Ajustes

[Direct answer, 2–3 sentences]
En iOS 15.2 o posterior, ve a Ajustes › General › Información. Si el equipo tuvo
servicio, aparece Historial de piezas y servicio. “Original” (o “Pieza original de Apple”)
quiere decir que Apple reconoce la pieza y el proceso. “Desconocida” no prueba que el
teléfono sea inútil, pero sí que no puedes confiar en los datos de esa pieza.

H2: Dónde está el historial
  - Ajustes › General › Información, debajo del número de serie cuando aplica.
  - No aparece si nunca se reemplazó una pieza (eso también es información: no hay recambio registrado).
  Cite: Apple Support “Acerca del historial de piezas y servicios del iPhone” — https://support.apple.com/es-co/102658 (verified 2026-09; re-check before publishing)
  Cite: Apple Support “Si quieres comprar un iPhone usado” — https://support.apple.com/es-co/104999

H2: Qué significa cada etiqueta
  - Original / Pieza original de Apple: recambio con pieza y calibración Apple.
  - Usada (iPhone 15+ / iOS 18, batería): pieza Apple que ya estuvo en otro iPhone del mismo modelo; puede rendir menos que una nueva.
  - Desconocida: no original, incompleta, de otro equipo, o que no funciona como debería.
  - Finalizar reparación: el recambio no se calibró; Face ID u otras funciones pueden fallar hasta terminar el asistente.

H2: Batería: porcentaje vs originalidad
  - Salud de batería (Ajustes › Batería › Condición) es el desgaste, no si es original.
  - Si iOS dice que no puede verificar una batería Apple genuina, el % puede ser impreciso.
  - TruePhone: una caída ≤ 1 punto vs el anuncio no es reclamo; > 1 punto sí (FINANCIAL_MODEL §5.3). Do not mix that rule into “pieza desconocida”.
  Cite: https://support.apple.com/es-co/103269

H2: Qué pedir en el encuentro (o en TruePhone, en las fotos guiadas)
  - Foto de Ajustes › General › Información (historial si existe).
  - Foto de Salud de la batería.
  - Prueba de Face ID / Touch ID en persona.
  - Si hay “Desconocida” en pantalla o batería: pide descuento o retírate; no es ilegal por sí solo, pero cambia el precio y el riesgo.

H2: Cómo lo aplica TruePhone
  - El anuncio pide historial de reparaciones y fotos de la pantalla de batería.
  - Un revisor ve esas fotos antes de publicar; no certifica piezas Apple (forbidden: “certificado por Apple”).
  - CTA: Explora anuncios revisados → /explorar

H2: Preguntas frecuentes
  - ¿Si no aparece el historial, la pantalla es original? → No aparece significa que iOS no registró un recambio. No es una garantía de fábrica.
  - ¿Pieza desconocida = robado? → No. Es un dato de recambio, no de IMEI. Sigue consultando IMEI.
  - ¿Puedo reclamar en TruePhone por pieza desconocida? → Solo si el anuncio no lo declaró. Revisa la descripción y las fotos antes de comprar.

CTA (one): Explorar anuncios revisados → /explorar
Internal links: /ayuda#seguridad, guía IMEI (backlog 1), guía batería % (backlog 3), guía estafas
JSON-LD: Article + BreadcrumbList + FAQPage
```

Do-not-write for this guide: “certificado por Apple”, “batería original garantizada”, “si dice Original no puede fallar”, any claim that TruePhone inspects internals on Carrier sales (only Premium inspects in Bogotá).
