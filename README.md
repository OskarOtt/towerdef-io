```
 ___  __        ___  __   __   ___  ___     __  
  |  /  \ |  | |__  |__) |  \ |__  |__   | /  \
  |  \__/ |/\| |___ |  \ |__/ |___ |    .| \__/
```

A browser-based, terminal/CRT-themed tower defense game built with React 19, TypeScript, and Vite. Game state lives client-side and persists to `localStorage`. An optional backend (`towerdef-backend`) powers the leaderboard: set `VITE_API_URL` (see `.env.example`); when empty, `/api` is used same-origin and the Vite dev server proxies it to `localhost:8080`. Scores are sent every 5 minutes while playing, and via `[ UPDATE SCORE ]` in the leaderboard view; players without a leaderboard name are never submitted.

## Getting started

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — start the Vite dev server with HMR
- `npm run build` — type-check (`tsc -b`) then produce a production build
- `npm run lint` — run Oxlint
- `npm run preview` — preview the production build locally

## Project structure

- `src/game/` — game logic (types, constants, path, upgrades, storage, game loop), decoupled from React
- `src/components/` — presentational UI components (shop, board, HUD, upgrade panel)
- `src/App.tsx` — top-level orchestrator that owns game state and wires up handlers

## Deployment

Pushes to `main` build the Docker image (nginx serving `dist/`, see `Dockerfile`/`nginx.conf`), push it to GHCR, and apply `k8s/` manifests to the MicroK8s cluster via `.github/workflows/deploy.yml`. The API URL is baked in at build time through the `VITE_API_URL` build arg.

### Custom domain and SEO

The production URL is `https://towerdef.io/`. `npm run build`'s `prebuild` step
(`scripts/generate-seo-assets.mjs`) generates, into `public/`: `CNAME`,
`robots.txt`, `sitemap.xml` (with `<lastmod>` and entries for the static
`how-to-play.html`/`towers.html` pages), `manifest.json`'s referenced icons
(`apple-touch-icon.png`, `icon-192.png`, `icon-512.png`), and a branded
`og-image.png` social share image — all derived from `scripts/seo-config.mjs`
and `public/favicon.svg`. `index.html` uses `__SITE_TITLE__` /
`__SITE_DESCRIPTION__` / `__SITE_KEYWORDS__` / `__SITE_URL__` placeholders
(replaced by the `inject-seo-metadata` Vite plugin in `vite.config.ts`) for the
title, meta tags, canonical URL, and Open Graph/Twitter tags, plus inline
JSON-LD `VideoGame` structured data. Before deploying, point the DNS records for `towerdef.io` at the cluster
(the Ingress in `k8s/ingress.yaml` serves it with a cert-manager TLS cert).

To add the site to Google Search Console, create a URL-prefix property for
`https://towerdef.io/`, add the verification meta tag Google provides to
`index.html`, deploy it, and submit `https://towerdef.io/sitemap.xml`.
