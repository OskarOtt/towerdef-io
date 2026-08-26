import type { DragEvent } from "react";
import { TOWER_DEFS } from "../game/constants";

interface TowerShopProps {
  gold: number;
  onDragStateChange: (defId: string | null) => void;
}

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

  return (
    <div className="tower-shop">
      <div className="panel-title">[ TOWER DEPOT ]</div>
      {TOWER_DEFS.map((def) => {
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
              <div className="tower-card-stats">
                RNG {def.range} DMG {def.damage} ROF {def.fireRate}/s
              </div>
              <div className="tower-card-cost">${def.cost}</div>
            </div>
          </div>
        );
      })}
      <p className="shop-hint">&gt; DRAG TOWER ONTO OPEN GROUND</p>
    </div>
  );
}
