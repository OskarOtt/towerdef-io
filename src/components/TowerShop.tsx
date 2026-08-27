import type { DragEvent } from "react";
import { TOWER_DEFS } from "../game/constants";
import type { TowerDef, TowerGroup } from "../game/types";

interface TowerShopProps {
  gold: number;
  onDragStateChange: (defId: string | null) => void;
}

const GROUP_LABEL: Record<TowerGroup, string> = {
  combat: "COMBAT",
  utility: "UTILITY",
};

export function TowerShop({ gold, onDragStateChange }: TowerShopProps) {
  const handleDragStart = (
    e: DragEvent<HTMLDivElement>,
    defId: string,
    icon: string,
    color: string,
  ) => {
    e.dataTransfer.setData("text/tower-def-id", defId);
    e.dataTransfer.effectAllowed = "copy";

    // Use only the tower glyph as the drag image, not the whole card.
    const ghost = document.createElement("div");
    ghost.textContent = icon;
    ghost.style.cssText = `position:fixed; top:-1000px; left:-1000px; font-size:22px; font-weight:bold; color:${color};`;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 14, 14);
    requestAnimationFrame(() => document.body.removeChild(ghost));
    onDragStateChange(defId);
  };

  const handleDragEnd = () => {
    onDragStateChange(null);
  };

  const renderCard = (def: TowerDef) => {
    const affordable = gold >= def.cost;
    return (
      <div
        key={def.id}
        className={`tower-card ${affordable ? "" : "tower-card-disabled"}`}
        draggable={affordable}
        onDragStart={(e) => handleDragStart(e, def.id, def.icon, def.color)}
        onDragEnd={handleDragEnd}
      >
        <span className="tower-card-icon" style={{ color: def.color }}>
          {def.icon}
        </span>
        <div className="tower-card-info">
          <div className="tower-card-name">{def.name}</div>
          {def.group === "utility" ? (
            <div className="tower-card-stats">
              GOLD/SEC-{def.goldPerSecond ?? 0} BONUS/ROUND-{def.roundEndBonus ?? 0}
            </div>
          ) : (
            <>
              <div className="tower-card-stats">
                DMG-{def.damage} ROF-{def.fireRate}/s
              </div>
              <div className="tower-card-stats">
                RANGE-{def.range} {def.splashRadius && (def.splashRadius>0) ? `SPLASH-${def.splashRadius}` : ""}
              </div>
            </>
          )}
          <div className="tower-card-cost">${def.cost}</div>
        </div>
      </div>
    );
  };

  const combatDefs = TOWER_DEFS.filter((def) => def.group === "combat");
  const utilityDefs = TOWER_DEFS.filter((def) => def.group === "utility");

  return (
    <div className="tower-shop">
      <div className="panel-title">[ TOWER DEPOT ]</div>
      <div className="shop-group-label">[ {GROUP_LABEL.combat} ]</div>
      {combatDefs.map(renderCard)}
      {utilityDefs.length > 0 && (
        <>
          <div className="shop-group-label">[ {GROUP_LABEL.utility} ]</div>
          {utilityDefs.map(renderCard)}
        </>
      )}
      <p className="shop-hint">&gt; DRAG TOWER ONTO OPEN GROUND</p>
    </div>
  );
}

