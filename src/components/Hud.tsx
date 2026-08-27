interface HudProps {
  gold: number;
  lives: number;
  wave: number;
  killCount: number;
  waveInProgress: boolean;
  gameOver: boolean;
  speed: number;
  autoStart: boolean;
  /** Fraction (1 = full delay remaining, 0 = about to fire) of the autostart countdown, or null when not counting down. */
  autoStartFraction: number | null;
  onStartWave: () => void;
  onNewGame: () => void;
  onSetSpeed: (speed: number) => void;
  onToggleAutoStart: (checked: boolean) => void;
}

export function Hud({
  gold,
  lives,
  wave,
  killCount,
  waveInProgress,
  gameOver,
  speed,
  autoStart,
  autoStartFraction,
  onStartWave,
  onNewGame,
  onSetSpeed,
  onToggleAutoStart,
}: HudProps) {
  return (
    <div className="hud">
      <div className="hud-stat">GOLD: ${Math.floor(gold)}</div>
      <div className="hud-stat">LIVES: {lives}</div>
      <div className="hud-stat">WAVE: {wave}</div>
      <div className="hud-stat">KILLS: {killCount}</div>
      {!gameOver && (
        <>
          <button className="term-btn term-btn-autostart" onClick={onStartWave} disabled={waveInProgress}>
            {waveInProgress ? "[ WAVE IN PROGRESS ]" : "[ START WAVE ]"}
            {autoStartFraction !== null && (
              <span
                className="autostart-bar"
                style={{ width: `${autoStartFraction * 100}%` }}
              />
            )}
          </button>
          <label className="autostart-toggle">
            <input
              type="checkbox"
              checked={autoStart}
              onChange={(e) => onToggleAutoStart(e.target.checked)}
            />
            AUTOSTART
          </label>
          <div className="speed-label">SPEED:</div>
          <div className="speed-controls">
            {[1, 3, 5].map((s) => (
              <button
                key={s}
                className={`term-btn term-btn-small ${speed === s ? "term-btn-active" : ""}`}
                onClick={() => onSetSpeed(s)}
              >
                {s}x
              </button>
            ))}
          </div>
        </>
      )}
      {gameOver && (
        <>
          <div className="hud-stat hud-gameover">***CORE BREACHED***</div>
          <button className="term-btn" onClick={onNewGame}>
            [ RESTART ]
          </button>
        </>
      )}
    </div>
  );
}
