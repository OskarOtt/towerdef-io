import type { RunTicket } from "../api/leaderboard";

const NAME_KEY = "towerdef.leaderboardName";
const RUN_KEY = "towerdef.leaderboardRun";

export const NAME_MAX_LENGTH = 16;
const NAME_PATTERN = /^[\p{L}\p{N} _.-]+$/u;

export function normalizeName(name: string | null | undefined): string | null {
  const trimmed = (name ?? "").trim();
  if (trimmed.length < 1 || trimmed.length > NAME_MAX_LENGTH) return null;
  return NAME_PATTERN.test(trimmed) ? trimmed : null;
}

export function loadLeaderboardName(): string | null {
  try {
    return normalizeName(localStorage.getItem(NAME_KEY));
  } catch {
    return null;
  }
}

export function saveLeaderboardName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // ignore
  }
}

export function loadRun(): RunTicket | null {
  try {
    const raw = localStorage.getItem(RUN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RunTicket>;
    return typeof parsed.runId === "string" && typeof parsed.token === "string"
      ? { runId: parsed.runId, token: parsed.token }
      : null;
  } catch {
    return null;
  }
}

export function saveRun(run: RunTicket): void {
  try {
    localStorage.setItem(RUN_KEY, JSON.stringify(run));
  } catch {
    // ignore
  }
}

export function clearRun(): void {
  try {
    localStorage.removeItem(RUN_KEY);
  } catch {
    // ignore
  }
}
