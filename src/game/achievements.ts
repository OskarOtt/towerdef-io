import { TOWER_DEFS } from "./constants";
import type { GameState } from "./types";

export const ACHIEVEMENT_IDS = [
  "first-deploy",
  "first-blood",
  "hunter-10",
  "hunter-100",
  "hunter-1000",
  "hunter-10000",
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
] as const;

export type AchievementId = (typeof ACHIEVEMENT_IDS)[number];

export interface AchievementDefinition {
  id: AchievementId;
  name: string;
  description: string;
  isUnlocked: (state: GameState) => boolean;
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
];

export function newlyUnlockedAchievements(
  state: GameState,
  earnedIds: readonly AchievementId[],
): AchievementDefinition[] {
  const earned = new Set(earnedIds);
  return ACHIEVEMENTS.filter(
    (achievement) => !earned.has(achievement.id) && achievement.isUnlocked(state),
  );
}
