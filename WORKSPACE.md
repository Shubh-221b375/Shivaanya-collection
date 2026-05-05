# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Framer Motion + Tailwind CSS

## Application: Shivaanya Collection

A luxury e-commerce website for traditional Indian women's clothing.
- **Slogan**: "Shivaanya Collection – Elegance in Every Thread."
- **URL**: Preview path `/`

### Features
- Cinematic parallax hero with layered depth effects
- 3D card hover effects on product cards (mouse-move perspective transforms)
- Scroll-triggered animations (framer-motion useInView)
- Glassmorphism effects, marquee strip, animated gradient overlays
- Cormorant Garamond serif + Jost sans-serif typography
- Warm cream + deep burgundy + gold color palette

### Pages
- `/` — Home: Cinematic hero, brand story, featured products, category grid, testimonials
- `/shop` — Collections: Filterable product grid by category + search + sort
- `/product/:id` — Product Detail: Image gallery, color/size selection, add to cart, product story
- `/cart` — Cart: Items, quantity, promo code, order summary

### Data
- 12 products across 6 categories (Sarees, Lehengas, Salwar Suits, Anarkalis, Dupattas, Kurtis)
- Categories seeded with product counts
- Session-based cart using sessionStorage UUID

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── shivaanya/          # Shivaanya Collection frontend (React + Vite)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
│       └── schema/
│           ├── categories.ts
│           ├── products.ts
│           └── cart.ts
├── scripts/
│   └── src/seed.ts         # Database seeder
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## API Routes

- `GET /api/products` — List products (filter: `?category=&featured=&search=`)
- `GET /api/products/:id` — Get single product
- `GET /api/categories` — List categories
- `GET /api/cart?sessionId=` — Get cart
- `POST /api/cart` — Add to cart `{sessionId, productId, quantity, size, color}`
- `DELETE /api/cart/:itemId?sessionId=` — Remove from cart

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Seeding

Run: `pnpm --filter @workspace/scripts run seed`
