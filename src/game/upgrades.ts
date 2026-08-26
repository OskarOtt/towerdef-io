import type { TowerDef, TowerInstance, TowerUpgrades } from "./types";

export const UPGRADE_STATS = ["damage", "fireRate", "range"] as const;
export type UpgradeStat = (typeof UPGRADE_STATS)[number];

/** Fraction of base stat added per upgrade level, per stat. */
const BONUS_PER_LEVEL: Record<UpgradeStat, number> = {
  damage: 0.2,
  fireRate: 0.15,
  range: 0.1,
};

/** Fraction of sell refund based on total gold ever spent on a tower. */
export const SELL_REFUND_RATE = 0.6;

/** Cost of the *next* upgrade for a stat currently at `currentLevel`. Uncapped, grows exponentially. */
export function upgradeCost(def: TowerDef, currentLevel: number): number {
  return Math.round(def.cost * 0.5 * Math.pow(1.5, currentLevel));
}

export function emptyUpgrades(): TowerUpgrades {
  return { damage: 0, fireRate: 0, range: 0 };
}

/** Effective (post-upgrade) damage/fireRate/range for a tower. */
export function effectiveStats(
  def: TowerDef,
  upgrades: TowerUpgrades,
): { damage: number; fireRate: number; range: number } {
  return {
    damage: def.damage * (1 + BONUS_PER_LEVEL.damage * upgrades.damage),
    fireRate: def.fireRate * (1 + BONUS_PER_LEVEL.fireRate * upgrades.fireRate),
    range: def.range * (1 + BONUS_PER_LEVEL.range * upgrades.range),
  };
}

/** Gold refunded when selling a tower: a fraction of everything ever spent on it. */
export function sellValue(tower: TowerInstance): number {
  return Math.round(tower.totalSpent * SELL_REFUND_RATE);
}

/** Combined upgrade count across all stats, used to size the roman-numeral badge. */
export function totalUpgradeCount(tower: TowerInstance): number {
  return tower.upgrades.damage + tower.upgrades.fireRate + tower.upgrades.range;
}

const ROMAN_TABLE: [number, string][] = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

/** Converts a positive integer to roman numerals. Returns "" for n <= 0. */
export function toRoman(n: number): string {
  if (n <= 0) return "";
  let remaining = Math.floor(n);
  let result = "";
  for (const [value, symbol] of ROMAN_TABLE) {
    while (remaining >= value) {
      result += symbol;
      remaining -= value;
    }
  }
  return result;
}
