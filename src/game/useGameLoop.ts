import { useEffect, useRef } from "react";
import type { GameState, Enemy, TowerInstance } from "./types";
import { PATH_LENGTH, positionAtProgress } from "./path";
import {
  towerDefById,
  enemiesForWave,
  enemyHpForWave,
  enemySpeedForWave,
  enemyHpForKind,
  enemySpeedForKind,
  enemyRewardForKind,
  randomEnemyKind,
  isBossWave,
  CHAIN_JUMP_RANGE,
  CHAIN_FALLOFF,
  SPAWN_INTERVAL,
} from "./constants";
import { effectiveStats } from "./upgrades";
import { stackOffset } from "./stacking";

/** Progress units per second; small fast projectile crosses tower->target in ~0.15s. */
const PROJECTILE_SPEED = 6.5;

/** Chain bolts linger a bit longer than plain projectiles so the zigzag is readable. */
const BOLT_SPEED = 4;

let nextId = 1;
function genId(prefix: string): string {
  return `${prefix}-${nextId++}`;
}

/**
 * `isFirstOfWave` lets a boss wave spawn its single "Q" boss as the first
 * enemy of the wave, without needing extra state to track "boss already spawned".
 */
function spawnEnemy(wave: number, isFirstOfWave: boolean): Enemy {
  const kind = isFirstOfWave && isBossWave(wave) ? "boss" : randomEnemyKind(wave);
  const baseHp = enemyHpForWave(wave);
  const baseSpeed = enemySpeedForWave(wave);
  const hp = enemyHpForKind(baseHp, kind);
  return {
    id: genId("enemy"),
    kind,
    hp,
    maxHp: hp,
    speed: enemySpeedForKind(baseSpeed, kind),
    pathProgress: 0,
    reward: enemyRewardForKind(kind),
  };
}

function distance(
  a: { row: number; col: number },
  b: { row: number; col: number },
): number {
  return Math.hypot(a.row - b.row, a.col - b.col);
}

/** Breaks each segment into jagged sub-segments with perpendicular jitter, like a terminal lightning glyph trail. */
function zigzag(
  points: { row: number; col: number }[],
): { row: number; col: number }[] {
  const out = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const len = distance(a, b) || 1;
    const nx = -(b.col - a.col) / len;
    const ny = (b.row - a.row) / len;
    const steps = Math.max(2, Math.round(len * 3));
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      const j = (Math.random() - 0.5) * 0.35;
      out.push({
        row: a.row + (b.row - a.row) * t + ny * j,
        col: a.col + (b.col - a.col) * t + nx * j,
      });
    }
    out.push(b);
  }
  return out;
}

function tickTower(
  tower: TowerInstance,
  enemies: Enemy[],
  dt: number,
): { hitEnemyId: string | null; damage: number; splashRadius: number; chainTargets: number } {
  const def = towerDefById(tower.defId);
  if (!def) return { hitEnemyId: null, damage: 0, splashRadius: 0, chainTargets: 0 };
  // Utility towers (e.g. money printer) never target/shoot enemies.
  if (def.group === "utility") return { hitEnemyId: null, damage: 0, splashRadius: 0, chainTargets: 0 };
  const stats = effectiveStats(def, tower.upgrades);

  tower.cooldown = Math.max(0, tower.cooldown - dt);
  if (tower.cooldown > 0) return { hitEnemyId: null, damage: 0, splashRadius: 0, chainTargets: 0 };

  let closest: Enemy | null = null;
  let closestDist = Infinity;
  for (const enemy of enemies) {
    const pos = positionAtProgress(enemy.pathProgress);
    const d = distance(pos, { row: tower.row, col: tower.col });
    if (d <= stats.range && d < closestDist) {
      closest = enemy;
      closestDist = d;
    }
  }

  if (!closest) return { hitEnemyId: null, damage: 0, splashRadius: 0, chainTargets: 0 };

  tower.cooldown = 1 / stats.fireRate;
  return { hitEnemyId: closest.id, damage: stats.damage, splashRadius: def.splashRadius ?? 0, chainTargets: def.chainTargets ?? 0 };
}

/**
 * Advances the game state by `dt` seconds. Mutates a shallow-cloned copy of
 * `state` and returns the new state. Pure enough for React state updates.
 */
