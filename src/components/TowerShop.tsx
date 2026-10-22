import { useState } from "react";
import type { DragEvent } from "react";
import { TOWER_DEFS } from "../game/constants";
import type { TowerDef, TowerGroup } from "../game/types";

interface TowerShopProps {
  gold: number;
  onDragStateChange: (defId: string | null) => void;
  /** Def id chosen via tap-to-select (mobile), or null if none selected. */
  selectedDefId: string | null;
  onSelectDef: (defId: string | null) => void;
}

const GROUP_LABEL: Record<TowerGroup, string> = {
  combat: "COMBAT",
  utility: "UTILITY",
};

export function TowerShop({
  gold,
  onDragStateChange,
  selectedDefId,
  onSelectDef,
}: TowerShopProps) {
  const [info, setInfo] = useState<{ def: TowerDef; rect: DOMRect } | null>(
    null,
  );

  const statLines = (def: TowerDef): string[] => {
    if (def.id === "stacker") return ["Lets one cell hold more towers"];
    if (def.group === "utility") {
      return [
        `Gold/sec: ${def.goldPerSecond ?? 0}`,
        `Bonus/round: ${def.roundEndBonus ?? 0}`,
      ];
    }
    const lines = [
      `Damage: ${def.damage}`,
      `Fire rate: ${def.fireRate}/s`,
      `Range: ${def.range}`,
    ];
    if (def.chainTargets) lines.push(`Chains to: ${def.chainTargets} enemies`);
    if (def.splashRadius && def.splashRadius > 0) {
      lines.push(`Splash: ${def.splashRadius}`);
    }
    return lines;
  };

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
    const selected = selectedDefId === def.id;
    return (
      <div
        key={def.id}
        className={`tower-card ${affordable ? "" : "tower-card-disabled"} ${
          selected ? "tower-card-selected" : ""
        }`}
        draggable={affordable}
        onDragStart={(e) => handleDragStart(e, def.id, def.icon, def.color)}
        onDragEnd={handleDragEnd}
        onClick={(e) => {
          e.stopPropagation();
          if (affordable) onSelectDef(def.id);
        }}
      >
        <span className="tower-card-icon" style={{ color: def.color }}>
          {def.icon}
        </span>
        <div className="tower-card-info">
          <div className="tower-card-name">{def.name}</div>
          <div className="tower-card-cost">${def.cost}</div>
        </div>
        <span
          className="tower-card-help"
          aria-label={`${def.name} stats`}
          onMouseEnter={(e) =>
            setInfo({ def, rect: e.currentTarget.getBoundingClientRect() })
          }
          onMouseLeave={() => setInfo(null)}
        >
          i
        </span>
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
      {info && (
        <ul
          className="tower-info-popup"
          style={{ top: info.rect.top, left: info.rect.right + 8 }}
        >
          {statLines(info.def).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      <p className="shop-hint">&gt; DRAG OR TAP A TOWER, THEN TAP OPEN GROUND</p>
    </div>
  );
}

