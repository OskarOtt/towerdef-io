# towerdef-io

A browser-based, terminal/CRT-themed tower defense game built with React 19 + TypeScript + Vite. No backend — all state lives client-side and persists to `localStorage`.

## Commands

- `npm run dev` — start Vite dev server with HMR
- `npm run build` — type-check (`tsc -b`) then production build (`vite build`)
- `npm run lint` — run Oxlint (config in `.oxlintrc.json`)
- `npm run preview` — preview the production build locally

There is no test suite configured in this repo. Deployment is automatic via `.github/workflows/deploy.yml` (builds and publishes `dist/` to GitHub Pages on push to `main`).

## Architecture

- `src/game/` contains all game logic, deliberately decoupled from React/rendering:
  - `types.ts` — core data types (`GameState`, `TowerInstance`, `Enemy`, `Projectile`, etc.). All kept as plain JSON-serializable objects so `GameState` can round-trip through `localStorage` without custom (de)serialization.
  - `constants.ts` — tower definitions (`TOWER_DEFS`), wave/enemy scaling formulas, and tuning constants (gold, lives, spawn interval).
  - `path.ts` — builds the fixed serpentine enemy path as a list of grid coords; `positionAtProgress` converts fractional path progress into interpolated grid position.
  - `upgrades.ts` — per-tower upgrade cost/effect and sell-value calculations.
  - `storage.ts` — localStorage save/load/clear, including migration logic for older save-file shapes (e.g. defaulting missing `upgrades`/`totalSpent`/`killCount` fields so old saves don't crash).
  - `useGameLoop.ts` — the game engine: `stepGame(state, dt)` is a pure(ish) function that advances the simulation by `dt` seconds (spawning, movement, tower targeting/firing, splash damage, enemy death/rewards, wave completion, game over). `startNextWave(state)` kicks off a wave. `useGameLoop(running, onTick)` is a `requestAnimationFrame`-driven hook that calls `onTick(dt)` every frame.
- `src/App.tsx` is the top-level orchestrator: owns `GameState` in React state, wires up autosave (on every state change while playing), autostart-next-wave countdown, and all the tower placement/upgrade/sell handlers. It renders `WelcomeModal`, `TowerShop`, `GameBoard`, `Hud`, and `TowerUpgradePanel` (`src/components/`).
- Game state updates flow one-directionally: UI events call handlers in `App.tsx` → these produce a new `GameState` via functions in `src/game/` → React re-renders. The simulation tick (`stepGame`) is the only place gameplay math happens; components are otherwise presentational.

## Conventions

- Grid positions use `{ row, col }` (`GridCoord`), not `{ x, y }`.
- Enemy position along the path is a single float `pathProgress` (e.g. `3.4` = 40% of the way from `PATH[3]` to `PATH[4]`), not a row/col pair — use `positionAtProgress()` to resolve it.
- Tower stat upgrades (`damage`, `fireRate`, `range`) are independent, uncapped integer levels; use `effectiveStats()` (in `upgrades.ts`) to get a tower's current stats rather than reading `TowerDef` fields directly.
- IDs for towers/enemies/projectiles are generated with simple prefixed counters/timestamps (see `genId` in `useGameLoop.ts`, tower id generation in `App.tsx`), not UUIDs.
- When changing `GameState` shape, add migration handling in `storage.ts` (`loadGameState`) and bump `version` if needed, so existing players' saved games don't break.
- Comments are used to explain non-obvious "why" (e.g. balance tuning, save migration reasons) — follow this style for similarly non-obvious logic rather than narrating obvious code.