export function stepGame(state: GameState, dt: number): GameState {
  if (state.gameOver) return state;

  const towers = state.towers.map((t) => ({ ...t }));
  let enemies = state.enemies.map((e) => ({ ...e }));
  let projectiles = state.projectiles
    .map((p) => ({
      ...p,
      progress: p.progress + dt * (p.bolt ? BOLT_SPEED : PROJECTILE_SPEED),
    }))
    .filter((p) => p.progress < 1);

  let gold = state.gold;
  let lives = state.lives;
  let spawnTimer = state.spawnTimer;
  let enemiesToSpawn = state.enemiesToSpawn;
  let waveInProgress = state.waveInProgress;

  // Utility towers passively generate gold every tick, but only while a wave is active.
  if (waveInProgress) {
    for (const tower of towers) {
      const def = towerDefById(tower.defId);
      if (def?.group === "utility") {
        gold += effectiveStats(def, tower.upgrades).goldPerSecond * dt;
      }
    }
  }

  // Spawning
  if (waveInProgress && enemiesToSpawn > 0) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      const isFirstOfWave = enemiesToSpawn === enemiesForWave(state.wave);
      enemies.push(spawnEnemy(state.wave, isFirstOfWave));
      enemiesToSpawn -= 1;
      spawnTimer = SPAWN_INTERVAL;
    }
  }

  // Movement
  for (const enemy of enemies) {
    enemy.pathProgress += enemy.speed * dt;
  }

  // Enemies reaching the end damage lives
  const survivors: Enemy[] = [];
  for (const enemy of enemies) {
    if (enemy.pathProgress >= PATH_LENGTH) {
      lives -= 1;
    } else {
      survivors.push(enemy);
    }
  }
  enemies = survivors;

  // Towers shoot
  for (const tower of towers) {
    const { hitEnemyId, damage, splashRadius, chainTargets } = tickTower(tower, enemies, dt);
    if (hitEnemyId) {
      const target = enemies.find((e) => e.id === hitEnemyId);
      if (target) {
        const targetPos = positionAtProgress(target.pathProgress);
        let bolt: { row: number; col: number }[] | undefined;
        if (chainTargets > 0) {
          const hit = new Set([target.id]);
          const offset = stackOffset(towers, tower);
          const points = [
            { row: tower.row + offset.row, col: tower.col + offset.col },
            targetPos,
          ];
          target.hp -= damage;
          let last = targetPos;
          let dmg = damage;
          while (hit.size < chainTargets) {
            let next: Enemy | null = null;
            let nextDist = CHAIN_JUMP_RANGE;
            for (const enemy of enemies) {
              if (hit.has(enemy.id)) continue;
              const d = distance(positionAtProgress(enemy.pathProgress), last);
              if (d <= nextDist) {
                next = enemy;
                nextDist = d;
              }
            }
            if (!next) break;
            hit.add(next.id);
            dmg *= CHAIN_FALLOFF;
            next.hp -= dmg;
            last = positionAtProgress(next.pathProgress);
            points.push(last);
          }
          bolt = zigzag(points);
        } else if (splashRadius > 0) {
          for (const enemy of enemies) {
            const pos = positionAtProgress(enemy.pathProgress);
            if (distance(pos, targetPos) <= splashRadius) {
              enemy.hp -= damage;
            }
          }
        } else {
          target.hp -= damage;
        }
        const offset = stackOffset(towers, tower);
        projectiles.push({
          id: genId("proj"),
          fromRow: tower.row + offset.row,
          fromCol: tower.col + offset.col,
          toRow: targetPos.row,
          toCol: targetPos.col,
          targetEnemyId: target.id,
          damage,
          bolt,
          progress: 0,
        });
      }
    }
  }

  // Remove dead enemies, grant gold
  const alive: Enemy[] = [];
  let killCount = state.killCount;
  for (const enemy of enemies) {
    if (enemy.hp <= 0) {
      gold += enemy.reward;
      killCount += 1;
    } else {
      alive.push(enemy);
    }
  }
  enemies = alive;

  let cleanWaveStreak = state.cleanWaveStreak;
  let noSpendWaveStreak = state.noSpendWaveStreak;
  let spentSinceWaveClear = state.spentSinceWaveClear;
  let lowLifeWaveClears = state.lowLifeWaveClears;

  if (waveInProgress && enemiesToSpawn === 0 && enemies.length === 0) {
    waveInProgress = false;
    if (lives > 0) {
      cleanWaveStreak = lives === state.livesAtWaveStart ? cleanWaveStreak + 1 : 0;
      noSpendWaveStreak = spentSinceWaveClear ? 0 : noSpendWaveStreak + 1;
      if (lives <= 5) lowLifeWaveClears += 1;
    }
    spentSinceWaveClear = false;
    // Pay out utility towers' round-end bonus (e.g. money printer) once the wave clears.
    for (const tower of towers) {
      const def = towerDefById(tower.defId);
      if (def?.group === "utility") {
        gold += effectiveStats(def, tower.upgrades).roundEndBonus;
      }
    }
  }

  const gameOver = lives <= 0;

  return {
    ...state,
    towers,
    enemies,
    projectiles,
    gold,
    lives: Math.max(0, lives),
    spawnTimer,
    enemiesToSpawn,
    waveInProgress,
    gameOver,
    killCount,
    cleanWaveStreak,
    noSpendWaveStreak,
    spentSinceWaveClear,
    lowLifeWaveClears,
  };
}

export function startNextWave(state: GameState): GameState {
  if (state.waveInProgress || state.gameOver) return state;
  const wave = state.wave + 1;
  return {
    ...state,
    wave,
    waveInProgress: true,
    livesAtWaveStart: state.lives,
    enemiesToSpawn: enemiesForWave(wave),
    spawnTimer: 0,
  };
}

/**
 * Runs a requestAnimationFrame loop calling `onTick(dt)` every frame while
 * `running` is true. Caller is responsible for applying dt via `stepGame`.
 */
export function useGameLoop(
  running: boolean,
  onTick: (dt: number) => void,
): void {
  const callbackRef = useRef(onTick);

  useEffect(() => {
    callbackRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      callbackRef.current(dt);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);
}
