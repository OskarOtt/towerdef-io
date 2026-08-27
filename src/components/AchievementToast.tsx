import type { AchievementDefinition } from "../game/achievements";

interface AchievementToastProps {
  achievement: AchievementDefinition;
  remainingFraction: number;
  onDismiss: () => void;
}

export function AchievementToast({
  achievement,
  remainingFraction,
  onDismiss,
}: AchievementToastProps) {
  return (
    <aside className="achievement-toast" aria-live="polite">
      <button
        className="achievement-toast-dismiss"
        aria-label="Dismiss achievement notification"
        onClick={onDismiss}
      >
        [ X ]
      </button>
      <div className="achievement-toast-title">&gt;&gt; ACHIEVEMENT UNLOCKED</div>
      <div className="achievement-toast-name">{achievement.name}</div>
      <div className="achievement-toast-description">{achievement.description}</div>
      <div
        className="achievement-toast-bar"
        style={{ width: `${remainingFraction * 100}%` }}
      />
    </aside>
  );
}
