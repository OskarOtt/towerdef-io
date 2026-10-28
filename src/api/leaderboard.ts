const API_BASE: string = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export interface RunTicket {
  runId: string;
  token: string;
}

export interface ScorePayload {
  name: string;
  wave: number;
  kills: number;
  topTowerId: string;
  topTowerLevel: number;
  achievements: number;
  gameVersion: number;
}

export interface LeaderboardRow {
  rank: number;
  name: string;
  wave: number;
  kills: number;
  topTowerId: string;
  topTowerLevel: number;
  achievements: number;
  gameVersion: number;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number) {
    super(`HTTP ${status}`);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) throw new ApiError(res.status);
  return (await res.json()) as T;
}

export function startRun(): Promise<RunTicket> {
  return request<RunTicket>("/api/runs", { method: "POST" });
}

export function submitScore(ticket: RunTicket, score: ScorePayload): Promise<{ rank: number }> {
  return request<{ rank: number }>(`/api/runs/${encodeURIComponent(ticket.runId)}/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: ticket.token, ...score }),
  });
}

export async function fetchRunPlacement(runId: string): Promise<LeaderboardRow | null> {
  try {
    return await request<LeaderboardRow>(`/api/leaderboard/run/${encodeURIComponent(runId)}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export function fetchLeaderboard(limit = 30): Promise<LeaderboardRow[]> {
  return request<LeaderboardRow[]>(`/api/leaderboard?limit=${limit}`);
}
