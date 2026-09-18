# Keyword clusters (Spanish, Colombia)

Volumes change; these clusters describe **intent**, not exact metrics. Before targeting a new head term, verify current phrasing with a live search (Google Colombia, `site:` competitors, autocomplete) and note the date in the PR.

## Language rules

| Prefer (Colombia)         | Avoid                                   | Why |
| ------------------------- | --------------------------------------- | --- |
| `iPhone usado`            | `iPhone de segunda mano` as primary     | "de segunda mano" is Spain-leaning; use once as a secondary variant |
| `celular`                 | `móvil`                                 | Colombian usage |
| `de segunda`              | —                                       | Common colloquial variant; secondary |
| `comprar iPhone usado`    | `iPhone reacondicionado` (as TruePhone) | TruePhone is not a refurbisher; write informative content that explains the difference instead |
| `precio iPhone usado Colombia` | `precio iPhone barato`             | "barato" conflicts with trust positioning |
| `Bogotá`, `Medellín`, `Cali`, `Barranquilla`, `Cartagena`, `Bucaramanga` | invented city pages with no inventory | Only build city pages where listings exist or shipping rules differ (Bogotá has Premium) |
| `COP`, `pesos`            | `$` alone in titles                     | Clarity |

Keep "iPhone" capitalized as Apple writes it. Model names as in `src/lib/iphone-catalog-data.ts` (e.g. `iPhone 13 Pro Max`, `iPhone 15`, `iPhone 16 Pro`).

## Clusters → page mapping

### 1. Buy (transactional)

| Intent examples | Page | Notes |
| --------------- | ---- | ----- |
| `comprar iPhone usado Colombia`, `iPhone usado Bogotá`, `iPhones usados confiables` | `/` and `/explorar` | Home H1 owns the head term; explorar owns "ver anuncios" intent |
| `iPhone 13 usado precio Colombia`, `iPhone 14 Pro usado`, `iPhone 15 128 GB usado` | Model landing (future) or `/buscar?model=…` | Model pages are the highest-value SEO surface once inventory exists |
| `iPhone usado Medellín`, `iPhone usado Cali` | City landing (future) | Explain Carrier shipping nationwide; Bogotá page explains Premium |
| `dónde comprar iPhone usado seguro` | Guide + `/ayuda#que-es` | Trust-led answer, link to explorar |

### 2. Sell (transactional)

| Intent examples | Page | Notes |
| --------------- | ---- | ----- |
| `vender iPhone usado Colombia`, `vender mi iPhone Bogotá`, `dónde vender iPhone` | `/vender` entry copy + guide | 0% seller commission is the differentiator; verification is the trust point |
| `cuánto vale mi iPhone usado`, `precio de venta iPhone 12 usado` | Guide "Cuánto vale tu iPhone" | Reference the recommended price range feature; never publish a fixed price table in prose that goes stale |
| `cómo vender iPhone rápido y seguro` | Guide | Steps: verificación, fotos guiadas, prueba de posesión, revisión |

### 3. Trust and safety (informational — TruePhone's strongest topical authority)

| Intent examples | Page | Notes |
| --------------- | ---- | ----- |
| `verificar IMEI Colombia`, `consultar IMEI` | Guide | Cite https://www.imeicolombia.com.co/ConsultaPublicaIMEI/ after a live re-check |
| `qué es Activation Lock`, `iPhone bloqueado por iCloud comprar` | Guide | Explain in plain Spanish; cite Apple Support |
| `salud de batería iPhone usado cuánto es bueno`, `batería 85% iPhone usado` | Guide | Mention the ≤ 1 point tolerance rule honestly |
| `estafas iPhone usado`, `cómo evitar estafas comprando celular usado` | `/guias/estafas-iphone-marketplace-whatsapp-colombia` + `/ayuda#seguridad` | Calm, factual; no fear-based headlines |
| `cómo saber si la pantalla del iPhone es original`, `batería original iPhone usado` | Guide (backlog 9) | Distinct from battery %; Apple Parts and Service History |
| `iPhone usado vs reacondicionado` | Guide | Informative; positions TruePhone accurately |
| `revisar iPhone usado antes de comprar checklist` | Guide | Practical checklist; ties to the 24-hour window |

### 4. Process and fees (navigational / informational)

| Intent examples | Page | Notes |
| --------------- | ---- | ----- |
| `TruePhone comisión`, `TruePhone qué es`, `TruePhone opiniones` | `/ayuda#que-es`, `/ayuda#comprar` | Own the brand SERP with clear fee copy |
| `Compra Garantizada TruePhone`, `protección al comprador iPhone` | `/ayuda#comprar` | Explain the 10% and the 24-hour rule |
| `envío iPhone Servientrega seguro`, `enviar celular por transportadora` | `/ayuda#envios` + guide | Carrier nationwide; Premium Bogotá |
| `Wompi pago seguro`, `pagar con tarjeta iPhone usado` | `/ayuda#pagos` | Wompi is infrastructure; keep it factual |

### 5. Model comparison (informational, feeds buy intent)

| Intent examples | Page | Notes |
| --------------- | ---- | ----- |
| `iPhone 13 vs iPhone 14 usado cuál comprar`, `vale la pena iPhone 12 en 2026` | Guide | Objective comparison; end with link to `/buscar` filtered by model |
| `iPhone Pro vs normal usado diferencias` | Guide | Avoid spec dumps; explain what matters for a used purchase (battery, cameras, size) |

## Not worth targeting

- Anything Android, tablets, wearables, accessories.
- "iPhone gratis", "iPhone regalado", "sorteo iPhone".
- "iPhone barato" as head term — write "buen precio" or "precio justo" only in body copy when explaining recommended prices.
- Competitor brand + negative modifier ("Mercado Libre estafa").
- Financing / cuotas — not offered.

## Title patterns

```
<Model> usado en Colombia: anuncios revisados                 (model landing)
iPhone usado en <Ciudad>: comprar con revisión y protección   (city landing)
Cómo <acción> <objeto> en Colombia (<año>)                    (guide)
¿<Pregunta corta>? Lo que debes saber antes de comprar        (trust guide)
```

Root layout appends ` · TruePhone`; leave room (title ≤ 60 chars before suffix).
