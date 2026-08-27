import { ACHIEVEMENT_IDS, type AchievementId } from "./achievements";

const ACHIEVEMENT_STORAGE_KEY = "towerdef-io:achievements:v1";

interface AchievementProfile {
  version: 1;
  earnedIds: AchievementId[];
}

export function loadEarnedAchievements(): AchievementId[] {
  try {
    const raw = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
    if (!raw) return [];
    const profile = JSON.parse(raw) as Partial<AchievementProfile>;
    if (!Array.isArray(profile.earnedIds)) return [];
    const validIds = new Set<string>(ACHIEVEMENT_IDS);
    return [...new Set(profile.earnedIds.filter((id): id is AchievementId => validIds.has(id)))];
  } catch {
    return [];
  }
}

export function saveEarnedAchievements(earnedIds: readonly AchievementId[]): void {
  const profile: AchievementProfile = { version: 1, earnedIds: [...earnedIds] };
  try {
    localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // localStorage unavailable (e.g. private mode) - fail silently
  }
}
