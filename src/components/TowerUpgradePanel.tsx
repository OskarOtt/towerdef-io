import type { TowerInstance } from "../game/types";
import { towerDefById, STACKER_ID, STACKER_UPGRADE_COST } from "../game/constants";
import { extraSlots } from "../game/stacking";
import {
  COMBAT_UPGRADE_STATS,
  UTILITY_UPGRADE_STATS,
  effectiveStats,
  upgradeCost,
  sellValue,
  type UpgradeStat,
} from "../game/upgrades";

interface TowerUpgradePanelProps {
  tower: TowerInstance | null;
  /** All towers sharing the selected tower's cell (rendered as tabs when more than one). */
  cellTowers: TowerInstance[];
  onSelectTab: (id: string) => void;
  onUpgradeStacker: () => void;
  gold: number;
  onUpgrade: (stat: UpgradeStat) => void;
  onSell: () => void;
  onClose: () => void;
}

const STAT_LABEL: Record<UpgradeStat, string> = {
  damage: "DAMAGE",
  fireRate: "FIRE RATE",
  range: "RANGE",
  goldPerSecond: "GOLD/SEC",
  roundEndBonus: "ROUND BONUS",
};

export function TowerUpgradePanel({
  tower,
  cellTowers,
  onSelectTab,
  onUpgradeStacker,
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
  const isUtility = def.group === "utility";
  const isStacker = def.id === STACKER_ID;
  const upgradeStats = isStacker ? [] : isUtility ? UTILITY_UPGRADE_STATS : COMBAT_UPGRADE_STATS;
  const stackedCount = cellTowers.length - 1;
  const sellBlocked = isStacker && stackedCount > 1;

  return (
    <div className="tower-upgrade-panel">
      <div className="panel-title">
        [ {def.name} ]
        <button className="term-btn term-btn-small upgrade-panel-close" onClick={onClose}>
          X
        </button>
      </div>
      {cellTowers.length > 1 && (
        <div className="tower-tabs">
          {cellTowers.map((t) => {
            const d = towerDefById(t.defId);
            return (
              <button
                key={t.id}
                className={`term-btn term-btn-small ${t.id === tower.id ? "tower-tab-active" : ""}`}
                title={d?.name}
                onClick={() => onSelectTab(t.id)}
              >
                <span style={{ color: d?.color }}>{d?.icon}</span>
              </button>
            );
          })}
        </div>
      )}
      <div className="tower-upgrade-stats">
        {isStacker ? (
          <>
            SLOTS {stackedCount}/{extraSlots(tower)}
          </>
        ) : isUtility ? (
          <>
            GOLD/SEC {stats.goldPerSecond.toFixed(1)} &middot; ROUND BONUS{" "}
            {stats.roundEndBonus.toFixed(0)}
          </>
        ) : (
          <>
            DMG {stats.damage.toFixed(1)} &middot; ROF {stats.fireRate.toFixed(2)}/s &middot; RNG{" "}
            {stats.range.toFixed(1)}
          </>
        )}
      </div>
      {upgradeStats.map((stat) => {
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
      {isStacker && (
        <button
          className="term-btn upgrade-btn"
          disabled={!!tower.stackUpgraded || gold < STACKER_UPGRADE_COST}
          onClick={onUpgradeStacker}
        >
          {tower.stackUpgraded
            ? "CAPACITY MAXED (3 TOWERS)"
            : `UPGRADE CAPACITY TO 3 TOWERS - $${STACKER_UPGRADE_COST}`}
        </button>
      )}
      <button className="term-btn upgrade-sell-btn" disabled={sellBlocked} onClick={onSell}>
        {sellBlocked ? "SELL OTHER TOWERS FIRST" : `SELL FOR $${refund}`}
      </button>
    </div>
  );
}
