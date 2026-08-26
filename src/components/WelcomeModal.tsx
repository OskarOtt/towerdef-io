import { useState } from "react";

interface WelcomeModalProps {
  hasSave: boolean;
  onStartNew: () => void;
  onResume: () => void;
}

export function WelcomeModal({ hasSave, onStartNew, onResume }: WelcomeModalProps) {
  // Require a second click to confirm overwriting an existing save.
  const [confirmNewGame, setConfirmNewGame] = useState(false);

  const handleNewGameClick = () => {
    if (hasSave && !confirmNewGame) {
      setConfirmNewGame(true);
      return;
    }
    onStartNew();
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
          &gt; DEPLOY TOWERS ALONG THE PATH. DEFEND THE CORE.
          <br />
          &gt; EARN GOLD. SURVIVE THE WAVES.
        </p>
        <div className="modal-actions">
          <button className="term-btn" onClick={handleNewGameClick}>
            {confirmNewGame ? "[ CONFIRM ]" : "[ NEW GAME ]"}
          </button>
          {hasSave && (
            <button className="term-btn" onClick={onResume}>
              [ RESUME GAME ]
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
