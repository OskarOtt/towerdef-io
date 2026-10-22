import type { DragEvent } from "react";
import type { TowerInstance } from "../game/types";
import { towerDefById } from "../game/constants";
import { toRoman, totalUpgradeCount } from "../game/upgrades";

interface CellProps {
  row: number;
  col: number;
  isPath: boolean;
  towers: TowerInstance[];
  /** Whether the dragged/selected shop def can be placed here. */
  canPlace: boolean;
  selectedTowerId: string | null;
  onDropTower: (row: number, col: number, defId: string) => void;
  draggingTower: boolean;
  onSelectTower: (id: string | null) => void;
  onHoverCell: (cell: { row: number; col: number } | null) => void;
  selectedShopDefId: string | null;
  onTapPlaceTower: (row: number, col: number) => void;
}

export function Cell({
  row,
  col,
  isPath,
  towers,
  canPlace,
  selectedTowerId,
  onDropTower,
  draggingTower,
  onSelectTower,
  onHoverCell,
  selectedShopDefId,
  onTapPlaceTower,
}: CellProps) {
  const tower = towers[0];
  const selected = towers.some((t) => t.id === selectedTowerId);
  const buildable = !isPath && canPlace;

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
    onSelectTower(tower ? (selected ? selectedTowerId : tower.id) : null);
  };

  return (
    <div
      className={[
        "cell",
        isPath ? "cell-path" : "cell-buildable",
        buildable ? "cell-droppable" : "",
        buildable && (draggingTower || !!selectedShopDefId) ? "cell-glow" : "",
        towers.length ? "cell-tower" : "",
        selected ? "cell-selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      title={isPath ? "path" : towers.length ? towers.map((t) => towerDefById(t.defId)?.name).join(" + ") : "empty"}
    >
      {towers.length === 1 ? (
        <TowerGlyph tower={towers[0]} />
      ) : (
        towers.length > 1 && (
          <div className="cell-stack">
            {towers.map((t) => (
              <TowerGlyph key={t.id} tower={t} mini />
            ))}
          </div>
        )
      )}
    </div>
  );
}

function TowerGlyph({ tower, mini }: { tower: TowerInstance; mini?: boolean }) {
  const def = towerDefById(tower.defId);
  if (!def) return null;
  const count = totalUpgradeCount(tower);
  const roman = count > 0 ? toRoman(count) : "";
  const content = (
    <>
      <span className={mini ? "tower-icon tower-icon-mini" : "tower-icon"} style={{ color: def.color }}>
        {def.icon}
      </span>
      {roman && (
        <span className={mini ? "tower-upgrade-badge tower-upgrade-badge-mini" : "tower-upgrade-badge"}>
          {roman}
        </span>
      )}
    </>
  );
  return mini ? <div className="cell-stack-item">{content}</div> : content;
}
