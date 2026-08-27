import type { GameState } from "./types";
import { STORAGE_KEY, INITIAL_GOLD, INITIAL_LIVES, towerDefById } from "./constants";
import { emptyUpgrades } from "./upgrades";

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
    // Migrate towers saved before upgrade/sell support: fill defaults for any
    // missing `upgrades`/`totalSpent` fields so old saves don't crash.
    parsed.towers = parsed.towers.map((t) => {
      const anyTower = t as unknown as Record<string, unknown>;
      if (anyTower.upgrades && typeof anyTower.totalSpent === "number") return t;
      const def = towerDefById(t.defId);
      return {
        ...t,
        upgrades: anyTower.upgrades ?? emptyUpgrades(),
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
