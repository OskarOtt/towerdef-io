import { ACHIEVEMENTS, type AchievementId } from "../game/achievements";

interface AchievementsModalProps {
  earnedIds: readonly AchievementId[];
  onClose: () => void;
}

export function AchievementsModal({ earnedIds, onClose }: AchievementsModalProps) {
  const earned = new Set(earnedIds);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section
        className="modal-box achievements-modal"
        aria-modal="true"
        role="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="achievements-modal-heading">
          <div>
            <div className="panel-title">ACHIEVEMENT LOG</div>
            <div className="achievements-count">
              UNLOCKED: {earnedIds.length}/{ACHIEVEMENTS.length}
            </div>
          </div>
          <button className="term-btn term-btn-small achievements-modal-close" onClick={onClose}>
            [ CLOSE ]
          </button>
        </div>
        <div className="achievements-list">
          {ACHIEVEMENTS.map((achievement) => {
            const isEarned = earned.has(achievement.id);
            return (
              <div
                className={`achievement-entry${isEarned ? "" : " achievement-entry-locked"}`}
                key={achievement.id}
              >
                <div className="achievement-entry-status">
                  {isEarned ? "[ COMPLETE ]" : "[ LOCKED ]"}
                </div>
                <div>
                  <div className="achievement-entry-name">{achievement.name}</div>
                  <div className="achievement-entry-description">{achievement.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
