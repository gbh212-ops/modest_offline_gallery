# Modest Offline Gallery

An offline-first product gallery for Modest Bridal built with Vite, React, and Tailwind CSS. The app restores cart, search, category filtering, CSV/PDF export, and email sharing capabilities while remaining fully functional when offline.

## Features

- 🔍 **Fuzzy search** across titles, descriptions, categories, and tags.
- 🏷️ **Category chips** with multi-select filters generated from the manifest.
- 🛒 **Persistent cart** with localStorage, quantity controls, and subtotal.
- 📤 **Exports** for CSV (filtered view) and PDF (grid and single-page layouts).
- ✉️ **Mailto sharing** that composes an email using cart selections.
- ⚡ **Offline support** via PWA service worker and local image cache with fallbacks.
- 📄 **Manifest normalizer** that accepts legacy fields and standardises gallery items.

## Getting Started

```bash
npm install
npm run dev
```

The development server runs at <http://localhost:5173>.

### Production build

```bash
npm run build
npm run preview
```

The preview server defaults to <http://127.0.0.1:4173>. Use this endpoint for Playwright tests.

### Tests

- Unit tests: `npm run test:unit`
- E2E tests: `npm run test:e2e` (requires `npm run build && npm run preview` running in another terminal and the optional dependency `@playwright/test`)

## Manifest & Data

Gallery items are defined in `src/data/manifest.json`. A normaliser in `src/lib/schema.ts` supports historical fields (`code`, `collection`, `silhouette`, `tags`, etc.) and generates derived categories when missing.

To mirror remote images locally, run:

```bash
node scripts/mirror-images.mjs src/data/manifest.json images/mirrored
```

## Offline Notes

- All local source images live under the top-level `images/` directory. Any remote URLs will be downloaded into `images/mirrored` by the mirror script.
- The service worker (via `vite-plugin-pwa`) precaches the application shell and caches images using a cache-first strategy with 30-day retention.
- Image components fall back to an embedded SVG placeholder whenever a resource fails to load.

## Feature Flags

Feature toggles are defined in `src/config/features.ts`. They default to `true` for restored functionality and can be disabled for troubleshooting or phased rollouts.

## Migration Notes

See `MIGRATION.md` for details on the toolchain upgrade and restored features.
