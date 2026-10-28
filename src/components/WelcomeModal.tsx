import { useState } from "react";
import { NAME_MAX_LENGTH, normalizeName } from "../game/leaderboardStorage";

interface WelcomeModalProps {
  hasSave: boolean;
  initialName: string | null;
  legacyRun: boolean;
  onStartNew: (name: string) => void;
  onResume: (name: string | null) => void;
}

export function WelcomeModal({ hasSave, initialName, legacyRun, onStartNew, onResume }: WelcomeModalProps) {
  // Require a second click to confirm overwriting an existing save.
  const [confirmNewGame, setConfirmNewGame] = useState(false);

  const [nameDraft, setNameDraft] = useState(initialName ?? "");
  const cleanName = normalizeName(nameDraft);

  const handleNewGameClick = () => {
    if (!cleanName) return;
    if (hasSave && !confirmNewGame) {
      setConfirmNewGame(true);
      return;
    }
    onStartNew(cleanName);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <pre className="modal-ascii">{String.raw`
___  __        ___  __   __   ___  ___     __  
 |  /  \ |  | |__  |__) |  \ |__  |__   | /  \ 
 |  \__/ |/\| |___ |  \ |__/ |___ |    .| \__/ 
`}</pre>
        <p className="modal-text">
          &gt; INCOMING HOSTILE SIGNAL DETECTED.
          <br />
          &gt; DEPLOY TOWERS ALONG THE PATH.
          <br />
          &gt; EARN GOLD. SURVIVE THE WAVES.
        </p>
        <div className="name-field">
          <label className="name-label" htmlFor="lb-name">
            &gt; NAME FOR LEADERBOARD
          </label>
          <input
            id="lb-name"
            className="name-input"
            value={nameDraft}
            maxLength={NAME_MAX_LENGTH}
            placeholder="name for leaderboard"
            autoComplete="off"
            onChange={(e) => setNameDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleNewGameClick();
            }}
          />
        </div>
        {legacyRun && (
          <p className="version-warning">
            &gt; WARNING: YOUR SAVED RUN IS FROM AN OLDER VERSION.
            <br />
            &gt; IT WILL NOT BE TRACKED ON THE LEADERBOARD.
            <br />
            &gt; START A [ NEW GAME ] TO COMPETE.
          </p>
        )}
        <div className="modal-actions">
          <button
            className="term-btn"
            onClick={handleNewGameClick}
            disabled={!cleanName}
            title={cleanName ? undefined : "Name for leaderboard is needed to start a new game"}
          >
            {confirmNewGame ? "[ CONFIRM ]" : "[ NEW GAME ]"}
          </button>
          {hasSave && (
            <button className="term-btn" onClick={() => onResume(cleanName)}>
              [ RESUME GAME ]
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
