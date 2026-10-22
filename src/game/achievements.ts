import { STACKER_ID, TOWER_DEFS } from "./constants";
import type { GameState, TowerInstance } from "./types";

export const ACHIEVEMENT_IDS = [
  "first-deploy",
  "first-blood",
  "hunter-10",
  "hunter-100",
  "hunter-1000",
  "hunter-10000",
  "hunter-100000",
  "hunter-1000000",
  "wave-10",
  "wave-50",
  "wave-100",
  "wave-1000",
  "full-spectrum",
  "ten-online",
  "first-upgrade",
  "giga-upgrade",
  "god-upgrade",
  "specialist",
  "money1",
  "money2",
  "money3",
  "low-life-clear",
  "flawless-5",
  "flawless-10",
  "flawless-50",
  "frugal-5",
  "frugal-10",
  "lone-god-10",
  "lone-god-50",
  "lone-god-100",
  "stack-2",
  "stack-3",
  "twins",
  "triplets",
  "stack-lv-10",
  "stack-lv-25",
  "stack-lv-50",
  "completionist",
] as const;

export type AchievementId = (typeof ACHIEVEMENT_IDS)[number];

export interface AchievementDefinition {
  id: AchievementId;
  name: string;
  description: string;
  isUnlocked: (state: GameState) => boolean;
}

/** Exactly one GOD tower was ever placed this run, and it is still standing. */
function isLoneGod(state: GameState, wave: number): boolean {
  return (
    state.wave >= wave &&
    state.godTowersPlaced === 1 &&
    state.towers.some((tower) => tower.defId === "god")
  );
}

/** Non-stacker towers grouped by cell, only for cells that actually have a stacker. */
function stackedCells(state: GameState): TowerInstance[][] {
  const cells = new Map<string, TowerInstance[]>();
  for (const tower of state.towers) {
    const key = `${tower.row},${tower.col}`;
    const list = cells.get(key) ?? [];
    list.push(tower);
    cells.set(key, list);
  }
  return [...cells.values()]
    .filter((list) => list.some((t) => t.defId === STACKER_ID))
    .map((list) => list.filter((t) => t.defId !== STACKER_ID));
}

function hasStackOf(state: GameState, count: number): boolean {
  return stackedCells(state).some((cell) => cell.length >= count);
}

function hasSameTypeStackOf(state: GameState, count: number): boolean {
  return stackedCells(state).some((cell) =>
    cell.some((t) => cell.filter((o) => o.defId === t.defId).length >= count),
  );
}

