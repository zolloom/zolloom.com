// Geometry of the hollow square motif: an N×N grid where only the outer ring
// (`thickness` cells wide) is filled. 8×8 with thickness 2 keeps the original
// proportions (160px square, 40px border).

export function squareCells(size = 8, thickness = 2) {
  if (!Number.isInteger(size) || !Number.isInteger(thickness) || size < 1 || thickness < 1) {
    throw new RangeError('squareCells: size and thickness must be positive integers');
  }
  if (thickness * 2 > size) {
    throw new RangeError('squareCells: thickness is too large for the size');
  }
  const cells = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const onRing =
        row < thickness || row >= size - thickness || col < thickness || col >= size - thickness;
      if (onRing) {
        cells.push({ row, col, index: cells.length, bit: (row + col) % 2 === 0 ? '1' : '0' });
      }
    }
  }
  return cells;
}

export function cellDistance(a, b) {
  return Math.hypot(a.row - b.row, a.col - b.col);
}

export function nearestCell(cells, row, col) {
  let best = null;
  let bestDistance = Infinity;
  for (const cell of cells) {
    const d = cellDistance(cell, { row, col });
    if (d < bestDistance) {
      best = cell;
      bestDistance = d;
    }
  }
  return best;
}
