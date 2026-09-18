---
name: seo-content-creator
description: Creates helpful, search-optimized Spanish (Colombia) content for TruePhone public pages — page titles and meta descriptions, FAQ entries, model/city landing copy, buying and selling guides, blog articles, Open Graph copy, and JSON-LD structured data. Use when the user asks for SEO, keywords, metadata, meta description, landing copy, blog posts, guías, artículos, FAQ content, structured data, or organic growth content for TruePhone.
---

# TruePhone SEO Content Creator

Write content that ranks because it is genuinely useful to Colombians buying or selling a used iPhone, and that reinforces TruePhone's only product: **trust**.

Content: **Spanish (Colombia)**. Code, comments, this skill: English.

## Sources of truth

| Need                                   | Read                                                          |
| -------------------------------------- | ------------------------------------------------------------- |
| Voice, terminology, transparency rules | `docs/COPY_GUIDELINES.md`                                     |
| Claims you may make / must never make  | [facts.md](facts.md)                                          |
| Keyword clusters and page mapping      | [keywords.md](keywords.md)                                    |
| Copy and code templates                | [templates.md](templates.md)                                  |
| Guide backlog and ready outlines       | [guides.md](guides.md)                                        |
| What public pages exist and why        | `docs/PRD.md` §29, §41, §53; `docs/plan.md` Phase 18, 23      |

A claim not in `facts.md` must be verified in `docs/` first. If it conflicts, stop and ask; never invent.

## Workflow

```
- [ ] 1. State the one searcher question this piece answers (e.g. "¿Es seguro comprar un iPhone usado en Colombia?")
- [ ] 2. Pick 1 primary keyword + 3–6 secondary (keywords.md)
- [ ] 3. Check every factual claim against facts.md
- [ ] 4. Draft from the matching template (templates.md / guides.md)
- [ ] 5. Run the checklist below
- [ ] 6. Place it in the right file (see "Where content lives")
```

Two questions in one piece → split it.

## Voice

An Apple Store Specialist explaining, not a salesperson.

| Do                                                         | Don't                                                       |
| ---------------------------------------------------------- | ----------------------------------------------------------- |
| "Cada anuncio lo revisa una persona antes de publicarse."  | "¡El marketplace MÁS seguro de Colombia!"                   |
| "Pagas el precio del equipo más 10% de protección."        | "Sin costos" / "Gratis" (buyer pays 10%)                    |
| "Tienes 24 horas después de marcar «Ya recibí» para…"      | "Garantía total" / "Garantizado" / "Devolución sin preguntas" |
| Short sentences, one idea each, concrete COP examples      | Filler intros, superlatives, fear-based urgency             |
| revisado · verificado · protegido · transparente           | increíble · perfecto · el mejor · ¡no te arriesgues!        |

Fixed terminology: **anuncio**, **vendedor**, **comprador**, **revisor**, **revisión manual**, **Compra Garantizada** / **protección TruePhone** (the 10%), **Vendedor de confianza**, **pedido**, **favorito**, **estado**, **salud de batería**, **IMEI**, **Activation Lock** ("bloqueo de activación" on first use). Never `móvil`, never `reacondicionado` for TruePhone listings.

## On-page rules

| Element          | Rule                                                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Title            | ≤ 60 chars, keyword near the start, no brand (layout appends `· TruePhone`; `title: { absolute }` only to bypass it)  |
| Meta description | 120–155 chars, one benefit + one trust fact, natural sentence                                                          |
| H1               | Exactly one, matches intent, not identical to the title                                                                |
| H2/H3            | Question phrasing when it reads naturally                                                                              |
| Opening          | Answer in the first 100 words; details after                                                                           |
| Internal links   | ≥ 1 of `/explorar`, `/buscar?…`, `/vender`, `/ayuda#<cluster>`; descriptive anchors, never "clic aquí"                 |
| URLs             | Lowercase Spanish slugs, hyphens, no accents or stop words                                                             |
| Money            | Always COP, es-CO format like `formatOrderMoney`: `$ 2.350.000`                                                        |
| Images           | Descriptive Spanish `alt`; no key facts as text-in-image                                                               |
| Freshness        | Guides that mention prices or models carry "Actualizado: <mes año>" and keep it true                                   |
| Length           | FAQ answer 40–90 words · landing intro 60–120 · guide 800–1,500. Never pad                                             |

## Structured data

JSON-LD from a Server Component (`<script type="application/ld+json">`). Mark up only what is visible. Never IMEI, phone, or order data.

| Page                 | Schema                                                              |
| -------------------- | ------------------------------------------------------------------- |
| Home                 | `Organization` + `WebSite` (SearchAction)                           |
| `/ayuda`             | `FAQPage`                                                           |
| `/anuncios/[slug]`   | `Product` + `Offer` (COP, `UsedCondition`, availability) + `BreadcrumbList` |
| `/u/[username]`      | `ProfilePage` / `Person` (public fields only)                        |
| Guides               | `Article` + `BreadcrumbList` (+ `FAQPage` if Q&A section)           |
| Model / city landing | `CollectionPage` + `BreadcrumbList` (+ `FAQPage`)                   |

## Where content lives

| Content                                  | Location                                                                                  |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| Page title / description                 | `export const metadata` or `generateMetadata` in the route's `page.tsx`                   |
| Site defaults, `metadataBase`, OG        | `src/app/layout.tsx`                                                                      |
| FAQ                                      | `src/lib/help/faq.ts` (`FAQ_CLUSTERS`) → `/ayuda`                                         |
| Listing metadata                         | `src/app/anuncios/[slug]/page.tsx`                                                        |
| Sitemap / robots                         | `src/app/sitemap.ts`, `src/app/robots.ts` (Phase 18; create if missing)                   |
| Guides                               | `content/guias/<slug>.md` + `src/app/guias/` (index + `[slug]`). Add a new `.md` file; `published: false` keeps it off the sitemap. Confirm the slug with the user before publishing. |

Indexable: `/`, `/explorar`, `/buscar`, `/anuncios/[slug]`, `/u/[username]`, `/ayuda`, `/guias`, `/guias/[slug]`.
Never index: `(account)/*`, `/revision/*`, `/verificacion/*`, `/vender/[listingId]/*`, `/auth/*`, `(auth)/*`, `/api/*` → `robots: { index: false }`.

Code rules: Server Components; `Metadata` API (no `next/head`); read `node_modules/next/dist/docs/` for the installed Next.js before using metadata/sitemap/robots APIs; follow `.agents/skills/code-documentation`; reuse `AppShell`, `SiteFooter`, existing cards — no duplicate components.

## Checklist

- [ ] One searcher question; intent stated
- [ ] Title ≤ 60 · description 120–155 · one H1
- [ ] Spanish (Colombia), fixed terminology, COP in es-CO format
- [ ] Facts match `facts.md`: 10% · 8% one-time · 0% seller · $ 20.000 Premium Bogotá · Carrier + tracking · 24 h · manual review · Wompi · bank payout
- [ ] No forbidden claims: garantizado, gratis, el más seguro, reacondicionado, envío gratis, Android, cuotas, apps nativas, competitor bashing
- [ ] External facts verified with a live search and cited (Apple Support, Wompi, Colombian authority)
- [ ] Removing "TruePhone" would still leave a useful article; no sentence exists only to repeat a keyword
- [ ] ≥ 1 internal link with descriptive anchor; exactly one CTA (explorar · vender · ayuda)
- [ ] JSON-LD matches visible content; private routes not indexed
