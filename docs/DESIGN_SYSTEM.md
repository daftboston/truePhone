# TruePhone Design System

Version 2.0

**Brand:** TruePhone  
**Visual source of truth:** [Figma](https://www.figma.com/design/nloCtrpFAgGr85fhmFoHzJ/Untitled?node-id=0-1)  
**Implementation:** `src/app/globals.css`

Former working name **iPhoneSeguro** in Figma is retired. Always use **TruePhone** in product UI and docs.

When Figma and this document disagree, update this document and CSS together. Figma wins on visuals.

---

# Philosophy

TruePhone should feel trustworthy before users read a single word.

The interface should feel clean, mobile-first, and closer to a premium verified marketplace than a classifieds board.

Goals:

- Trust
- Clarity
- Calm confidence
- Fast comprehension on mobile

Never flashy. Never cluttered.

---

# Color System

Colors communicate meaning. Never decoration.

## Primary (CTA / emphasis)

Near-black. Used for primary buttons (`Comprar Ahora`, `Iniciar Verificación`), high-emphasis text, and dark hero surfaces.

| Token              | Approx hex | CSS variable           |
| ------------------ | ---------- | ---------------------- |
| Primary            | `#0A0A0A`  | `--primary`            |
| Primary foreground | `#FFFFFF`  | `--primary-foreground` |

Confirm exact hex in Figma Dev Mode when available.

## Trust accent

Bright blue. Used for VERIFICADO badges, Compra Garantizada banners, trust links, and selected accents — **not** for primary CTAs.

| Token            | Approx hex | CSS variable         |
| ---------------- | ---------- | -------------------- |
| Trust            | `#2F6BFF`  | `--trust`            |
| Trust foreground | `#FFFFFF`  | `--trust-foreground` |

## Surfaces and neutrals

| Role                 | Approx hex | CSS variable           |
| -------------------- | ---------- | ---------------------- |
| Background           | `#FFFFFF`  | `--background`         |
| Foreground (text)    | `#111111`  | `--foreground`         |
| Card / muted surface | `#F4F4F5`  | `--card` / `--muted`   |
| Secondary text       | `#71717A`  | `--muted-foreground`   |
| Border / input       | `#E4E4E7`  | `--border` / `--input` |

## Semantic

| Meaning     | Use                                                | Token           |
| ----------- | -------------------------------------------------- | --------------- |
| Success     | Approved, verified success                         | `--success`     |
| Warning     | Pending, draft, attention                          | `--warning`     |
| Destructive | Errors, reject, delete                             | `--destructive` |
| Info        | Neutral tips (prefer `--trust` for brand trust UI) | `--info`        |

Never use semantic colors as decorative accents.

---

# Dark Mode

Supported via `.dark` class (`next-themes`).

Figma is light-first. Dark mode must:

- Keep primary CTAs high-contrast (light text on near-black or inverted carefully)
- Preserve trust blue readability
- Avoid blind inversion of gray surfaces

---

# Typography

Primary font: **Geist** (loaded in `layout.tsx`)  
Fallback: system UI / Inter

| Role                 | Guidance                              |
| -------------------- | ------------------------------------- |
| Display / page title | Large semibold (e.g. ~32–40px mobile) |
| Section title        | Semibold                              |
| Body                 | Regular, readable                     |
| Caption / meta       | Smaller muted text                    |
| Micro                | Badges, chips                         |

Weights: Regular, Medium, Semibold, Bold. Prefer hierarchy over excessive bold.

---

# Spacing

8-point grid. Prefer Tailwind spacing scale (4, 8, 12, 16, 24, 32, 40, 48, 64…).

Avoid arbitrary values unless matching Figma exactly.

---

# Radius

| Use              | Token                                      |
| ---------------- | ------------------------------------------ |
| Default controls | `--radius` (~10–12px / `0.625rem–0.75rem`) |
| Buttons / inputs | `rounded-md` / `rounded-lg`                |
| Cards / banners  | Medium–large                               |
| Badges / chips   | Pill or highly rounded                     |
| Avatars          | Full round                                 |

---

# Shadows

Use sparingly. Prefer borders and surface contrast. Soft elevation on cards/dialogs only.

---

# Icons

Lucide Icons. Icons support text; never replace essential labels.

---

# Buttons

Hierarchy:

1. **Primary** — black background, white text (one per section)
2. **Secondary / outline** — bordered, neutral
3. **Ghost** — low emphasis
4. **Destructive** — red for dangerous actions only
5. **Link** — trust blue or primary text underline

Full-width primary CTAs are common on mobile Figma screens.

---

# Navigation (mobile-first)

## Top header

- TruePhone logo / wordmark
- Cart or secondary action

## Bottom navigation

Five destinations:

1. Home
2. Search
3. Sell
4. Purchases (Mis compras)
5. Profile

Public marketing pages may use a simpler top nav; authenticated marketplace shell uses bottom nav per Figma.

---

# Marketplace patterns

- **Filter chips** — horizontal scroll (TODOS, model filters)
- **Listing cards** — image, model, battery, price, VERIFICADO
- **Price + fee breakdown** — equipment price vs protection fee
- **Guarantee banner** — trust blue band (Compra Garantizada)
- **Seller card** — avatar, name, verification badge
- **Step progress** — PASO X DE Y for verification flows
- **Review queue rows** — thumbnail, model, seller, timestamp, status tabs

---

# Components

Implement via shadcn/ui + project wrappers. See `docs/COMPONENT_LIBRARY.md` for the inventory and Phase 1 priority list.

Rules:

- No duplicate components
- Server Components by default
- Use design tokens — never hardcode one-off brand colors in features

---

# Accessibility

- Visible focus rings (`--ring`)
- Sufficient contrast on black CTAs and blue badges
- Keyboard navigation
- Reduced motion respected where animations exist
- Spanish (`lang="es"`) for Colombia

---

# Final Rule

If a design decision looks more impressive but less trustworthy, choose trust.

TruePhone is not trying to be the loudest marketplace. It is trying to be the one people trust most.
