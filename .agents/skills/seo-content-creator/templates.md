# Templates

Copy, fill, and cut anything that does not apply. All user-facing strings in Spanish (Colombia); code comments in English. Verify the installed Next.js Metadata / sitemap / robots API in `node_modules/next/dist/docs/` before shipping code.

## 1. Page metadata

Static page:

```tsx
export const metadata: Metadata = {
  title: "Explorar iPhones usados revisados", // ≤ 60 chars, suffix added by layout
  description:
    "Elige modelo y almacenamiento y ve anuncios de iPhone revisados por una persona antes de publicarse. Protección TruePhone del 10% y 24 horas para confirmar.", // 120–155 chars
  alternates: { canonical: "/explorar" },
  openGraph: {
    title: "Explorar iPhones usados revisados · TruePhone",
    description: "Anuncios de iPhone revisados manualmente en Colombia.",
    type: "website",
  },
};
```

Dynamic page (pattern already used in `src/app/anuncios/[slug]/page.tsx`):

```tsx
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getPublishedListingBySlug(slug);
  if (!listing) return { title: "Anuncio no encontrado", robots: { index: false } };

  const title = `${listing.iphoneModel.name} ${formatStorageLabel(listing.iphoneStorage.valueGb)} usado`;
  const description = `${listing.title} en ${listing.city}. Estado ${conditionLabels[listing.condition]}, batería ${listing.batteryHealth}%. Anuncio revisado por TruePhone.`;

  return {
    title,
    description,
    alternates: { canonical: publicListingPath(listing) },
    openGraph: { title, description, images: listing.images[0] ? [{ url: listing.images[0].imageUrl }] : undefined, type: "website" },
  };
}
```

Private route (never index):

```tsx
export const metadata: Metadata = { title: "Mis compras", robots: { index: false, follow: false } };
```

## 2. FAQ item (`src/lib/help/faq.ts`)

Add to the matching cluster (`que-es`, `comprar`, `vender`, `envios`, `pagos`, `seguridad`, `cuenta`). Question is the exact phrasing people search; answer 40–90 words, first sentence answers directly.

```ts
{
  question: "¿Puedo comprar un iPhone usado desde Medellín?",
  answer:
    "Sí. Los vendedores fuera de Bogotá envían por transportadora (Servientrega, Envía u otra) y suben el código de rastreo, que ves en tu pedido. Cuando llegue, marca «Ya recibí» y tienes 24 horas para confirmar o reportar un problema. El pago al vendedor se libera solo después.",
},
```

## 3. Landing page copy (model or city)

Deliver as a Markdown draft unless the route already exists.

```
Intent: <one line>
Primary keyword: <…>   Secondary: <…, …, …>
URL: /iphone/<modelo-slug>   (confirm with user)

Title (≤60): iPhone 13 usado en Colombia: anuncios revisados
Description (120–155): Compara iPhone 13 usados con revisión manual, IMEI verificado y salud de batería real. Protección TruePhone del 10% y 24 horas para confirmar tu compra.

H1: iPhone 13 usado en Colombia, revisado antes de publicarse

Intro (60–120 words): what the buyer gets on this page, one trust fact, one CTA link to /buscar?model=…

H2: Qué revisamos en cada iPhone 13          (bullets: IMEI, Activation Lock, fotos guiadas, batería, precio razonable)
H2: Cuánto cuesta un iPhone 13 usado          (explain recommended price range by storage/condition; no fixed numbers that go stale; link to listings)
H2: Cómo funciona la compra                   (pay → hold → recibí → 24 h → seller paid; 10% shown before checkout)
H2: Envío a tu ciudad                         (Carrier nationwide; Premium only Bogotá, seller pays $ 20.000)
H2: Preguntas frecuentes sobre el iPhone 13 usado   (3–5 Q&A → FAQPage JSON-LD)

CTA: Ver iPhone 13 disponibles → /buscar?model=iphone-13
```

## 4. Guide / article

```
Intent: <one searcher question>
Reader: comprador | vendedor | ambos
Primary keyword: <…>   Secondary: <…>
URL: /guias/<slug>   (confirm with user; blog foundation is Phase 18 "future")
Actualizado: <mes año>

Title (≤60)
Description (120–155)
H1 (matches intent, not identical to title)

[Direct answer in the first 2–3 sentences]

H2 …  (3–6 sections; question-style H2 when natural)
  - Short paragraphs, numbered steps for procedures
  - One concrete example with COP amounts using es-CO format
  - Cite primary sources for technical claims (Apple Support, Wompi, Colombian authority) — verify URLs with a live search

H2: Cómo lo aplica TruePhone   (one short section tying the topic to the product; facts from facts.md only)
H2: Preguntas frecuentes        (optional, 3–4 Q&A → FAQPage JSON-LD)

CTA (one): Explorar iPhones revisados | Vender tu iPhone | Leer ayuda
Internal links: ≥ 2 (explorar/buscar, ayuda#cluster, related guide)
```

