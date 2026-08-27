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
  SPAWN_INTERVAL,
} from "./constants";
import { effectiveStats } from "./upgrades";

/** Progress units per second; small fast projectile crosses tower->target in ~0.15s. */
const PROJECTILE_SPEED = 6.5;

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

function tickTower(
  tower: TowerInstance,
  enemies: Enemy[],
  dt: number,
): { hitEnemyId: string | null; damage: number; splashRadius: number } {
  const def = towerDefById(tower.defId);
  if (!def) return { hitEnemyId: null, damage: 0, splashRadius: 0 };
  const stats = effectiveStats(def, tower.upgrades);

  tower.cooldown = Math.max(0, tower.cooldown - dt);
  if (tower.cooldown > 0) return { hitEnemyId: null, damage: 0, splashRadius: 0 };

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

  if (!closest) return { hitEnemyId: null, damage: 0, splashRadius: 0 };

  tower.cooldown = 1 / stats.fireRate;
  return { hitEnemyId: closest.id, damage: stats.damage, splashRadius: def.splashRadius ?? 0 };
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
    .map((p) => ({ ...p, progress: p.progress + dt * PROJECTILE_SPEED }))
    .filter((p) => p.progress < 1);

  let gold = state.gold;
  let lives = state.lives;
  let spawnTimer = state.spawnTimer;
  let enemiesToSpawn = state.enemiesToSpawn;
  let waveInProgress = state.waveInProgress;

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
    const { hitEnemyId, damage, splashRadius } = tickTower(tower, enemies, dt);
    if (hitEnemyId) {
      const target = enemies.find((e) => e.id === hitEnemyId);
      if (target) {
        const targetPos = positionAtProgress(target.pathProgress);
        if (splashRadius > 0) {
          for (const enemy of enemies) {
            const pos = positionAtProgress(enemy.pathProgress);
            if (distance(pos, targetPos) <= splashRadius) {
              enemy.hp -= damage;
            }
          }
        } else {
          target.hp -= damage;
        }
        projectiles.push({
          id: genId("proj"),
          fromRow: tower.row,
          fromCol: tower.col,
          toRow: targetPos.row,
          toCol: targetPos.col,
          targetEnemyId: target.id,
          damage,
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

  if (waveInProgress && enemiesToSpawn === 0 && enemies.length === 0) {
    waveInProgress = false;
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
  };
}

export function startNextWave(state: GameState): GameState {
  if (state.waveInProgress || state.gameOver) return state;
  const wave = state.wave + 1;
  return {
    ...state,
    wave,
    waveInProgress: true,
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
