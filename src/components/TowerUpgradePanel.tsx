import type { TowerInstance } from "../game/types";
import { towerDefById } from "../game/constants";
import {
  UPGRADE_STATS,
  effectiveStats,
  upgradeCost,
  sellValue,
  type UpgradeStat,
} from "../game/upgrades";

interface TowerUpgradePanelProps {
  tower: TowerInstance | null;
  gold: number;
  onUpgrade: (stat: UpgradeStat) => void;
  onSell: () => void;
  onClose: () => void;
}

const STAT_LABEL: Record<UpgradeStat, string> = {
  damage: "DAMAGE",
  fireRate: "FIRE RATE",
  range: "RANGE",
};

export function TowerUpgradePanel({
  tower,
  gold,
  onUpgrade,
  onSell,
  onClose,
}: TowerUpgradePanelProps) {
  if (!tower) return null;
  const def = towerDefById(tower.defId);
  if (!def) return null;

  const stats = effectiveStats(def, tower.upgrades);
  const refund = sellValue(tower);

  return (
    <div className="tower-upgrade-panel">
      <div className="panel-title">
        [ {def.name} ]
        <button className="term-btn term-btn-small upgrade-panel-close" onClick={onClose}>
          X
        </button>
      </div>
      <div className="tower-upgrade-stats">
        DMG {stats.damage.toFixed(1)} &middot; ROF {stats.fireRate.toFixed(2)}/s &middot; RNG{" "}
        {stats.range.toFixed(1)}
      </div>
      {UPGRADE_STATS.map((stat) => {
        const cost = upgradeCost(def, tower.upgrades[stat]);
        const affordable = gold >= cost;
        return (
          <button
            key={stat}
            className="term-btn upgrade-btn"
            disabled={!affordable}
            onClick={() => onUpgrade(stat)}
          >
            UPGRADE {STAT_LABEL[stat]} (LV {tower.upgrades[stat]}) - ${cost}
          </button>
        );
      })}
      <button className="term-btn upgrade-sell-btn" onClick={onSell}>
        SELL FOR ${refund}
      </button>
    </div>
  );
}
