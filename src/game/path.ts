import type { GridCoord } from "./types";

export const GRID_ROWS = 9;
export const GRID_COLS = 12;

/**
 * Builds a serpentine path from the bottom-left corner to the top-right
 * corner, alternating horizontal rows connected by vertical columns.
 * Produces a long back-and-forth lane as requested.
 */
function buildPath(): GridCoord[] {
  const path: GridCoord[] = [];
  const push = (row: number, col: number) => {
    const last = path[path.length - 1];
    if (!last || last.row !== row || last.col !== col) {
      path.push({ row, col });
    }
  };

  const horizontalRows = [8, 6, 4, 2, 0];
  let goingRight = true;

  for (let i = 0; i < horizontalRows.length; i++) {
    const row = horizontalRows[i];
    if (goingRight) {
      for (let col = 0; col <= GRID_COLS - 1; col++) push(row, col);
    } else {
      for (let col = GRID_COLS - 1; col >= 0; col--) push(row, col);
    }

    const isLast = i === horizontalRows.length - 1;
    if (!isLast) {
      const nextRow = horizontalRows[i + 1];
      const col = goingRight ? GRID_COLS - 1 : 0;
      // step upward one row at a time along the current column
      const step = nextRow < row ? -1 : 1;
      for (let r = row + step; r !== nextRow + step; r += step) {
        push(r, col);
      }
    }
    goingRight = !goingRight;
  }

  return path;
}

export const PATH: GridCoord[] = buildPath();

const pathKeySet = new Set(PATH.map((p) => `${p.row}:${p.col}`));

export function isPathCell(row: number, col: number): boolean {
  return pathKeySet.has(`${row}:${col}`);
}

/** Converts fractional path progress (e.g. 3.4) into a pixel-free grid position. */
export function positionAtProgress(progress: number): { row: number; col: number } {
  const idx = Math.floor(progress);
  const frac = progress - idx;
  const a = PATH[Math.min(idx, PATH.length - 1)];
  const b = PATH[Math.min(idx + 1, PATH.length - 1)];
  return {
    row: a.row + (b.row - a.row) * frac,
    col: a.col + (b.col - a.col) * frac,
  };
}

export const PATH_LENGTH = PATH.length - 1;
