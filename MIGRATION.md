# Migration Notes

## Tooling Detection

- Existing project was a static HTML gallery with vanilla JS (`premium-gallery.js`).
- No build toolchain was present; migration performed to Vite + React + Tailwind for maintainability and production builds.

## Key Changes

- Introduced Vite React stack with Tailwind, Vitest, and Playwright.
- Normalised data loading via `src/lib/schema.ts` and `src/data/manifest.json`.
- Restored cart, search, categories, CSV/PDF export, and mailto share through new React components and hooks.
- Added PWA service worker (via `vite-plugin-pwa`) with image caching and fallback assets.
- Added `scripts/mirror-images.mjs` to mirror remote assets into the repo.

## Feature Flags

- Toggle restored features in `src/config/features.ts`.

## Testing

- Unit tests under `tests/unit` cover cart logic, CSV formatting, and filter composition.
- Playwright E2E test (`tests/e2e/gallery.spec.ts`) validates cart + CSV export flow against a preview server.

## Data Strategy

- Local images live in `images/` and are resolved via `src/lib/images.ts`, with a vector placeholder embedded for missing files.
- Manifest normaliser derives categories from code prefixes when explicit values are missing.
