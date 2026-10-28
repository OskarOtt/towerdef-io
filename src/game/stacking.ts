import type { TowerInstance } from "./types";
import { STACKER_BASE_SLOTS, STACKER_ID, STACKER_UPGRADED_SLOTS } from "./constants";

export function towersAt(towers: TowerInstance[], row: number, col: number): TowerInstance[] {
  return towers.filter((t) => t.row === row && t.col === col);
}

/** Fractional-cell offset of a tower's icon within a shared cell, matching the 2x2 icon grid in Cell. */
export function stackOffset(towers: TowerInstance[], tower: TowerInstance): { row: number; col: number } {
  const here = towersAt(towers, tower.row, tower.col);
  if (here.length <= 1) return { row: 0, col: 0 };
  const i = here.findIndex((t) => t.id === tower.id);
  return {
    col: i % 2 === 0 ? -0.25 : 0.25,
    row: here.length === 2 ? 0 : i < 2 ? -0.25 : 0.25,
  };
}

export function extraSlots(stacker: TowerInstance): number {
  return stacker.stackUpgraded ? STACKER_UPGRADED_SLOTS : STACKER_BASE_SLOTS;
}

/** Whether a tower of `defId` may be placed on this (non-path) cell. */
export function canPlaceAt(towers: TowerInstance[], row: number, col: number, defId: string): boolean {
  const here = towersAt(towers, row, col);
  if (here.length === 0) return true;
  const stacker = here.find((t) => t.defId === STACKER_ID);
  // A cell without a stacker holds one tower; a STACKER may be added on top of it.
  if (!stacker) return defId === STACKER_ID;
  if (defId === STACKER_ID) return false;
  return here.length - 1 < extraSlots(stacker);
}
