# TruePhone AI Instructions

## Project Documentation

Before implementing any feature, read the following documents in order:

1. docs/PRD.md
2. docs/ARCHITECTURE.md
3. docs/DATABASE.md
4. docs/plan.md
5. docs/FINANCIAL_MODEL.md
6. docs/SHIPPING.md
7. docs/UX_PRINCIPLES.md
8. docs/DESIGN_SYSTEM.md
9. docs/COPY_GUIDELINES.md
10. docs/COMPONENT_LIBRARY.md

These documents are the source of truth for the project.

Never violate their principles.

If implementation conflicts with the documentation, ask for clarification instead of making assumptions.

## Business logic vs visual design

| Concern                               | Source of truth                                         |
| ------------------------------------- | ------------------------------------------------------- |
| What to build, when, and why          | `docs/plan.md` + `docs/PRD.md`                          |
| Money, fees, payouts, refunds         | `docs/FINANCIAL_MODEL.md`                               |
| Shipping methods & custody            | `docs/SHIPPING.md`                                      |
| Colors, type, spacing, component look | `docs/DESIGN_SYSTEM.md` + Figma + `src/app/globals.css` |

- Product brand is **TruePhone** (legacy “iPhoneSeguro” labels in Figma are ignored)
- Absorb **design system** from Figma only — not business logic or feature priority
- On visual conflicts, DESIGN_SYSTEM + Figma win; on product conflicts, plan.md + PRD win

---

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
