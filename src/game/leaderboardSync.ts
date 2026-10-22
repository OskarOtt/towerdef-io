import { ApiError, startRun, submitScore, type ScorePayload } from "../api/leaderboard";
import type { GameState } from "./types";
import { clearRun, loadRun, normalizeName, saveRun } from "./leaderboardStorage";
import { loadEarnedAchievements } from "./achievementStorage";
import { totalUpgradeLevels } from "./upgrades";

export type SubmitResult = "ok" | "skipped" | "error";

export function buildScore(name: string, state: GameState): ScorePayload | null {
  if (state.wave < 1) return null;
  let top: { id: string; level: number } | null = null;
  for (const tower of state.towers) {
    const level = totalUpgradeLevels(tower.upgrades);
    if (!top || level > top.level) top = { id: tower.defId, level };
  }
  if (!top) return null;
  return {
    name,
    wave: state.wave,
    kills: state.killCount,
    topTowerId: top.id,
    topTowerLevel: top.level,
    achievements: loadEarnedAchievements().length,
  };
}

async function ensureRun(forceNew: boolean) {
  if (!forceNew) {
    const existing = loadRun();
    if (existing) return existing;
  }
  const fresh = await startRun();
  saveRun(fresh);
  return fresh;
}

/** Sends the current score. Never throws; a missing/invalid name is a silent skip. */
export async function submitCurrentScore(
  name: string | null | undefined,
  state: GameState,
): Promise<SubmitResult> {
  const clean = normalizeName(name);
  if (!clean) return "skipped";
  const score = buildScore(clean, state);
  if (!score) return "skipped";
  try {
    let ticket = await ensureRun(false);
    try {
      await submitScore(ticket, score);
    } catch (err) {
      // Stale/unknown run (e.g. expired): start a fresh one and retry once.
      if (err instanceof ApiError && [403, 404, 410].includes(err.status)) {
        clearRun();
        ticket = await ensureRun(true);
        await submitScore(ticket, score);
      } else {
        throw err;
      }
    }
    return "ok";
  } catch {
    return "error";
  }
}
