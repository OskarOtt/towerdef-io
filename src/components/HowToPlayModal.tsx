interface HowToPlayModalProps {
  onClose: () => void;
}

const STEPS = [
  "Drag a tower from the Tower Depot onto the board to place it.",
  "Press [ START WAVE ] on the right panel. Enemies spawn at the green arrow and march toward the orange square — don't let them reach it!",
  "Click a placed tower to open its upgrade menu on the right side, where you can boost its stats or sell it.",
];

export function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <section
        className="modal-box how-to-play-modal"
        aria-modal="true"
        role="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="how-to-play-modal-heading">
          <div className="panel-title">HOW TO PLAY</div>
          <button className="term-btn term-btn-small how-to-play-modal-close" onClick={onClose}>
            [ CLOSE ]
          </button>
        </div>
        <ol className="how-to-play-list">
          {STEPS.map((step, i) => (
            <li key={i} className="how-to-play-entry">
              {step}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