Guide ideas that match TruePhone authority (see keywords.md cluster 3):
`Cómo verificar el IMEI de un iPhone usado en Colombia`, `Qué es Activation Lock y por qué importa al comprar un iPhone usado`, `Salud de batería: qué porcentaje aceptar en un iPhone usado`, `Checklist para revisar un iPhone usado en 24 horas`, `Cómo vender tu iPhone sin comisión y sin riesgos`, `iPhone usado vs reacondicionado: diferencias reales`.

## 5. JSON-LD

Render inside a Server Component. Only describe what is visible on the page.

```tsx
/**
 * JsonLd
 *
 * Serializes a schema.org object into an application/ld+json script tag.
 *
 * @param props.data - Plain object following schema.org vocabulary.
 * @returns Script element for the document head/body.
 */
function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
```

Check for an existing `JsonLd` helper before adding one (no duplicate components).

Organization + WebSite (home):

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "name": "TruePhone",
      "url": "https://truephone.co",
      "email": "hola@truephone.co",
      "areaServed": "CO",
      "description": "Marketplace de iPhones usados en Colombia. Cada anuncio es revisado manualmente antes de publicarse."
    },
    {
      "@type": "WebSite",
      "url": "https://truephone.co",
      "name": "TruePhone",
      "inLanguage": "es-CO",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://truephone.co/buscar?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  ]
}
```

FAQPage (from `FAQ_CLUSTERS`):

```ts
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_CLUSTERS.flatMap((c) =>
    c.items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  ),
};
```

Product + Offer (listing detail):

```ts
const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: listing.title,
  description,
  image: listing.images.map((i) => i.imageUrl),
  brand: { "@type": "Brand", name: "Apple" },
  model: listing.iphoneModel.name,
  color: listing.iphoneColor.name,
  itemCondition: "https://schema.org/UsedCondition",
  offers: {
    "@type": "Offer",
    url: absoluteUrl(publicListingPath(listing)),
    priceCurrency: "COP",
    price: listing.finalPrice ?? listing.price, // seller price; the 10% fee is shown separately on the page
    availability: "https://schema.org/InStock", // PUBLISHED; use OutOfStock for RESERVED/SOLD if still rendered
    itemCondition: "https://schema.org/UsedCondition",
    seller: { "@type": "Person", name: marketplaceSellerName(listing) },
  },
};
```

Never include IMEI, serial, seller phone, or order data. `price` is the seller's price only if the page shows it as such; if the page headlines the buyer total, use that and say so in `description`.

Article (guide):

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Cómo verificar el IMEI de un iPhone usado en Colombia",
  "inLanguage": "es-CO",
  "datePublished": "2026-09-01",
  "dateModified": "2026-09-18",
  "author": { "@type": "Organization", "name": "TruePhone" },
  "publisher": { "@type": "Organization", "name": "TruePhone", "url": "https://truephone.co" },
  "mainEntityOfPage": "https://truephone.co/guias/verificar-imei-iphone-usado-colombia"
}
```

BreadcrumbList:

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://truephone.co/" },
    { "@type": "ListItem", "position": 2, "name": "Explorar", "item": "https://truephone.co/explorar" },
    { "@type": "ListItem", "position": 3, "name": "iPhone 13 128 GB usado" }
  ]
}
```

## 6. Sitemap and robots (Phase 18)

Read `node_modules/next/dist/docs/` for the installed file-convention signatures first. Shape to aim for:

- `src/app/sitemap.ts`: static public routes (`/`, `/explorar`, `/buscar`, `/ayuda`) + every `PUBLISHED` listing (`publicListingPath`, `lastModified` = `updatedAt`) + public profiles with at least one published listing. Use `dynamic = "force-dynamic"` if the build has no DB (see comments in `src/app/page.tsx`).
- `src/app/robots.ts`: allow `/`, disallow `/revision`, `/verificacion`, `/vender/`, `/compras`, `/ventas`, `/mensajes`, `/favoritos`, `/perfil`, `/pagos`, `/notificaciones`, `/auth`, `/login`, `/registro`, `/recuperar`, `/api`; `sitemap: <metadataBase>/sitemap.xml`.
- `metadataBase` in `src/app/layout.tsx` from an env var (see `src/lib/env.ts` conventions) so canonical and OG URLs resolve absolutely.

## 7. Open Graph copy

- OG title may include the brand: `iPhone 13 128 GB usado en Bogotá · TruePhone`.
- OG description ≤ 110 chars, one trust fact: `Revisado por una persona. Protección del 10% y 24 horas para confirmar.`
- Image: first listing photo for anuncios; a static brand card for other pages (check `public/` before adding assets).
