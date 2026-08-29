import type { DragEvent } from "react";
import type { TowerInstance } from "../game/types";
import { towerDefById } from "../game/constants";
import { toRoman, totalUpgradeCount } from "../game/upgrades";

interface CellProps {
  row: number;
  col: number;
  isPath: boolean;
  tower: TowerInstance | undefined;
  onDropTower: (row: number, col: number, defId: string) => void;
  draggingTower: boolean;
  selected: boolean;
  onSelectTower: (id: string | null) => void;
  onHoverCell: (cell: { row: number; col: number } | null) => void;
  selectedShopDefId: string | null;
  onTapPlaceTower: (row: number, col: number) => void;
}

export function Cell({
  row,
  col,
  isPath,
  tower,
  onDropTower,
  draggingTower,
  selected,
  onSelectTower,
  onHoverCell,
  selectedShopDefId,
  onTapPlaceTower,
}: CellProps) {
  const buildable = !isPath && !tower;

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (buildable) e.preventDefault();
    onHoverCell({ row, col });
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const defId = e.dataTransfer.getData("text/tower-def-id");
    if (buildable && defId) onDropTower(row, col, defId);
    onHoverCell(null);
  };

  const handleClick = () => {
    if (buildable && selectedShopDefId) {
      onTapPlaceTower(row, col);
      return;
    }
    onSelectTower(tower ? tower.id : null);
  };

  const def = tower ? towerDefById(tower.defId) : undefined;
  const upgradeCount = tower ? totalUpgradeCount(tower) : 0;
  const roman = upgradeCount > 0 ? toRoman(upgradeCount) : "";

  return (
    <div
      className={[
        "cell",
        isPath ? "cell-path" : "cell-buildable",
        buildable ? "cell-droppable" : "",
        buildable && (draggingTower || !!selectedShopDefId) ? "cell-glow" : "",
        tower ? "cell-tower" : "",
        selected ? "cell-selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      title={isPath ? "path" : def ? def.name : "empty"}
    >
      {def && (
        <span className="tower-icon" style={{ color: def.color }}>
          {def.icon}
        </span>
      )}
      {roman && <span className="tower-upgrade-badge">{roman}</span>}
    </div>
  );
}
