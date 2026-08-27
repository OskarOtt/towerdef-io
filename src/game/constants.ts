import type { EnemyKind, TowerDef } from "./types";

export const INITIAL_GOLD = 10000;
export const INITIAL_LIVES = 20;

/** Delay in milliseconds before autostart kicks off the next wave. */
export const AUTO_START_DELAY_MS = 2200;

export const TOWER_DEFS: TowerDef[] = [
  {
    id: "blaster",
    name: "BLASTER",
    cost: 100,
    range: 2.5,
    damage: 8,
    fireRate: 2,
    icon: "^",
    color: "#33ff66",
    splashRadius: 0,
  },
  {
    id: "cannon",
    name: "CANNON",
    cost: 200,
    range: 3.0,
    damage: 20,
    fireRate: 0.9,
    icon: "#",
    color: "#FF8360",
    splashRadius: 1,
  },
  {
    id: "laser",
    name: "LASER",
    cost: 300,
    range: 3.5,
    damage: 14,
    fireRate: 3,
    icon: "*",
    color: "#33e0ff",
    splashRadius: 0,
  },
  {
    id: "ray",
    name: "RAY",
    cost: 400,
    range: 4.0,
    damage: 2,
    fireRate: 20,
    icon: "?",
    color: "#FF499E",
    splashRadius: 0,
  },
  {
    id: "god",
    name: "GOD",
    cost: 1000,
    range: 4.0,
    damage: 10,
    fireRate: 6,
    icon: "@",
    color: "#FFD700",
    splashRadius: 2,
  },
];

export function towerDefById(id: string): TowerDef | undefined {
  return TOWER_DEFS.find((t) => t.id === id);
}

/** Enemy HP/count scale with wave number to keep later waves harder. */
export function enemiesForWave(wave: number): number {
  return 6 + Math.floor(wave * 1.8);
}

/** Lowered from 20 base / 12 per wave to make early waves less punishing. */
export function enemyHpForWave(wave: number): number {
  return 14 + wave * 9;
}

export function enemySpeedForWave(wave: number): number {
  return Math.min(2.2, 1 + wave * 0.03);
}

/** Per-kind multipliers applied on top of the wave's base hp/speed. */
const ENEMY_KIND_STATS: Record<EnemyKind, { hp: number; speed: number; reward: number }> = {
  x: { hp: 1, speed: 1, reward: 1 },
  y: { hp: 0.6, speed: 1.35, reward: 0.8 },
  z: { hp: 2, speed: 0.65, reward: 1.6 },
  boss: { hp: 18, speed: 0.40, reward: 12 },
};

/** Waves before which y/z kinds cannot spawn yet. */
const Y_UNLOCK_WAVE = 9;
const Z_UNLOCK_WAVE = 19;

/** A boss (huge hp, slow, "Q" glyph) spawns once every this many waves. */
export const BOSS_WAVE_INTERVAL = 50;

export function isBossWave(wave: number): boolean {
  return wave > 0 && wave % BOSS_WAVE_INTERVAL === 0;
}

/** Weighted random enemy kind: x common, y and z less so, unlocked at later waves. */
export function randomEnemyKind(wave: number): EnemyKind {
  const yUnlocked = wave > Y_UNLOCK_WAVE;
  const zUnlocked = wave > Z_UNLOCK_WAVE;
  if (!yUnlocked) return "x";

  const roll = Math.random();
  if (!zUnlocked) {
    return roll < 0.7 ? "x" : "y";
  }
  if (roll < 0.55) return "x";
  if (roll < 0.8) return "y";
  return "z";
}

export function enemyHpForKind(baseHp: number, kind: EnemyKind): number {
  return Math.round(baseHp * ENEMY_KIND_STATS[kind].hp);
}

export function enemySpeedForKind(baseSpeed: number, kind: EnemyKind): number {
  return baseSpeed * ENEMY_KIND_STATS[kind].speed;
}

export function enemyRewardForKind(kind: EnemyKind): number {
  return Math.round(ENEMY_BASE_REWARD * ENEMY_KIND_STATS[kind].reward);
}

export const ENEMY_BASE_REWARD = 6;
export const SPAWN_INTERVAL = 0.7; // seconds between enemy spawns within a wave

export const STORAGE_KEY = "towerdef-io:save:v1";
