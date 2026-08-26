interface HudProps {
  gold: number;
  lives: number;
  wave: number;
  waveInProgress: boolean;
  gameOver: boolean;
  speed: number;
  onStartWave: () => void;
  onNewGame: () => void;
  onSetSpeed: (speed: number) => void;
}

export function Hud({
  gold,
  lives,
  wave,
  waveInProgress,
  gameOver,
  speed,
  onStartWave,
  onNewGame,
  onSetSpeed,
}: HudProps) {
  return (
    <div className="hud">
      <div className="hud-stat">GOLD: ${gold}</div>
      <div className="hud-stat">LIVES: {lives}</div>
      <div className="hud-stat">WAVE: {wave}</div>
      {!gameOver && (
        <>
          <button className="term-btn" onClick={onStartWave} disabled={waveInProgress}>
            {waveInProgress ? "[ WAVE IN PROGRESS ]" : "[ START WAVE ]"}
          </button>
          <div className="speed-label">SPEED:</div>
          <div className="speed-controls">
            {[1, 2, 3].map((s) => (
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
          <div className="hud-stat hud-gameover">*** CORE BREACHED ***</div>
          <button className="term-btn" onClick={onNewGame}>
            [ RESTART ]
          </button>
        </>
      )}
    </div>
  );
}
