```
 ___  __        ___  __   __   ___  ___     __  
  |  /  \ |  | |__  |__) |  \ |__  |__   | /  \
  |  \__/ |/\| |___ |  \ |__/ |___ |    .| \__/
```

A browser-based, terminal/CRT-themed tower defense game built with React 19, TypeScript, and Vite. There is no backend — all game state lives client-side and persists to `localStorage`.

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

Pushes to `main` automatically build and publish `dist/` to GitHub Pages via `.github/workflows/deploy.yml`.

### Custom domain and SEO

The production URL is `https://towerdef.io/`. The build publishes a `CNAME`, `robots.txt`, and `sitemap.xml` for that domain. Before deploying it, configure `towerdef.io` as the repository's GitHub Pages custom domain and point its DNS records to GitHub Pages.

To add the site to Google Search Console, create a URL-prefix property for `https://towerdef.io/`, add the verification meta tag Google provides to `index.html`, deploy it, and submit `https://towerdef.io/sitemap.xml`.
