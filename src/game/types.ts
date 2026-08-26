// Core data types for the tower defense game.
// Kept as plain, JSON-serializable objects so the whole GameState can be
// round-tripped through localStorage without any custom (de)serialization.

export type GridCoord = { row: number; col: number };

export type CellKind = "empty" | "path" | "buildable";

/** Static definition of a tower type available in the shop. */
export interface TowerDef {
  id: string;
  name: string;
  cost: number;
  range: number; // in grid cells
  damage: number;
  fireRate: number; // shots per second
  icon: string; // simple ascii/emoji glyph rendered on the tower
  color: string;
  /** Radius in grid cells for splash damage around the primary target. Omitted/0 = single-target only. */
  splashRadius?: number;
}

/** Per-stat upgrade levels applied to a placed tower. Uncapped. */
export interface TowerUpgrades {
  damage: number;
  fireRate: number;
  range: number;
}

/** A tower the player has placed on the board. */
export interface TowerInstance {
  id: string;
  defId: string;
  row: number;
  col: number;
  /** Independent upgrade levels for damage/fireRate/range, each starting at 0. */
  upgrades: TowerUpgrades;
  /** Total gold ever spent on this tower (base cost + all upgrades paid). Used for sell refund. */
  totalSpent: number;
  cooldown: number; // seconds until next shot is allowed
}

/** x = balanced baseline, y = weaker/faster runner, z = tanky/slower. */
export type EnemyKind = "x" | "y" | "z";

export interface Enemy {
  id: string;
  kind: EnemyKind;
  hp: number;
  maxHp: number;
  speed: number; // cells per second
  /** Fractional progress index along the path array (e.g. 3.4 = 40% between path[3] and path[4]). */
  pathProgress: number;
  reward: number;
}

export interface Projectile {
  id: string;
  fromRow: number;
  fromCol: number;
  /** Target position frozen at fire time, so the projectile still renders if the enemy dies mid-flight. */
  toRow: number;
  toCol: number;
  targetEnemyId: string;
  damage: number;
  /** 0..1 animation progress toward the target, consumed within a frame or two. */
  progress: number;
}

export interface GameState {
  version: number;
  gold: number;
  lives: number;
  wave: number;
  waveInProgress: boolean;
  towers: TowerInstance[];
  enemies: Enemy[];
  projectiles: Projectile[];
  enemiesToSpawn: number;
  spawnTimer: number;
  gameOver: boolean;
  /** Total enemies killed this game, shown in the HUD. */
  killCount: number;
}
