# TruePhone AI Instructions

## Project Documentation

Before implementing any feature, read the following documents in order:

1. docs/PRD.md
2. docs/ARCHITECTURE.md
3. docs/DATABASE.md
4. docs/plan.md
5. docs/UX_PRINCIPLES.md
6. docs/DESIGN_SYSTEM.md
7. docs/COPY_GUIDELINES.md
8. docs/COMPONENT_LIBRARY.md

These documents are the source of truth for the project.

Never violate their principles.

If implementation conflicts with the documentation, ask for clarification instead of making assumptions.

## Design source

Visual UI follows the Figma file referenced in `docs/DESIGN_SYSTEM.md` and `docs/plan.md`.

- Product brand is **TruePhone** (legacy “iPhoneSeguro” labels in Figma are ignored)
- On visual conflicts, Figma + DESIGN_SYSTEM win over older prose
- Tokens are implemented in `src/app/globals.css`

---

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
