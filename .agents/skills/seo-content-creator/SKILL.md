---
name: seo-content-creator
description: Creates helpful, search-optimized Spanish (Colombia) content for TruePhone public pages — page titles and meta descriptions, FAQ entries, model/city landing copy, buying and selling guides, blog articles, Open Graph copy, and JSON-LD structured data. Use when the user asks for SEO, keywords, metadata, meta description, landing copy, blog posts, guías, artículos, FAQ content, structured data, or organic growth content for TruePhone.
---

# TruePhone SEO Content Creator

Write content that ranks because it is genuinely useful to Colombians buying or selling a used iPhone, and that reinforces TruePhone's only product: **trust**.

Content language: **Spanish (Colombia)**. Code, comments, and this skill: English.

## Read before writing

1. `docs/COPY_GUIDELINES.md` — voice, terminology, transparency rules (always).
2. [facts.md](facts.md) — verified product facts you may claim, and claims you must never make.
3. `docs/PRD.md` §29 (Home), §41 (Help Center), §53 (SEO) — what public pages exist and why.
4. `docs/plan.md` Phase 18 (SEO) and Phase 23 (FAQ) — scope you may touch.

If a requested claim is not in `facts.md` or the docs, verify it in the docs first. If it conflicts with them, stop and ask instead of inventing.

## Workflow

```
Content task:
- [ ] 1. Identify page + intent (buy / sell / trust / how-to / model / city)
- [ ] 2. Pick primary keyword + 3-6 secondary terms (see keywords.md)
- [ ] 3. Check facts.md for every factual claim
- [ ] 4. Draft with the matching template (templates.md)
- [ ] 5. Run the checklist at the bottom of this file
- [ ] 6. Place content in the right file/route (see "Where content lives")
```

**Step 1 — Intent.** Every piece answers one searcher question. State it in one line before drafting (e.g. "¿Es seguro comprar un iPhone usado en Colombia?"). If the piece would answer two questions, split it.

**Step 2 — Keywords.** Colombian Spanish: `iPhone usado`, `celular`, `de segunda`, `Bogotá`, `Medellín`, `COP`. Never `móvil`, `de segunda mano` as primary, or `reacondicionado` as a description of TruePhone listings (TruePhone sells used iPhones from individual sellers, not refurbished units). Use [keywords.md](keywords.md) for clusters and page mapping.

**Step 3 — Facts.** Fees, shipping, the 24-hour rule, review process, and payments are locked in docs. Quote them exactly. See [facts.md](facts.md).

**Step 4 — Draft.** Use [templates.md](templates.md): metadata, FAQ item, landing page, guide/article, JSON-LD.

## Voice for SEO content

Same voice as the app: an Apple Store Specialist explaining, not a salesperson.

| Do                                                          | Don't                                                            |
| ----------------------------------------------------------- | ---------------------------------------------------------------- |
| "Cada anuncio lo revisa una persona antes de publicarse."   | "¡El marketplace MÁS seguro de Colombia!"                        |
| "Pagas el precio del equipo más 10% de protección."         | "Sin costos" / "Gratis" (buyer pays 10%)                         |
| "Tienes 24 horas después de marcar «Ya recibí» para..."     | "Garantía total" / "Garantizado" / "Devolución sin preguntas"    |
| Short sentences. One idea each.                             | Filler intros ("En el mundo actual de la tecnología...")         |
| Concrete steps, real numbers in COP                         | Superlatives: increíble, perfecto, revolucionario, el mejor      |
| Trust words: revisado, verificado, protegido, transparente  | Fear-based urgency: "¡No te arriesgues!", "Últimas unidades"     |

Use fixed terminology from `docs/COPY_GUIDELINES.md`: **anuncio** (not publicación/aviso), **vendedor**, **comprador**, **revisor**, **revisión manual**, **Compra Garantizada** / **protección TruePhone** (the 10% fee), **Vendedor de confianza**, **pedido**, **favorito**, **estado**, **salud de batería**, **IMEI**, **Activation Lock** (explain as "bloqueo de activación" on first use).

## On-page SEO rules

