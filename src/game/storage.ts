import type { GameState, TowerUpgrades } from "./types";
import { STORAGE_KEY, INITIAL_GOLD, INITIAL_LIVES, towerDefById } from "./constants";

export function createNewGameState(): GameState {
  return {
    version: 1,
    gold: INITIAL_GOLD,
    lives: INITIAL_LIVES,
    wave: 0,
    waveInProgress: false,
    towers: [],
    enemies: [],
    projectiles: [],
    enemiesToSpawn: 0,
    spawnTimer: 0,
    gameOver: false,
    killCount: 0,
  };
}

export function hasSavedGame(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (typeof parsed.version !== "number") return null;
    // Migrate towers saved before upgrade/sell support (or before the
    // goldPerSecond/roundEndBonus utility stats existed): always rebuild the
    // `upgrades` object, defaulting any missing field to 0, so old saves
    // don't crash.
    parsed.towers = parsed.towers.map((t) => {
      const anyTower = t as unknown as Record<string, unknown>;
      const existing = (anyTower.upgrades ?? {}) as Partial<TowerUpgrades>;
      const upgrades: TowerUpgrades = {
        damage: existing.damage ?? 0,
        fireRate: existing.fireRate ?? 0,
        range: existing.range ?? 0,
        goldPerSecond: existing.goldPerSecond ?? 0,
        roundEndBonus: existing.roundEndBonus ?? 0,
      };
      const def = towerDefById(t.defId);
      return {
        ...t,
        upgrades,
        totalSpent: typeof anyTower.totalSpent === "number" ? anyTower.totalSpent : def?.cost ?? 0,
      } as GameState["towers"][number];
    });
    // Migrate saves from before kill counter was tracked.
    if (typeof parsed.killCount !== "number") {
      parsed.killCount = 0;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable (e.g. private mode) - fail silently
  }
}

export function clearGameState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