/** A stacked cell with 3 towers that each have some stat at or above `level`. */
function hasUpgradedStack(state: GameState, level: number): boolean {
  return stackedCells(state).some(
    (cell) =>
      cell.filter((t) => Object.values(t.upgrades).some((l) => l >= level)).length >= 3,
  );
}

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  {
    id: "first-deploy",
    name: "FIRST DEPLOYMENT",
    description: "Place your first tower.",
    isUnlocked: (state) => state.towers.length >= 1,
  },
  {
    id: "first-blood",
    name: "FIRST BLOOD",
    description: "Destroy your first hostile.",
    isUnlocked: (state) => state.killCount >= 1,
  },
  {
    id: "hunter-10",
    name: "HUNTER I",
    description: "Destroy 10 hostiles in one game.",
    isUnlocked: (state) => state.killCount >= 10,
  },
  {
    id: "hunter-100",
    name: "HUNTER II",
    description: "Destroy 100 hostiles in one game.",
    isUnlocked: (state) => state.killCount >= 100,
  },
  {
    id: "hunter-1000",
    name: "HUNTER III",
    description: "Destroy 1000 hostiles in one game.",
    isUnlocked: (state) => state.killCount >= 1000,
  },
  {
    id: "hunter-10000",
    name: "HUNTER OMEGA",
    description: "Destroy 10 000 hostiles in one game.",
    isUnlocked: (state) => state.killCount >= 10000,
  },
  {
    id: "hunter-100000",
    name: "HUNTER ULTIMA",
    description: "Destroy 100 000 hostiles in one game.",
    isUnlocked: (state) => state.killCount >= 100000,
  },
  {
    id: "hunter-1000000",
    name: "GOD KILLER",
    description: "Destroy 1 000 000 hostiles in one game.",
    isUnlocked: (state) => state.killCount >= 1000000,
  },
  {
    id: "wave-10",
    name: "PERIMETER SECURED",
    description: "Reach wave 10.",
    isUnlocked: (state) => state.wave >= 10,
  },
  {
    id: "wave-50",
    name: "VETERAN OPERATOR",
    description: "Reach wave 50.",
    isUnlocked: (state) => state.wave >= 50,
  },
  {
    id: "wave-100",
    name: "TITAN GENERAL",
    description: "Reach wave 100.",
    isUnlocked: (state) => state.wave >= 100,
  },
  {
    id: "wave-1000",
    name: "LEGENDARY COMMANDER",
    description: "Reach wave 1000.",
    isUnlocked: (state) => state.wave >= 1000,
  },
  {
    id: "full-spectrum",
    name: "FULL SPECTRUM",
    description: "Deploy every tower type at once.",
    isUnlocked: (state) =>
      TOWER_DEFS.every((definition) =>
        state.towers.some((tower) => tower.defId === definition.id),
      ),
  },
  {
    id: "ten-online",
    name: "GRID ONLINE",
    description: "Have ten towers deployed at once.",
    isUnlocked: (state) => state.towers.length >= 10,
  },
  {
    id: "first-upgrade",
    name: "OVERCLOCKED",
    description: "Purchase your first tower upgrade.",
    isUnlocked: (state) =>
      state.towers.some((tower) =>
        Object.values(tower.upgrades).some((level) => level > 0),
      ),
  },
  {
    id: "giga-upgrade",
    name: "GIGACLOCKED",
    description: "Upgrade a tower to level 10 in any stat.",
    isUnlocked: (state) =>
        state.towers.some((tower) =>
            Object.values(tower.upgrades).some((level) => level >= 10),
        ),
  },
  {
    id: "god-upgrade",
    name: "GODMODE",
    description: "Upgrade a towers total level to 100!",
    isUnlocked: (state) =>
        state.towers.some((tower) =>
            Object.values(tower.upgrades).reduce((sum, level) => sum + level, 0) >= 100,
        ),
  },
  {
    id: "specialist",
    name: "MAXIMUM OUTPUT",
    description: "Raise one tower stat to level 50",
    isUnlocked: (state) =>
      state.towers.some((tower) =>
        Object.values(tower.upgrades).some((level) => level >= 50),
      ),
  },
  {
    id: "money1",
    name: "The saver",
    description: "Have a 5000 gold in the bank.",
    isUnlocked: (state) =>
        state.gold >= 5000,
  },
  {
    id: "money2",
    name: "The loan shark",
    description: "Have a 20000 gold in the bank.",
    isUnlocked: (state) =>
        state.gold >= 20000,
  },
  {
    id: "money3",
    name: "The tycoon",
    description: "Have a 100 000 gold in the bank.",
    isUnlocked: (state) =>
        state.gold >= 100000,
  },
  {
    id: "low-life-clear",
    name: "CLOSE CALL",
    description: "Complete a wave with 5 or fewer lives left.",
    isUnlocked: (state) => state.lowLifeWaveClears >= 1,
  },
  {
    id: "flawless-5",
    name: "FLAWLESS I",
    description: "Clear 5 waves in a row without losing a life.",
    isUnlocked: (state) => state.cleanWaveStreak >= 5,
  },
  {
    id: "flawless-10",
    name: "FLAWLESS II",
    description: "Clear 10 waves in a row without losing a life.",
    isUnlocked: (state) => state.cleanWaveStreak >= 10,
  },
  {
    id: "flawless-50",
    name: "FLAWLESS III",
    description: "Clear 50 waves in a row without losing a life.",
    isUnlocked: (state) => state.cleanWaveStreak >= 50,
  },
  {
    id: "frugal-5",
    name: "PENNY PINCHER I",
    description: "Finish 5 waves in a row without spending any gold.",
    isUnlocked: (state) => state.noSpendWaveStreak >= 5,
  },
  {
    id: "frugal-10",
    name: "PENNY PINCHER II",
    description: "Finish 10 waves in a row without spending any gold.",
    isUnlocked: (state) => state.noSpendWaveStreak >= 10,
  },
  {
    id: "lone-god-10",
    name: "LONE GOD I",
    description: "Reach wave 10 with only one GOD tower placed.",
    isUnlocked: (state) => isLoneGod(state, 10),
  },
  {
    id: "lone-god-50",
    name: "LONE GOD II",
    description: "Reach wave 50 with only one GOD tower placed.",
    isUnlocked: (state) => isLoneGod(state, 50),
  },
  {
    id: "lone-god-100",
    name: "LONE GOD III",
    description: "Reach wave 100 with only one GOD tower placed.",
    isUnlocked: (state) => isLoneGod(state, 100),
  },
  {
    id: "stack-2",
    name: "DOUBLE UP",
    description: "Have 2 towers plus a stacker on the same cell.",
    isUnlocked: (state) => hasStackOf(state, 2),
  },
  {
    id: "stack-3",
    name: "TRIPLE THREAT",
    description: "Have 3 towers plus a stacker on the same cell.",
    isUnlocked: (state) => hasStackOf(state, 3),
  },
  {
    id: "twins",
    name: "TWINS",
    description: "Have 2 of the same tower plus a stacker on the same cell.",
    isUnlocked: (state) => hasSameTypeStackOf(state, 2),
  },
  {
    id: "triplets",
    name: "TRIPLETS",
    description: "Have 3 of the same tower plus a stacker on the same cell.",
    isUnlocked: (state) => hasSameTypeStackOf(state, 3),
  },
  {
    id: "stack-lv-10",
    name: "STACKED POWER I",
    description: "Upgrade 3 towers on the same cell to level 10 in any stat.",
    isUnlocked: (state) => hasUpgradedStack(state, 10),
  },
  {
    id: "stack-lv-25",
    name: "STACKED POWER II",
    description: "Upgrade 3 towers on the same cell to level 25 in any stat.",
    isUnlocked: (state) => hasUpgradedStack(state, 25),
  },
  {
    id: "stack-lv-50",
    name: "STACKED POWER III",
    description: "Upgrade 3 towers on the same cell to level 50 in any stat.",
    isUnlocked: (state) => hasUpgradedStack(state, 50),
  },
  {
    id: "completionist",
    name: "COMPLETIONIST",
    description: "Unlock every other achievement.",
    // Resolved in newlyUnlockedAchievements, which knows the earned set.
    isUnlocked: () => false,
  },
];

export function newlyUnlockedAchievements(
  state: GameState,
  earnedIds: readonly AchievementId[],
): AchievementDefinition[] {
  const earned = new Set(earnedIds);
  const unlocked = ACHIEVEMENTS.filter(
    (achievement) =>
      achievement.id !== "completionist" &&
      !earned.has(achievement.id) &&
      achievement.isUnlocked(state),
  );
  unlocked.forEach((achievement) => earned.add(achievement.id));

  const completionist = ACHIEVEMENTS.find((a) => a.id === "completionist");
  const hasAllOthers = ACHIEVEMENTS.every(
    (a) => a.id === "completionist" || earned.has(a.id),
  );
  if (completionist && hasAllOthers && !earned.has("completionist")) {
    unlocked.push(completionist);
  }
  return unlocked;
}
