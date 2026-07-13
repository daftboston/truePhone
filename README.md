# TruePhone

Trusted marketplace for buying and selling used iPhones in Colombia.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma + Supabase Postgres
- Vercel (deployment target)

## Getting started

```bash
cp .env.example .env
npm install
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command                | Description              |
| ---------------------- | ------------------------ |
| `npm run dev`          | Start development server |
| `npm run build`        | Production build         |
| `npm run lint`         | ESLint                   |
| `npm run typecheck`    | TypeScript check         |
| `npm run format`       | Prettier write           |
| `npm run format:check` | Prettier check           |

## Documentation

Read in this order before implementing features:

1. `docs/PRD.md`
2. `docs/ARCHITECTURE.md`
3. `docs/UX_PRINCIPLES.md`
4. `docs/DESIGN_SYSTEM.md`
5. `docs/COPY_GUIDELINES.md`
6. `docs/COMPONENT_LIBRARY.md`

Development phases: `docs/plan.md`

## Deploy on Vercel

Connect the GitHub repo at [vercel.com/new](https://vercel.com/new) and set the environment variables from `.env.example`.
