import { useCallback, useEffect, useState } from "react";
import { fetchLeaderboard, fetchRunPlacement, type LeaderboardRow } from "../api/leaderboard";
import { loadRun } from "../game/leaderboardStorage";
import { ACHIEVEMENT_IDS } from "../game/achievements";
import { towerDefById } from "../game/constants";

function renderRow(row: LeaderboardRow, isMe: boolean) {
  return (
    <tr key={`${row.rank}-${row.name}`} className={isMe ? "leaderboard-me" : undefined}>
      <td>{row.rank}</td>
      <td>{row.name}</td>
      <td>{row.wave}</td>
      <td>{row.kills}</td>
      <td>
        {(towerDefById(row.topTowerId)?.name ?? row.topTowerId).toUpperCase()} L{row.topTowerLevel}
      </td>
      <td>
        {row.achievements}/{ACHIEVEMENT_IDS.length}
      </td>
    </tr>
  );
}

interface LeaderboardModalProps {
  name: string | null;
  canSubmit: boolean;
  legacyRun: boolean;
  onUpdateScore: () => Promise<"ok" | "skipped" | "error">;
  onClose: () => void;
}

export function LeaderboardModal({
  name,
  canSubmit,
  legacyRun,
  onUpdateScore,
  onClose,
}: LeaderboardModalProps) {
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [me, setMe] = useState<LeaderboardRow | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const runId = loadRun()?.runId;
    const placement = runId ? fetchRunPlacement(runId).catch(() => null) : Promise.resolve(null);
    try {
      setRows(await fetchLeaderboard(30));
      setMe(await placement);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUpdate = async () => {
    setBusy(true);
    setMessage(null);
    const result = await onUpdateScore();
    if (result === "error") setMessage("COULD NOT SEND SCORE. TRY AGAIN LATER.");
    else if (result === "skipped") setMessage("NO SCORE TO SEND YET (PLACE A TOWER, REACH WAVE 1).");
    await load();
    setBusy(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section
        className="modal-box leaderboard-modal"
        aria-modal="true"
        role="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="how-to-play-modal-heading">
          <div className="panel-title">LEADERBOARD</div>
          <div className="leaderboard-heading-actions">
            {name && canSubmit && !legacyRun && (
              <button
                className="term-btn term-btn-small how-to-play-modal-close"
                onClick={handleUpdate}
                disabled={busy}
              >
                [ UPDATE SCORE ]
              </button>
            )}
            <button className="term-btn term-btn-small how-to-play-modal-close" onClick={onClose}>
              [ CLOSE ]
            </button>
          </div>
        </div>

        {legacyRun && (
          <p className="version-warning">
            &gt; WARNING: YOUR CURRENT RUN IS FROM AN OLDER VERSION AND WILL NOT BE TRACKED ON THE
            LEADERBOARD. GO TO THE MENU AND START A [ NEW GAME ] TO COMPETE.
          </p>
        )}

        {!name && (
          <p className="version-warning">
            &gt; YOUR RUN IS NOT ON THE LEADERBOARD. GO TO THE MENU AND START A [ NEW GAME ] WITH A
            NAME TO GET YOUR RUN ON THE LEADERBOARD.
          </p>
        )}

        {message && <div className="leaderboard-message">{message}</div>}

        {loadError ? (
          <div className="leaderboard-message">LEADERBOARD OFFLINE. TRY AGAIN LATER.</div>
        ) : rows === null ? (
          <div className="leaderboard-message">LOADING...</div>
        ) : rows.length === 0 ? (
          <div className="leaderboard-message">NO SCORES YET.</div>
        ) : (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>NAME</th>
                <th>WAVE</th>
                <th>KILLS</th>
                <th>TOP TOWER</th>
                <th>ACH.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => renderRow(row, row.rank === me?.rank))}
              {me && !rows.some((r) => r.rank === me.rank) && (
                <>
                  <tr className="leaderboard-gap">
                    <td colSpan={6}>...</td>
                  </tr>
                  {renderRow(me, true)}
                </>
              )}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
