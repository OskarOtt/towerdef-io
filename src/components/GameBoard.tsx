import { useEffect, useState } from "react";
import type { GameState } from "../game/types";
import { GRID_ROWS, GRID_COLS, isPathCell, positionAtProgress } from "../game/path";
import { Cell } from "./Cell";
import { towerDefById } from "../game/constants";
import { effectiveStats } from "../game/upgrades";

interface GameBoardProps {
  state: GameState;
  onDropTower: (row: number, col: number, defId: string) => void;
  draggingTower: boolean;
  draggingDefId: string | null;
  selectedTowerId: string | null;
  onSelectTower: (id: string | null) => void;
}

export function GameBoard({
  state,
  onDropTower,
  draggingTower,
  draggingDefId,
  selectedTowerId,
  onSelectTower,
}: GameBoardProps) {
  const towerAt = (row: number, col: number) =>
    state.towers.find((t) => t.row === row && t.col === col);

  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(
    null,
  );

  useEffect(() => {
    if (!draggingDefId) setHoveredCell(null);
  }, [draggingDefId]);

  useEffect(() => {
    if (!draggingDefId) return;
    const clear = () => setHoveredCell(null);
    window.addEventListener("dragend", clear);
    window.addEventListener("drop", clear);
    return () => {
      window.removeEventListener("dragend", clear);
      window.removeEventListener("drop", clear);
    };
  }, [draggingDefId]);

  const selectedTower = state.towers.find((t) => t.id === selectedTowerId);
  const selectedDef = selectedTower ? towerDefById(selectedTower.defId) : undefined;
  const selectedRange =
    selectedTower && selectedDef
      ? effectiveStats(selectedDef, selectedTower.upgrades).range
      : 0;

  const draggingDef = draggingDefId ? towerDefById(draggingDefId) : undefined;
  const previewCell =
    draggingDef && hoveredCell && !isPathCell(hoveredCell.row, hoveredCell.col) && !towerAt(hoveredCell.row, hoveredCell.col)
      ? hoveredCell
      : null;

  const cells = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const tower = towerAt(row, col);
      cells.push(
        <Cell
          key={`${row}-${col}`}
          row={row}
          col={col}
          isPath={isPathCell(row, col)}
          tower={tower}
          onDropTower={onDropTower}
          draggingTower={draggingTower}
          selected={!!tower && tower.id === selectedTowerId}
          onSelectTower={onSelectTower}
          onHoverCell={setHoveredCell}
        />,
      );
    }
  }

  return (
    <div
      className="board-wrap"
      onClick={(e) => e.stopPropagation()}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setHoveredCell(null);
        }
      }}
    >
      <div
        className="board-grid"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
        }}
      >
        {cells}
      </div>
      <div className="board-overlay">
        {selectedTower && (
          <div
            className="tower-range-circle"
            style={{
              left: `${((selectedTower.col + 0.5) / GRID_COLS) * 100}%`,
              top: `${((selectedTower.row + 0.5) / GRID_ROWS) * 100}%`,
              width: `${((selectedRange * 2) / GRID_COLS) * 100}%`,
              height: `${((selectedRange * 2) / GRID_ROWS) * 100}%`,
            }}
          />
        )}
        {previewCell && draggingDef && (
          <div
            className="tower-range-circle tower-range-preview"
            style={{
              left: `${((previewCell.col + 0.5) / GRID_COLS) * 100}%`,
              top: `${((previewCell.row + 0.5) / GRID_ROWS) * 100}%`,
              width: `${((draggingDef.range * 2) / GRID_COLS) * 100}%`,
              height: `${((draggingDef.range * 2) / GRID_ROWS) * 100}%`,
            }}
          />
        )}
        {state.projectiles.map((proj) => {
          const left =
            ((proj.fromCol + (proj.toCol - proj.fromCol) * proj.progress + 0.5) /
              GRID_COLS) *
            100;
          const top =
            ((proj.fromRow + (proj.toRow - proj.fromRow) * proj.progress + 0.5) /
              GRID_ROWS) *
            100;
          return (
            <div
              key={proj.id}
              className="projectile"
              style={{ left: `${left}%`, top: `${top}%` }}
            />
          );
        })}
        {state.enemies.map((enemy) => {
          const pos = positionAtProgress(enemy.pathProgress);
          const left = ((pos.col + 0.5) / GRID_COLS) * 100;
          const top = ((pos.row + 0.5) / GRID_ROWS) * 100;
          const hpPct = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
          return (
            <div
              key={enemy.id}
              className="enemy"
              style={{ left: `${left}%`, top: `${top}%` }}
            >
              <div className={`enemy-glyph enemy-${enemy.kind}`}>
                {enemy.kind === "boss" ? "Q" : enemy.kind}
              </div>
              <div className="enemy-hp-bar">
                <div className="enemy-hp-fill" style={{ width: `${hpPct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
