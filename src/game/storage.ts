import type { GameState, TowerUpgrades } from "./types";
import { STORAGE_KEY, CURRENT_GAME_VERSION, INITIAL_GOLD, INITIAL_LIVES, towerDefById } from "./constants";

export function createNewGameState(): GameState {
  return {
    version: CURRENT_GAME_VERSION,
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
    livesAtWaveStart: INITIAL_LIVES,
    cleanWaveStreak: 0,
    spentSinceWaveClear: false,
    noSpendWaveStreak: 0,
    lowLifeWaveClears: 0,
    godTowersPlaced: 0,
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
    // Migrate saves from before wave-streak achievement tracking.
    if (typeof parsed.livesAtWaveStart !== "number") parsed.livesAtWaveStart = parsed.lives;
    if (typeof parsed.cleanWaveStreak !== "number") parsed.cleanWaveStreak = 0;
    if (typeof parsed.spentSinceWaveClear !== "boolean") parsed.spentSinceWaveClear = false;
    if (typeof parsed.noSpendWaveStreak !== "number") parsed.noSpendWaveStreak = 0;
    if (typeof parsed.lowLifeWaveClears !== "number") parsed.lowLifeWaveClears = 0;
    // Old saves can't tell how many GOD towers were ever placed; assume the current count.
    if (typeof parsed.godTowersPlaced !== "number") {
      parsed.godTowersPlaced = parsed.towers.filter((t) => t.defId === "god").length;
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