- **Title**: ≤ 60 characters, primary keyword near the start, no brand suffix (root layout appends `· TruePhone` via `title.template`; use `title: { absolute: "…" }` only when a page must bypass the template, e.g. the home page).
- **Meta description**: 120–155 characters, one benefit + one trust fact, natural sentence, no keyword lists.
- **H1**: exactly one, matches search intent, not identical to the title tag.
- **H2/H3**: phrase as questions people actually search when it reads naturally.
- **First 100 words**: answer the question directly; details after.
- **Internal links**: every article links to at least one of `/explorar`, `/buscar?...`, `/vender`, `/ayuda#<cluster>`. Use descriptive anchors ("ver iPhone 13 usados revisados"), never "clic aquí".
- **URLs**: lowercase Spanish slugs, hyphens, no accents, no stop words (`/guias/como-comprar-iphone-usado-colombia`).
- **Money**: always COP; match `formatOrderMoney` (es-CO): `$ 2.350.000` — write "COP" once nearby when the context is not obviously pesos.
- **Images**: descriptive Spanish `alt` (model, color, angle). No text-in-image for key facts.
- **Dates/freshness**: for guides that mention prices or models, include an "Actualizado: <mes año>" line and keep it true.
- **Length**: as long as the answer needs. FAQ answer 40–90 words; guide 800–1,500 words; landing intro 60–120 words. Never pad.

## Structured data

Emit JSON-LD from a Server Component via `<script type="application/ld+json">` with `JSON.stringify`. Only mark up what is visibly on the page.

| Page                    | Schema                                   |
| ----------------------- | ---------------------------------------- |
| Home                    | `Organization` + `WebSite` (SearchAction)|
| `/ayuda`                | `FAQPage`                                |
| `/anuncios/[slug]`      | `Product` + `Offer` (COP, `UsedCondition`, `availability`) + `BreadcrumbList` |
| `/u/[username]`         | `Person` or `ProfilePage` (only public fields) |
| Guides / blog           | `Article` + `BreadcrumbList` (+ `FAQPage` if the guide has a Q&A section) |
| Model / city landings   | `CollectionPage` + `BreadcrumbList` (+ `FAQPage`) |

Snippets live in [templates.md](templates.md). Never include IMEI, seller phone, or private order data in structured data.

## Where content lives

| Content                          | Location                                                                 |
| -------------------------------- | ------------------------------------------------------------------------ |
| Page title/description           | `export const metadata` or `generateMetadata` in that route's `page.tsx` |
| Site-wide defaults, `metadataBase`, OG defaults | `src/app/layout.tsx`                                   |
| FAQ questions and answers        | `src/lib/help/faq.ts` (`FAQ_CLUSTERS`) — rendered at `/ayuda`            |
| Listing page metadata            | `src/app/anuncios/[slug]/page.tsx` (`generateMetadata`)                  |
| Sitemap / robots                 | `src/app/sitemap.ts`, `src/app/robots.ts` (Phase 18 — create if missing) |
| Guides / blog / landing pages    | Not shipped yet ("Blog foundation (future)", Phase 18). Deliver copy as Markdown/TSX draft and confirm route placement with the user before adding new routes. |

Public, indexable routes: `/`, `/explorar`, `/buscar`, `/anuncios/[slug]`, `/u/[username]`, `/ayuda`.
Never optimize or index: `(account)/*`, `/revision/*`, `/verificacion/*`, `/vender/[listingId]/*`, `/auth/*`, `(auth)/*`, `/api/*`. Add `robots: { index: false }` metadata when touching those.

Implementation rules when writing code: Server Components, `Metadata` API (no `next/head`), read `node_modules/next/dist/docs/` for the installed Next.js version before using metadata, sitemap, or robots APIs (this Next.js differs from training data). Follow `.agents/skills/code-documentation` for file/function headers. Do not create duplicate UI components — reuse `AppShell`, `SiteFooter`, existing cards.

## Helpful-content self-check (Google "people-first")

Before finishing, all must be true:

- A Colombian buyer or seller learns something they can act on in the next 5 minutes.
- Every factual claim is traceable to `facts.md`, `docs/`, or a cited primary source (Apple Support, Wompi, Colombian authority). External references are verified with a live search, never remembered.
- Removing TruePhone's name would still leave a useful article (not an ad).
- No sentence exists only to repeat a keyword.
- A reader knows what to do next (one clear CTA: explorar, vender, or leer ayuda).

## Checklist

- [ ] Intent stated; one question per piece
- [ ] Title ≤ 60 chars; description 120–155 chars; one H1
- [ ] Spanish (Colombia); fixed terminology; COP with es-CO formatting
- [ ] Facts match `facts.md` (10% / 8% / $ 20.000 Premium / 24 h / manual review / Wompi / bank payout)
- [ ] No forbidden claims (garantizado, gratis, el más seguro, reacondicionado, Android, cuotas, apps nativas)
- [ ] Internal links with descriptive anchors; one CTA
- [ ] JSON-LD matches visible content; no private data
- [ ] Private routes not indexed
- [ ] Code follows Next.js Metadata API + code-documentation skill

## Additional resources

- [facts.md](facts.md) — verified claims and forbidden claims
- [keywords.md](keywords.md) — Colombian Spanish keyword clusters and page mapping
- [templates.md](templates.md) — metadata, FAQ, landing, guide, and JSON-LD templates
